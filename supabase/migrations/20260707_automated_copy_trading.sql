-- Migration: Automated Copy Trading Positions Tracking & Daily Returns Engine
-- File: supabase/migrations/20260707_automated_copy_trading.sql

-- 1. Create copy_trader_positions table to track active and closed simulated positions
CREATE TABLE IF NOT EXISTS public.copy_trader_positions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trader_id uuid NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    type text NOT NULL CHECK (type IN ('BUY', 'SELL')),
    entry_price numeric(20,8) NOT NULL,
    exit_price numeric(20,8),
    profit_loss_percent numeric(8,4),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at timestamptz DEFAULT now(),
    closed_at timestamptz
);

-- Indexing for lookup speed
CREATE INDEX IF NOT EXISTS idx_copy_trader_pos_trader ON public.copy_trader_positions(trader_id);
CREATE INDEX IF NOT EXISTS idx_copy_trader_pos_status ON public.copy_trader_positions(status);

-- 2. Add last_processed_at column to copy_trading_subscriptions to keep track of payouts
ALTER TABLE public.copy_trading_subscriptions ADD COLUMN IF NOT EXISTS last_processed_at timestamptz DEFAULT now();

-- Enable RLS
ALTER TABLE public.copy_trader_positions ENABLE ROW LEVEL SECURITY;

-- Security policies for copy_trader_positions
CREATE POLICY "Copy trader positions are viewable by everyone"
ON public.copy_trader_positions FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage copy trader positions"
ON public.copy_trader_positions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- 3. Function to simulate master trader market actions
CREATE OR REPLACE FUNCTION public.simulate_global_trader_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    t RECORD;
    last_trade RECORD;
    is_win BOOLEAN;
    pl_percent numeric(8,4);
    p_symbol text;
    p_type text;
    p_entry numeric(20,8);
    p_exit numeric(20,8);
    now_time timestamptz := now();
    symbols text[] := ARRAY['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOT/USDT'];
    types text[] := ARRAY['BUY', 'SELL'];
BEGIN
    -- Loop through all active copy traders
    FOR t IN SELECT * FROM public.copy_traders WHERE is_active = true LOOP
        -- Get their latest position
        SELECT * INTO last_trade 
        FROM public.copy_trader_positions 
        WHERE trader_id = t.id 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        IF last_trade.id IS NOT NULL AND last_trade.status = 'open' THEN
            -- There is an open trade. Should we close it?
            -- Close if open for more than 4 hours, or 25% chance if open for more than 1 hour
            IF now_time >= last_trade.created_at + interval '4 hours' OR 
               (now_time >= last_trade.created_at + interval '1 hour' AND random() < 0.25) THEN
                
                -- Determine win/loss based on trader win rate
                is_win := (random() * 100) <= t.win_rate;
                
                IF is_win THEN
                    -- Win: +1.2% to +4.8%
                    pl_percent := 1.2 + (random() * 3.6);
                ELSE
                    -- Loss: -0.8% to -3.2%
                    pl_percent := -(0.8 + (random() * 2.4));
                END IF;
                
                p_exit := last_trade.entry_price * (1 + (pl_percent / 100));
                
                UPDATE public.copy_trader_positions
                SET 
                    status = 'closed',
                    exit_price = p_exit,
                    profit_loss_percent = pl_percent,
                    closed_at = now_time
                WHERE id = last_trade.id;
                
                -- Update trader stats
                IF is_win THEN
                    UPDATE public.copy_traders 
                    SET trades_won = trades_won + 1, roi_percent = roi_percent + pl_percent
                    WHERE id = t.id;
                ELSE
                    UPDATE public.copy_traders 
                    SET trades_lost = trades_lost + 1, roi_percent = roi_percent + pl_percent
                    WHERE id = t.id;
                END IF;
                
            END IF;
        ELSE
            -- No open trade. Should we open one?
            -- Open if there is no previous trade, or 35% chance if latest trade closed > 2 hours ago
            IF last_trade.id IS NULL OR 
               (last_trade.status = 'closed' AND now_time >= last_trade.closed_at + interval '2 hours' AND random() < 0.35) THEN
                
                -- Choose symbol & direction
                p_symbol := symbols[floor(random() * array_length(symbols, 1) + 1)];
                p_type := types[floor(random() * array_length(types, 1) + 1)];
                
                -- Generate entry price
                IF p_symbol = 'BTC/USDT' THEN p_entry := 60000 + (random() * 15000);
                ELSIF p_symbol = 'ETH/USDT' THEN p_entry := 3000 + (random() * 800);
                ELSIF p_symbol = 'SOL/USDT' THEN p_entry := 130 + (random() * 60);
                ELSE p_entry := 1 + (random() * 10);
                END IF;
                
                INSERT INTO public.copy_trader_positions (trader_id, symbol, type, entry_price, status, created_at)
                VALUES (t.id, p_symbol, p_type, p_entry, 'open', now_time);
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 4. Payout engine for processing copy trading returns per user
CREATE OR REPLACE FUNCTION public.process_user_copy_trades(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub RECORD;
    pos RECORD;
    profit_loss_amount numeric(20,8);
    credited_count integer := 0;
    total_net_pnl numeric(20,8) := 0;
    now_time timestamptz := now();
BEGIN
    -- Run the global trader simulation to ensure we have recent trades
    PERFORM public.simulate_global_trader_activity();
    
    -- Find active copy trading subscriptions for the target user
    FOR sub IN 
        SELECT 
            s.id as sub_id,
            s.amount as sub_amount,
            s.trader_id,
            s.created_at as sub_created_at,
            COALESCE(s.last_processed_at, s.created_at) as last_time,
            t.name as trader_name
        FROM public.copy_trading_subscriptions s
        JOIN public.copy_traders t ON s.trader_id = t.id
        WHERE s.user_id = target_user_id
          AND s.status = 'active'
    LOOP
        -- Find all closed positions for this trader that closed after the last processed time
        FOR pos IN 
            SELECT * 
            FROM public.copy_trader_positions
            WHERE trader_id = sub.trader_id
              AND status = 'closed'
              AND closed_at > sub.last_time
              AND closed_at >= sub.sub_created_at
            ORDER BY closed_at ASC
        LOOP
            -- Calculate PnL: subscription_amount * (profit_loss_percent / 100)
            profit_loss_amount := sub.sub_amount * (pos.profit_loss_percent / 100);
            
            -- Update user profile balance and total_profit
            UPDATE public.profiles
            SET 
                balance = balance + profit_loss_amount,
                total_profit = total_profit + profit_loss_amount
            WHERE id = target_user_id;
            
            -- Insert transaction record
            INSERT INTO public.transactions (
                user_id,
                type,
                amount,
                status,
                description,
                created_at,
                metadata
            ) VALUES (
                target_user_id,
                CASE WHEN profit_loss_amount >= 0 THEN 'profit'::text ELSE 'withdrawal'::text END,
                ABS(profit_loss_amount),
                'completed',
                'Copy trade profit/loss payout — ' || sub.trader_name || ' closed ' || pos.type || ' ' || pos.symbol || ' (' || CASE WHEN pos.profit_loss_percent >= 0 THEN '+' ELSE '' END || pos.profit_loss_percent || '%)',
                pos.closed_at,
                jsonb_build_object(
                    'is_copy_trade', true,
                    'trader_id', sub.trader_id,
                    'trader_name', sub.trader_name,
                    'symbol', pos.symbol,
                    'pnl_percent', pos.profit_loss_percent,
                    'position_id', pos.id
                )
            );
            
            -- Insert notification
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at
            ) VALUES (
                target_user_id,
                CASE WHEN profit_loss_amount >= 0 THEN 'Copy Trade Profit' ELSE 'Copy Trade Loss' END,
                'Master trader ' || sub.trader_name || ' closed ' || pos.symbol || ' ' || pos.type || ' with ' || CASE WHEN pos.profit_loss_percent >= 0 THEN '+' ELSE '' END || pos.profit_loss_percent || '% PnL. Payout: ' || CASE WHEN profit_loss_amount >= 0 THEN '+$' ELSE '-$' END || ABS(round(profit_loss_amount::numeric, 2))::text || '.',
                CASE WHEN profit_loss_amount >= 0 THEN 'success'::text ELSE 'warning'::text END,
                pos.closed_at
            );
            
            credited_count := credited_count + 1;
            total_net_pnl := total_net_pnl + profit_loss_amount;
            
            -- Update subscription last_processed_at
            UPDATE public.copy_trading_subscriptions
            SET last_processed_at = pos.closed_at
            WHERE id = sub.sub_id;
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'credited_count', credited_count,
        'total_net_pnl', total_net_pnl
    );
END;
$$;

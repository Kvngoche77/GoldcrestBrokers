-- =============================================================
-- Migration: Fix all missing copy-trading columns & tables
-- Generated: 2026-08-14T08:02:24.361Z
-- Apply via: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- 1. copy_traders – professional metric columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.copy_traders
  ADD COLUMN IF NOT EXISTS total_active_days integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS leverage text DEFAULT '1:500',
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'MT5',
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_drawdown numeric(6,2) DEFAULT 4.50,
  ADD COLUMN IF NOT EXISTS equity numeric(20,2) DEFAULT 75000.00,
  ADD COLUMN IF NOT EXISTS performance_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strategy_history jsonb DEFAULT '[]'::jsonb;

-- Backfill defaults for existing traders
UPDATE public.copy_traders
SET
  total_active_days   = COALESCE(NULLIF(total_active_days, 0), 120),
  currency            = COALESCE(NULLIF(currency, ''), 'USD'),
  leverage            = COALESCE(NULLIF(leverage, ''), '1:500'),
  platform            = COALESCE(NULLIF(platform, ''), 'MT5'),
  account_type        = COALESCE(NULLIF(account_type, ''), 'Standard'),
  risk_score          = COALESCE(NULLIF(risk_score, 0), 3),
  max_drawdown        = COALESCE(NULLIF(max_drawdown, 0), 4.50),
  equity              = COALESCE(NULLIF(equity, 0), 75000.00),
  performance_history = CASE
    WHEN performance_history IS NULL OR performance_history = '[]'::jsonb THEN
      jsonb_build_array(
        jsonb_build_object('month', 'Jan', 'roi', 12.4),
        jsonb_build_object('month', 'Feb', 'roi', 14.8),
        jsonb_build_object('month', 'Mar', 'roi', 18.2),
        jsonb_build_object('month', 'Apr', 'roi', 15.6),
        jsonb_build_object('month', 'May', 'roi', 21.0),
        jsonb_build_object('month', 'Jun', 'roi', 19.5),
        jsonb_build_object('month', 'Jul', 'roi', 24.3)
      )
    ELSE performance_history
  END
WHERE is_active = true;

-- ────────────────────────────────────────────────────────────
-- 2. copy_trading_subscriptions – tracking columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.copy_trading_subscriptions
  ADD COLUMN IF NOT EXISTS expires_at          timestamptz,
  ADD COLUMN IF NOT EXISTS days_credited        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_credited_at     timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS daily_roi_percent    numeric(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS last_processed_at    timestamptz DEFAULT now();

-- Backfill existing subscription rows
UPDATE public.copy_trading_subscriptions
SET
  expires_at        = COALESCE(expires_at, created_at + interval '30 days'),
  last_credited_at  = COALESCE(last_credited_at, created_at),
  last_processed_at = COALESCE(last_processed_at, created_at)
WHERE expires_at IS NULL OR last_credited_at IS NULL OR last_processed_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- 3. copy_trader_positions – simulated market positions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.copy_trader_positions (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trader_id           uuid NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
    symbol              text NOT NULL,
    type                text NOT NULL CHECK (type IN ('BUY', 'SELL')),
    entry_price         numeric(20,8) NOT NULL,
    exit_price          numeric(20,8),
    profit_loss_percent numeric(8,4),
    status              text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at          timestamptz DEFAULT now(),
    closed_at           timestamptz
);

CREATE INDEX IF NOT EXISTS idx_copy_trader_pos_trader ON public.copy_trader_positions(trader_id);
CREATE INDEX IF NOT EXISTS idx_copy_trader_pos_status ON public.copy_trader_positions(status);

ALTER TABLE public.copy_trader_positions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'copy_trader_positions' AND policyname = 'Copy trader positions are viewable by everyone') THEN
    CREATE POLICY "Copy trader positions are viewable by everyone"
    ON public.copy_trader_positions FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'copy_trader_positions' AND policyname = 'Only admins can manage copy trader positions') THEN
    CREATE POLICY "Only admins can manage copy trader positions"
    ON public.copy_trader_positions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. copy_trader_applications – trader registration requests
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.copy_trader_applications (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name           text NOT NULL,
    email               text NOT NULL,
    experience_years    integer DEFAULT 1,
    trading_style       text DEFAULT 'Day Trading',
    account_type        text DEFAULT 'Standard',
    platform            text DEFAULT 'MT5',
    mt5_account_number  text,
    requested_fee       numeric(10,2) DEFAULT 50.00,
    bio                 text,
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copy_app_user   ON public.copy_trader_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_app_status ON public.copy_trader_applications(status);

ALTER TABLE public.copy_trader_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'copy_trader_applications' AND policyname = 'Users can view their own copy trader applications') THEN
    CREATE POLICY "Users can view their own copy trader applications"
    ON public.copy_trader_applications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'copy_trader_applications' AND policyname = 'Users can create their own copy trader application') THEN
    CREATE POLICY "Users can create their own copy trader application"
    ON public.copy_trader_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'copy_trader_applications' AND policyname = 'Admins can view and manage all copy trader applications') THEN
    CREATE POLICY "Admins can view and manage all copy trader applications"
    ON public.copy_trader_applications FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. RPC: process_copy_trading_daily_5pct_returns
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_copy_trading_daily_5pct_returns(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub                   RECORD;
    days_pending          integer;
    days_remaining        integer;
    actual_days_to_credit integer;
    daily_amount          numeric(20,8);
    profit_to_credit      numeric(20,8);
    now_time              timestamptz := now();
    credited_count        integer := 0;
    total_net_pnl         numeric(20,8) := 0;
BEGIN
    FOR sub IN
        SELECT
            s.id                                            AS sub_id,
            s.amount                                        AS sub_amount,
            s.trader_id,
            s.created_at                                    AS sub_created_at,
            s.expires_at                                    AS sub_expires_at,
            COALESCE(s.days_credited, 0)                   AS current_days_credited,
            COALESCE(s.last_credited_at, s.created_at)     AS last_time,
            COALESCE(s.daily_roi_percent, 5.00)            AS roi_pct,
            t.name                                          AS trader_name
        FROM public.copy_trading_subscriptions s
        JOIN public.copy_traders t ON s.trader_id = t.id
        WHERE s.user_id = target_user_id
          AND s.status  = 'active'
    LOOP
        days_pending := floor(
            extract(epoch FROM (
                LEAST(now_time, COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days'))
                - sub.last_time
            )) / 86400
        )::integer;

        days_remaining := 30 - sub.current_days_credited;

        IF days_pending >= 1 AND days_remaining > 0 THEN
            actual_days_to_credit := LEAST(days_pending, days_remaining);
            daily_amount          := sub.sub_amount * (sub.roi_pct / 100.0);
            profit_to_credit      := daily_amount * actual_days_to_credit;

            IF profit_to_credit > 0 THEN
                -- Credit balance
                UPDATE public.profiles
                SET balance      = balance + profit_to_credit,
                    total_profit = total_profit + profit_to_credit
                WHERE id = target_user_id;

                -- Transaction record
                INSERT INTO public.transactions (user_id, type, amount, status, description, created_at, metadata)
                VALUES (
                    target_user_id, 'profit', profit_to_credit, 'completed',
                    'Daily Copy Trade Return (5%) — ' || sub.trader_name || ' (' || actual_days_to_credit
                        || ' day' || CASE WHEN actual_days_to_credit > 1 THEN 's' ELSE '' END || ')',
                    now_time,
                    jsonb_build_object(
                        'is_copy_trade', true, 'trader_id', sub.trader_id,
                        'trader_name', sub.trader_name,
                        'days_credited', actual_days_to_credit, 'daily_roi_pct', sub.roi_pct
                    )
                );

                -- Notification
                INSERT INTO public.notifications (user_id, title, message, type, created_at)
                VALUES (
                    target_user_id, 'Daily Copy Trade Return',
                    '+$' || round(profit_to_credit::numeric, 2)::text
                        || ' (' || sub.roi_pct || '% daily return) credited from master trader '
                        || sub.trader_name || '.',
                    'success', now_time
                );

                -- Update subscription state
                UPDATE public.copy_trading_subscriptions
                SET days_credited    = sub.current_days_credited + actual_days_to_credit,
                    last_credited_at = sub.last_time + (interval '1 day' * actual_days_to_credit),
                    status           = CASE
                        WHEN (sub.current_days_credited + actual_days_to_credit) >= 30
                          OR now_time >= COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days')
                        THEN 'completed' ELSE 'active'
                    END
                WHERE id = sub.sub_id;

                credited_count := credited_count + 1;
                total_net_pnl  := total_net_pnl + profit_to_credit;
            END IF;

        ELSIF sub.current_days_credited >= 30
           OR now_time >= COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days') THEN
            UPDATE public.copy_trading_subscriptions SET status = 'completed' WHERE id = sub.sub_id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'credited_count', credited_count,
        'total_net_pnl', total_net_pnl
    );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. RPC: simulate_global_trader_activity
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.simulate_global_trader_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    t          RECORD;
    last_trade RECORD;
    is_win     BOOLEAN;
    pl_percent numeric(8,4);
    p_symbol   text;
    p_type     text;
    p_entry    numeric(20,8);
    p_exit     numeric(20,8);
    now_time   timestamptz := now();
    symbols    text[] := ARRAY['BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','XRP/USDT','ADA/USDT','DOT/USDT'];
    types      text[] := ARRAY['BUY','SELL'];
BEGIN
    FOR t IN SELECT * FROM public.copy_traders WHERE is_active = true LOOP
        SELECT * INTO last_trade FROM public.copy_trader_positions
        WHERE trader_id = t.id ORDER BY created_at DESC LIMIT 1;

        IF last_trade.id IS NOT NULL AND last_trade.status = 'open' THEN
            IF now_time >= last_trade.created_at + interval '4 hours' OR
               (now_time >= last_trade.created_at + interval '1 hour' AND random() < 0.25) THEN
                is_win := (random() * 100) <= t.win_rate;
                IF is_win THEN pl_percent :=   1.2 + (random() * 3.6);
                ELSE           pl_percent := -(0.8 + (random() * 2.4)); END IF;
                p_exit := last_trade.entry_price * (1 + (pl_percent / 100));
                UPDATE public.copy_trader_positions
                SET status = 'closed', exit_price = p_exit, profit_loss_percent = pl_percent, closed_at = now_time
                WHERE id = last_trade.id;
                IF is_win THEN
                    UPDATE public.copy_traders SET trades_won  = trades_won  + 1, roi_percent = roi_percent + pl_percent WHERE id = t.id;
                ELSE
                    UPDATE public.copy_traders SET trades_lost = trades_lost + 1, roi_percent = roi_percent + pl_percent WHERE id = t.id;
                END IF;
            END IF;
        ELSE
            IF last_trade.id IS NULL OR
               (last_trade.status = 'closed' AND now_time >= last_trade.closed_at + interval '2 hours' AND random() < 0.35) THEN
                p_symbol := symbols[floor(random() * array_length(symbols, 1) + 1)];
                p_type   := types[floor(random() * array_length(types, 1) + 1)];
                IF    p_symbol = 'BTC/USDT' THEN p_entry := 60000 + (random() * 15000);
                ELSIF p_symbol = 'ETH/USDT' THEN p_entry := 3000  + (random() * 800);
                ELSIF p_symbol = 'SOL/USDT' THEN p_entry := 130   + (random() * 60);
                ELSE                              p_entry := 1     + (random() * 10); END IF;
                INSERT INTO public.copy_trader_positions (trader_id, symbol, type, entry_price, status, created_at)
                VALUES (t.id, p_symbol, p_type, p_entry, 'open', now_time);
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 7. RPC: process_user_copy_trades
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_user_copy_trades(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub                RECORD;
    pos                RECORD;
    profit_loss_amount numeric(20,8);
    credited_count     integer := 0;
    total_net_pnl      numeric(20,8) := 0;
    now_time           timestamptz := now();
BEGIN
    PERFORM public.simulate_global_trader_activity();

    FOR sub IN
        SELECT s.id AS sub_id, s.amount AS sub_amount, s.trader_id,
               s.created_at AS sub_created_at,
               COALESCE(s.last_processed_at, s.created_at) AS last_time,
               t.name AS trader_name
        FROM public.copy_trading_subscriptions s
        JOIN public.copy_traders t ON s.trader_id = t.id
        WHERE s.user_id = target_user_id AND s.status = 'active'
    LOOP
        FOR pos IN
            SELECT * FROM public.copy_trader_positions
            WHERE trader_id = sub.trader_id AND status = 'closed'
              AND closed_at > sub.last_time AND closed_at >= sub.sub_created_at
            ORDER BY closed_at ASC
        LOOP
            profit_loss_amount := sub.sub_amount * (pos.profit_loss_percent / 100);

            UPDATE public.profiles
            SET balance = balance + profit_loss_amount, total_profit = total_profit + profit_loss_amount
            WHERE id = target_user_id;

            INSERT INTO public.transactions (user_id, type, amount, status, description, created_at, metadata)
            VALUES (
                target_user_id,
                CASE WHEN profit_loss_amount >= 0 THEN 'profit'::text ELSE 'withdrawal'::text END,
                ABS(profit_loss_amount), 'completed',
                'Copy trade profit/loss payout — ' || sub.trader_name || ' closed ' || pos.type || ' ' || pos.symbol
                    || ' (' || CASE WHEN pos.profit_loss_percent >= 0 THEN '+' ELSE '' END || pos.profit_loss_percent || '%)',
                pos.closed_at,
                jsonb_build_object('is_copy_trade',true,'trader_id',sub.trader_id,'trader_name',sub.trader_name,
                    'symbol',pos.symbol,'pnl_percent',pos.profit_loss_percent,'position_id',pos.id)
            );

            INSERT INTO public.notifications (user_id, title, message, type, created_at)
            VALUES (
                target_user_id,
                CASE WHEN profit_loss_amount >= 0 THEN 'Copy Trade Profit' ELSE 'Copy Trade Loss' END,
                'Master trader ' || sub.trader_name || ' closed ' || pos.symbol || ' ' || pos.type || ' with '
                    || CASE WHEN pos.profit_loss_percent >= 0 THEN '+' ELSE '' END || pos.profit_loss_percent
                    || '% PnL. Payout: ' || CASE WHEN profit_loss_amount >= 0 THEN '+$' ELSE '-$' END
                    || ABS(round(profit_loss_amount::numeric, 2))::text || '.',
                CASE WHEN profit_loss_amount >= 0 THEN 'success'::text ELSE 'warning'::text END,
                pos.closed_at
            );

            credited_count := credited_count + 1;
            total_net_pnl  := total_net_pnl + profit_loss_amount;

            UPDATE public.copy_trading_subscriptions SET last_processed_at = pos.closed_at WHERE id = sub.sub_id;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'credited_count', credited_count, 'total_net_pnl', total_net_pnl);
END;
$$;

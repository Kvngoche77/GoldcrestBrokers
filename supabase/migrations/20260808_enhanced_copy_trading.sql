-- Migration: Enhanced Professional Copy Trading System
-- File: supabase/migrations/20260808_enhanced_copy_trading.sql

-- 1. Add professional trader metric columns to copy_traders
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

-- Populate default sample performance history for existing traders if empty
UPDATE public.copy_traders
SET 
  total_active_days = COALESCE(NULLIF(total_active_days, 0), 120),
  currency = COALESCE(NULLIF(currency, ''), 'USD'),
  leverage = COALESCE(NULLIF(leverage, ''), '1:500'),
  platform = COALESCE(NULLIF(platform, ''), 'MT5'),
  account_type = COALESCE(NULLIF(account_type, ''), 'Standard'),
  risk_score = COALESCE(NULLIF(risk_score, 0), 3),
  max_drawdown = COALESCE(NULLIF(max_drawdown, 0), 4.50),
  equity = COALESCE(NULLIF(equity, 0), 75000.00),
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

-- 2. Enhance copy_trading_subscriptions for 30-day 5% daily ROI tracking
ALTER TABLE public.copy_trading_subscriptions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS days_credited integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_credited_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS daily_roi_percent numeric(5,2) DEFAULT 5.00;

-- Set default expires_at for existing subscriptions
UPDATE public.copy_trading_subscriptions
SET 
  expires_at = COALESCE(expires_at, created_at + interval '30 days'),
  last_credited_at = COALESCE(last_credited_at, created_at)
WHERE expires_at IS NULL;

-- 3. Create copy_trader_applications table for Trader Area registrations
CREATE TABLE IF NOT EXISTS public.copy_trader_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    experience_years integer DEFAULT 1,
    trading_style text DEFAULT 'Day Trading',
    account_type text DEFAULT 'Standard',
    platform text DEFAULT 'MT5',
    mt5_account_number text,
    requested_fee numeric(10,2) DEFAULT 50.00,
    bio text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copy_app_user ON public.copy_trader_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_app_status ON public.copy_trader_applications(status);

ALTER TABLE public.copy_trader_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own copy trader applications"
ON public.copy_trader_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own copy trader application"
ON public.copy_trader_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all copy trader applications"
ON public.copy_trader_applications FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- 4. Payout engine RPC: process_copy_trading_daily_5pct_returns
CREATE OR REPLACE FUNCTION public.process_copy_trading_daily_5pct_returns(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub RECORD;
    days_pending integer;
    days_remaining integer;
    actual_days_to_credit integer;
    daily_amount numeric(20,8);
    profit_to_credit numeric(20,8);
    now_time timestamptz := now();
    credited_count integer := 0;
    total_net_pnl numeric(20,8) := 0;
BEGIN
    FOR sub IN 
        SELECT 
            s.id as sub_id,
            s.amount as sub_amount,
            s.trader_id,
            s.created_at as sub_created_at,
            s.expires_at as sub_expires_at,
            COALESCE(s.days_credited, 0) as current_days_credited,
            COALESCE(s.last_credited_at, s.created_at) as last_time,
            COALESCE(s.daily_roi_percent, 5.00) as roi_pct,
            t.name as trader_name
        FROM public.copy_trading_subscriptions s
        JOIN public.copy_traders t ON s.trader_id = t.id
        WHERE s.user_id = target_user_id
          AND s.status = 'active'
    LOOP
        -- Calculate total full 24h days elapsed since last credit or creation
        days_pending := floor(extract(epoch from (LEAST(now_time, COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days')) - sub.last_time)) / 86400)::integer;
        
        -- Cap days so total credited does not exceed 30 days
        days_remaining := 30 - sub.current_days_credited;
        
        IF days_pending >= 1 AND days_remaining > 0 THEN
            actual_days_to_credit := LEAST(days_pending, days_remaining);
            
            -- Daily profit is 5% of subscription fee
            daily_amount := sub.sub_amount * (sub.roi_pct / 100.0);
            profit_to_credit := daily_amount * actual_days_to_credit;
            
            IF profit_to_credit > 0 THEN
                -- Update user balance & total profit
                UPDATE public.profiles
                SET 
                    balance = balance + profit_to_credit,
                    total_profit = total_profit + profit_to_credit
                WHERE id = target_user_id;
                
                -- Record transaction
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
                    'profit',
                    profit_to_credit,
                    'completed',
                    'Daily Copy Trade Return (5%) — ' || sub.trader_name || ' (' || actual_days_to_credit || ' day' || CASE WHEN actual_days_to_credit > 1 THEN 's' ELSE '' END || ')',
                    now_time,
                    jsonb_build_object(
                        'is_copy_trade', true,
                        'trader_id', sub.trader_id,
                        'trader_name', sub.trader_name,
                        'days_credited', actual_days_to_credit,
                        'daily_roi_pct', sub.roi_pct
                    )
                );
                
                -- Record notification
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type,
                    created_at
                ) VALUES (
                    target_user_id,
                    'Daily Copy Trade Return',
                    '+$' || round(profit_to_credit::numeric, 2)::text || ' (' || sub.roi_pct || '% daily return) credited from master trader ' || sub.trader_name || '.',
                    'success',
                    now_time
                );
                
                -- Update subscription state
                UPDATE public.copy_trading_subscriptions
                SET 
                    days_credited = sub.current_days_credited + actual_days_to_credit,
                    last_credited_at = sub.last_time + (interval '1 day' * actual_days_to_credit),
                    status = CASE 
                        WHEN (sub.current_days_credited + actual_days_to_credit) >= 30 OR now_time >= COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days') 
                        THEN 'completed' 
                        ELSE 'active' 
                    END
                WHERE id = sub.sub_id;
                
                credited_count := credited_count + 1;
                total_net_pnl := total_net_pnl + profit_to_credit;
            END IF;
        ELSIF sub.current_days_credited >= 30 OR now_time >= COALESCE(sub.sub_expires_at, sub.sub_created_at + interval '30 days') THEN
            -- Mark expired subscriptions as completed
            UPDATE public.copy_trading_subscriptions
            SET status = 'completed'
            WHERE id = sub.sub_id;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'credited_count', credited_count,
        'total_net_pnl', total_net_pnl
    );
END;
$$;

-- Migration: Investment Profits Automation & Copy Trader Stats Upgrades

-- =========================================================================
-- Part 1: Add Wins & Losses to Copy Traders
-- =========================================================================

-- Add trades_won and trades_lost columns if they do not exist
ALTER TABLE copy_traders ADD COLUMN IF NOT EXISTS trades_won integer DEFAULT 0;
ALTER TABLE copy_traders ADD COLUMN IF NOT EXISTS trades_lost integer DEFAULT 0;

-- Auto-populate existing copy traders with realistic trade records that reflect their current win rates
-- If win rate is 85%, they get 51 wins and 9 losses (approx 60 total trades).
-- If win rate is 0/null, they get 48 wins and 12 losses as a professional baseline.
UPDATE copy_traders
SET 
  trades_won = COALESCE(NULLIF(trades_won, 0), CASE WHEN win_rate > 0 THEN round(win_rate * 0.6)::integer ELSE 48 END),
  trades_lost = COALESCE(NULLIF(trades_lost, 0), CASE WHEN win_rate > 0 THEN round((100 - win_rate) * 0.6)::integer ELSE 12 END)
WHERE trades_won = 0 AND trades_lost = 0;

-- =========================================================================
-- Part 2: Automated Daily Investment Profits Engine
-- =========================================================================

-- RPC function: process_user_profits
-- Safely credits all pending daily profit cycles for a specific user.
-- Executed with SECURITY DEFINER to bypass client RLS limits.
CREATE OR REPLACE FUNCTION process_user_profits(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    days_pending INTEGER;
    profit_to_credit NUMERIC(20,8);
    now_time TIMESTAMPTZ := now();
    credited_count INTEGER := 0;
    total_credited_amount NUMERIC(20,8) := 0;
BEGIN
    -- Find all active investments for the user that have pending profit credit cycles (at least 24 hours since last_credited_at or started_at)
    FOR r IN 
        SELECT 
            i.id,
            i.user_id,
            i.amount,
            i.daily_roi_percent,
            i.total_profit_expected,
            i.total_profit_earned,
            i.started_at,
            i.expires_at,
            COALESCE(i.last_credited_at, i.started_at) as last_time,
            p.balance,
            p.total_profit,
            plan.name as plan_name
        FROM investments i
        JOIN profiles p ON i.user_id = p.id
        JOIN investment_plans plan ON i.plan_id = plan.id
        WHERE i.user_id = target_user_id
          AND i.status = 'active'
          AND now_time >= COALESCE(i.last_credited_at, i.started_at) + interval '1 day'
    LOOP
        -- Calculate days pending since last credit or start, capped at the expiration time
        days_pending := floor(extract(epoch from (LEAST(now_time, r.expires_at) - r.last_time)) / 86400)::integer;
        
        IF days_pending >= 1 THEN
            -- Calculate profit: (amount * roi% / 100) * days
            profit_to_credit := (r.amount * r.daily_roi_percent / 100) * days_pending;
            
            -- Ensure we don't exceed the total expected profit
            IF r.total_profit_earned + profit_to_credit > r.total_profit_expected THEN
                profit_to_credit := r.total_profit_expected - r.total_profit_earned;
            END IF;
            
            IF profit_to_credit > 0 THEN
                -- 1. Update investment records
                UPDATE investments
                SET 
                    total_profit_earned = total_profit_earned + profit_to_credit,
                    last_credited_at = r.last_time + (interval '1 day' * days_pending),
                    status = CASE 
                        WHEN total_profit_earned + profit_to_credit >= total_profit_expected OR now_time >= expires_at THEN 'completed'::text
                        ELSE 'active'::text
                    END
                WHERE id = r.id;
                
                -- 2. Update user profile (balance and total_profit)
                UPDATE profiles
                SET 
                    balance = balance + profit_to_credit,
                    total_profit = total_profit + profit_to_credit
                WHERE id = r.user_id;
                
                -- 3. Insert transaction record
                INSERT INTO transactions (
                    user_id,
                    type,
                    amount,
                    status,
                    description,
                    created_at
                ) VALUES (
                    r.user_id,
                    'profit',
                    profit_to_credit,
                    'completed',
                    'Daily profit payout — ' || r.plan_name,
                    now_time
                );
                
                -- 4. Insert notification
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    type,
                    created_at
                ) VALUES (
                    r.user_id,
                    'Daily Profit Credited',
                    '+$' || round(profit_to_credit::numeric, 2)::text || ' daily profit from your ' || r.plan_name || ' investment has been credited.',
                    'success',
                    now_time
                );
                
                credited_count := credited_count + 1;
                total_credited_amount := total_credited_amount + profit_to_credit;
            END IF;
        END IF;
    END LOOP;

    -- Transition any active investments that are expired but haven't been completed yet
    UPDATE investments
    SET status = 'completed'
    WHERE user_id = target_user_id AND status = 'active' AND now_time >= expires_at;

    RETURN jsonb_build_object(
        'success', true,
        'credited_count', credited_count,
        'total_credited_amount', total_credited_amount
    );
END;
$$;


-- RPC function: process_daily_profits
-- Global payouts engine for all active investments (e.g. for global dashboard cron job triggers).
-- Executed with SECURITY DEFINER to bypass client RLS limits.
CREATE OR REPLACE FUNCTION process_daily_profits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    days_pending INTEGER;
    profit_to_credit NUMERIC(20,8);
    now_time TIMESTAMPTZ := now();
    credited_count INTEGER := 0;
    total_credited_amount NUMERIC(20,8) := 0;
BEGIN
    FOR r IN 
        SELECT 
            i.id,
            i.user_id,
            i.amount,
            i.daily_roi_percent,
            i.total_profit_expected,
            i.total_profit_earned,
            i.started_at,
            i.expires_at,
            COALESCE(i.last_credited_at, i.started_at) as last_time,
            p.balance,
            p.total_profit,
            plan.name as plan_name
        FROM investments i
        JOIN profiles p ON i.user_id = p.id
        JOIN investment_plans plan ON i.plan_id = plan.id
        WHERE i.status = 'active'
          AND now_time >= COALESCE(i.last_credited_at, i.started_at) + interval '1 day'
    LOOP
        days_pending := floor(extract(epoch from (LEAST(now_time, r.expires_at) - r.last_time)) / 86400)::integer;
        
        IF days_pending >= 1 THEN
            profit_to_credit := (r.amount * r.daily_roi_percent / 100) * days_pending;
            
            IF r.total_profit_earned + profit_to_credit > r.total_profit_expected THEN
                profit_to_credit := r.total_profit_expected - r.total_profit_earned;
            END IF;
            
            IF profit_to_credit > 0 THEN
                UPDATE investments
                SET 
                    total_profit_earned = total_profit_earned + profit_to_credit,
                    last_credited_at = r.last_time + (interval '1 day' * days_pending),
                    status = CASE 
                        WHEN total_profit_earned + profit_to_credit >= total_profit_expected OR now_time >= expires_at THEN 'completed'::text
                        ELSE 'active'::text
                    END
                WHERE id = r.id;
                
                UPDATE profiles
                SET 
                    balance = balance + profit_to_credit,
                    total_profit = total_profit + profit_to_credit
                WHERE id = r.user_id;
                
                INSERT INTO transactions (
                    user_id,
                    type,
                    amount,
                    status,
                    description,
                    created_at
                ) VALUES (
                    r.user_id,
                    'profit',
                    profit_to_credit,
                    'completed',
                    'Daily profit payout — ' || r.plan_name,
                    now_time
                );
                
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    type,
                    created_at
                ) VALUES (
                    r.user_id,
                    'Daily Profit Credited',
                    '+$' || round(profit_to_credit::numeric, 2)::text || ' daily profit from your ' || r.plan_name || ' investment has been credited.',
                    'success',
                    now_time
                );
                
                credited_count := credited_count + 1;
                total_credited_amount := total_credited_amount + profit_to_credit;
            END IF;
        END IF;
    END LOOP;

    -- Transition all expired active investments
    UPDATE investments
    SET status = 'completed'
    WHERE status = 'active' AND now_time >= expires_at;

    RETURN jsonb_build_object(
        'success', true,
        'credited_count', credited_count,
        'total_credited_amount', total_credited_amount
    );
END;
$$;

-- =================================================================
-- Migration: 20260912_system_upgrade.sql
-- Description: System upgrade — performance indexes, email preferences,
--              login attempt tracking
-- =================================================================

-- ── 1. Performance indexes on high-traffic columns ──────────────────
-- Investments: most queries filter by user_id + status
CREATE INDEX IF NOT EXISTS idx_investments_user_id       ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status        ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_status   ON investments(user_id, status);

-- Transactions: most queries filter by user_id ordered by created_at
CREATE INDEX IF NOT EXISTS idx_transactions_user_id      ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at   ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- Notifications: filter by user + is_read
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Support tickets: admin lists all open tickets frequently
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id   ON support_tickets(user_id);

-- Withdrawal requests: admin review queue
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status   ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id  ON withdrawal_requests(user_id);

-- Copy trader subscriptions (conditional — table name may vary)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'copy_trade_subscriptions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON copy_trade_subscriptions(user_id);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  END IF;
END;
$$;


-- ── 2. Email preferences column on profiles ─────────────────────────
-- Allows users to opt in/out of specific email types
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_preferences JSONB
    NOT NULL DEFAULT '{
      "deposit_initiated": true,
      "withdrawal_initiated": true,
      "withdrawal_approved": true,
      "withdrawal_rejected": true,
      "investment_created": true,
      "investment_completed": true,
      "kyc_approved": true,
      "daily_profit": false,
      "marketing": false
    }'::jsonb;

COMMENT ON COLUMN profiles.email_preferences IS
  'User email notification preferences. Keys map to email types in the send-email API.';

-- ── 3. Login attempts table (rate-limiting & security) ────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  success     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email      ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip         ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created    ON login_attempts(created_at DESC);

-- Auto-clean old login attempts after 30 days
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- RLS: only service role can insert/read login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage login_attempts" ON login_attempts;
CREATE POLICY "Service role can manage login_attempts"
  ON login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 4. System health metadata table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS system_health_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status      TEXT NOT NULL,
  latency_ms  INTEGER,
  details     JSONB,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_log_checked_at ON system_health_log(checked_at DESC);

-- RLS
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage health log" ON system_health_log;
CREATE POLICY "Service role can manage health log"
  ON system_health_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 5. Add missing spot trades table (if not from 20260905 migration) ─
CREATE TABLE IF NOT EXISTS spot_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL,
  side            TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity        NUMERIC(20, 8) NOT NULL,
  entry_price     NUMERIC(20, 8) NOT NULL,
  exit_price      NUMERIC(20, 8),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  pnl             NUMERIC(20, 8),
  pnl_percent     NUMERIC(10, 4),
  leverage        INTEGER NOT NULL DEFAULT 1,
  stop_loss       NUMERIC(20, 8),
  take_profit     NUMERIC(20, 8),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spot_trades_user_id  ON spot_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_trades_status   ON spot_trades(status);
CREATE INDEX IF NOT EXISTS idx_spot_trades_symbol   ON spot_trades(symbol);

ALTER TABLE spot_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own spot trades" ON spot_trades;
CREATE POLICY "Users can manage own spot trades"
  ON spot_trades
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all spot trades" ON spot_trades;
CREATE POLICY "Admins can view all spot trades"
  ON spot_trades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Updated_at trigger for spot_trades
CREATE OR REPLACE FUNCTION update_spot_trades_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spot_trades_updated_at ON spot_trades;
CREATE TRIGGER spot_trades_updated_at
  BEFORE UPDATE ON spot_trades
  FOR EACH ROW EXECUTE FUNCTION update_spot_trades_updated_at();

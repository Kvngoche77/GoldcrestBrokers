-- ============================================================
-- SPOT TRADING MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ixqcnzmhgdysznjaghfx/sql/new
-- ============================================================

-- 1. Update transaction type constraint to include 'trade'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('deposit', 'withdrawal', 'profit', 'referral_bonus', 'investment', 'trade'));

-- 2. Create trade_positions table to track per-user crypto holdings
CREATE TABLE IF NOT EXISTS trade_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,           -- e.g. 'BTCUSDT'
  base_asset text NOT NULL,       -- e.g. 'BTC'
  quote_asset text NOT NULL,      -- e.g. 'USDT'
  quantity numeric(30,10) NOT NULL DEFAULT 0,
  avg_entry_price numeric(20,8) NOT NULL DEFAULT 0,
  total_invested numeric(20,8) NOT NULL DEFAULT 0,
  realized_pnl numeric(20,8) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- 3. Enable RLS on trade_positions
ALTER TABLE trade_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own positions" ON trade_positions;
DROP POLICY IF EXISTS "Users can insert own positions" ON trade_positions;
DROP POLICY IF EXISTS "Users can update own positions" ON trade_positions;
DROP POLICY IF EXISTS "Admin full access positions" ON trade_positions;

CREATE POLICY "Users can read own positions" ON trade_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON trade_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON trade_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin full access positions" ON trade_positions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trade_positions_user_id ON trade_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_positions_symbol ON trade_positions(symbol);

-- 5. Create updated_at trigger for trade_positions
CREATE OR REPLACE FUNCTION update_trade_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trade_positions_updated_at ON trade_positions;
CREATE TRIGGER trade_positions_updated_at
  BEFORE UPDATE ON trade_positions
  FOR EACH ROW EXECUTE FUNCTION update_trade_positions_updated_at();

-- Verify
SELECT 'Migration applied successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_name = 'trade_positions';

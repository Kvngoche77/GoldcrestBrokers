-- Create copy_traders table
CREATE TABLE IF NOT EXISTS copy_traders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  bio text,
  roi_percent numeric DEFAULT 0,
  win_rate numeric DEFAULT 0,
  total_followers integer DEFAULT 0,
  subscription_rate numeric NOT NULL DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create copy_trading_subscriptions table
CREATE TABLE IF NOT EXISTS copy_trading_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trader_id uuid NOT NULL REFERENCES copy_traders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, cancelled, expired
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, trader_id)
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_copy_traders_updated_at
    BEFORE UPDATE ON copy_traders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE copy_traders ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trading_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for copy_traders
CREATE POLICY "Copy traders are viewable by everyone"
  ON copy_traders FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert/update/delete copy traders"
  ON copy_traders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- Policies for copy_trading_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON copy_trading_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
  ON copy_trading_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can manage all subscriptions"
  ON copy_trading_subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- Indexes
CREATE INDEX idx_copy_traders_is_active ON copy_traders(is_active);
CREATE INDEX idx_copy_subs_user_id ON copy_trading_subscriptions(user_id);
CREATE INDEX idx_copy_subs_trader_id ON copy_trading_subscriptions(trader_id);

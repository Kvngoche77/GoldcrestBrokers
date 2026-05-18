-- Migration: Withdrawal Testimonies / Popups System
-- Create table to store custom withdrawal alerts created by the admin to display as social proof notifications.

CREATE TABLE IF NOT EXISTS withdrawal_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    amount numeric(20,2) NOT NULL,
    asset text NOT NULL DEFAULT 'USDT',
    location text DEFAULT 'Global',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE withdrawal_alerts ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Allow public read access to withdrawal_alerts (so visitors on the landing page see them)
CREATE POLICY "Allow public read access to withdrawal_alerts"
ON withdrawal_alerts FOR SELECT
TO public
USING (true);

-- 2. Policy: Allow admins full access (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage withdrawal_alerts"
ON withdrawal_alerts FOR ALL
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

-- Seed some high-quality entries to start
INSERT INTO withdrawal_alerts (username, amount, asset, location) VALUES
('Olivia S.', 3450.00, 'USDT', 'New York, USA'),
('Marcus V.', 15800.00, 'BTC', 'Rome, Italy'),
('Yasin A.', 5200.00, 'ETH', 'Dubai, UAE'),
('Sophia H.', 920.00, 'SOL', 'Berlin, Germany'),
('Adebayo O.', 4100.00, 'USDT', 'Lagos, Nigeria')
ON CONFLICT DO NOTHING;

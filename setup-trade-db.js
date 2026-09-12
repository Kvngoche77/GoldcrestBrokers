const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log('=== Setting up spot trading database ===\n');

  // 1. Create trade_positions table to track crypto holdings
  const { error: posErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS trade_positions (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        symbol text NOT NULL,
        base_asset text NOT NULL,
        quote_asset text NOT NULL,
        quantity numeric(30,10) NOT NULL DEFAULT 0,
        avg_entry_price numeric(20,8) NOT NULL DEFAULT 0,
        total_invested numeric(20,8) NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, symbol)
      );

      ALTER TABLE trade_positions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can read own positions" ON trade_positions;
      DROP POLICY IF EXISTS "Users can insert own positions" ON trade_positions;
      DROP POLICY IF EXISTS "Users can update own positions" ON trade_positions;

      CREATE POLICY "Users can read own positions" ON trade_positions
        FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own positions" ON trade_positions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own positions" ON trade_positions
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE INDEX IF NOT EXISTS idx_trade_positions_user_id ON trade_positions(user_id);
    `
  });

  if (posErr) {
    console.log('RPC not available, will try direct insert test instead');
    // Test if the table already exists by trying to query it
    const { error: queryErr } = await supabase.from('trade_positions').select('id').limit(1);
    if (queryErr && queryErr.message.includes('does not exist')) {
      console.error('trade_positions table does not exist and could not be created via RPC');
      console.log('\nPlease run this SQL in your Supabase dashboard SQL editor:');
      console.log('https://supabase.com/dashboard/project/ixqcnzmhgdysznjaghfx/sql/new\n');
      console.log(`
CREATE TABLE IF NOT EXISTS trade_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  base_asset text NOT NULL,
  quote_asset text NOT NULL,
  quantity numeric(30,10) NOT NULL DEFAULT 0,
  avg_entry_price numeric(20,8) NOT NULL DEFAULT 0,
  total_invested numeric(20,8) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE trade_positions ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_trade_positions_user_id ON trade_positions(user_id);
      `);
    } else if (!queryErr) {
      console.log('✓ trade_positions table already exists');
    }
  } else {
    console.log('✓ trade_positions table created via RPC');
  }

  // 2. Test that transactions table is accessible
  const { data: txData, error: txErr } = await supabase
    .from('transactions')
    .select('id, type')
    .limit(1);
  
  if (txErr) {
    console.error('Error accessing transactions table:', txErr);
  } else {
    console.log('✓ transactions table accessible. Current types in use:');
    const { data: types } = await supabase
      .from('transactions')
      .select('type')
      .limit(50);
    const uniqueTypes = [...new Set((types || []).map((t) => t.type))];
    console.log('  Types found:', uniqueTypes.join(', '));
  }

  // 3. Try inserting a test 'trade' type record and see if it's blocked
  const { data: testUser } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const userId = testUser?.users?.[0]?.id;

  if (userId) {
    const { error: insertErr } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'trade',
      amount: 0.01,
      status: 'completed',
      description: 'TEST trade type check - safe to delete',
      reference: 'TEST-TRADE-TYPE-' + Date.now(),
      metadata: { test: true }
    });

    if (insertErr) {
      console.error('✗ Cannot insert type=trade:', insertErr.message);
      console.log('\nNeed to update the transactions type check constraint.');
      console.log('Please run this in the Supabase SQL editor:');
      console.log(`
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass;

-- If there is a type CHECK constraint, drop and recreate it:
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('deposit', 'withdrawal', 'profit', 'referral_bonus', 'investment', 'trade'));
      `);
    } else {
      console.log('✓ type=trade is accepted by transactions table');
      // Clean up test record
      await supabase.from('transactions')
        .delete()
        .like('reference', 'TEST-TRADE-TYPE-%');
      console.log('✓ Test record cleaned up');
    }
  }

  // 4. Check/create trade_positions table accessible
  const { error: posQueryErr } = await supabase.from('trade_positions').select('id').limit(1);
  if (posQueryErr) {
    console.error('✗ trade_positions not accessible:', posQueryErr.message);
  } else {
    console.log('✓ trade_positions table is accessible');
  }

  console.log('\n=== Database setup check complete ===');
}

run().catch(console.error);

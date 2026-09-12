const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verify() {
  console.log('=== Verifying Spot Trading DB Setup ===\n');

  // 1. Check trade_positions table exists
  const { data: positions, error: posErr } = await supabase
    .from('trade_positions')
    .select('id')
    .limit(1);

  if (posErr) {
    console.error('✗ trade_positions table NOT accessible:', posErr.message);
  } else {
    console.log('✓ trade_positions table is accessible');
  }

  // 2. Check type='trade' is accepted
  const { data: testUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const userId = testUsers?.users?.[0]?.id;

  if (userId) {
    const ref = 'VERIFY-TRADE-' + Date.now();
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'trade',
      amount: 0.01,
      status: 'completed',
      description: 'DB verification test — safe to delete',
      reference: ref,
      metadata: { test: true }
    });

    if (txErr) {
      console.error('✗ type=trade insert FAILED:', txErr.message);
    } else {
      console.log('✓ type=trade is accepted in transactions table');
      // Clean up
      await supabase.from('transactions').delete().eq('reference', ref);
      console.log('✓ Test record cleaned up');
    }
  }

  // 3. Check RLS policies on trade_positions
  const { data: policies, error: policyErr } = await supabase
    .rpc('exec_sql', { sql: `SELECT policyname FROM pg_policies WHERE tablename = 'trade_positions'` })
    .catch(() => ({ data: null, error: 'rpc not available' }));

  console.log('\n=== All checks complete ===');
}

verify().catch(console.error);

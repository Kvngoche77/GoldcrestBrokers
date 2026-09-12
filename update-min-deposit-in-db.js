const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log('Updating minimum investment plan amounts in database...');
  
  // 1. Update any plans with min_amount = 500 to 50
  const { data: updated500, error: err1 } = await supabase
    .from('investment_plans')
    .update({ min_amount: 50 })
    .eq('min_amount', 500)
    .select();

  if (err1) {
    console.error('Error updating min_amount 500:', err1);
  } else {
    console.log('Updated plans with 500 min_amount:', updated500);
  }

  // 2. Update any plan with name containing 'Starter' to min_amount = 50
  const { data: updatedStarter, error: err2 } = await supabase
    .from('investment_plans')
    .update({ min_amount: 50 })
    .ilike('name', '%Starter%')
    .select();

  if (err2) {
    console.error('Error updating Starter plan:', err2);
  } else {
    console.log('Updated Starter plans:', updatedStarter);
  }

  // 3. Fetch all active investment plans to verify
  const { data: allPlans, error: err3 } = await supabase
    .from('investment_plans')
    .select('id, name, min_amount, max_amount')
    .order('sort_order');

  if (err3) {
    console.error('Error fetching plans:', err3);
  } else {
    console.log('Current investment plans in database:');
    console.table(allPlans);
  }
}

run();

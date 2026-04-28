const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzk4MjIsImV4cCI6MjA5MjY1NTgyMn0.ehQcmssnST2UQ53C6OSDGMknBlStgljBfmZaHEvwHyM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking investment_plans...');
  const { data: plans, error: plansError } = await supabase.from('investment_plans').select('*');
  if (plansError) console.error('Plans error:', JSON.stringify(plansError, null, 2));
  else {
    console.log(`Found ${plans?.length || 0} plans`);
    if (plans && plans.length > 0) {
        console.log('First plan:', plans[0].name, 'Active:', plans[0].is_active);
    }
  }

  console.log('Checking deposit_addresses...');
  const { data: addresses, error: addrError } = await supabase.from('deposit_addresses').select('*');
  if (addrError) console.error('Addresses error:', JSON.stringify(addrError, null, 2));
  else console.log(`Found ${addresses?.length || 0} addresses`);
}

checkData();

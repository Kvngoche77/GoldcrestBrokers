const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function test() {
  console.log('Fetching copy_traders...');
  const { data, error } = await supabase.from('copy_traders').select('*').limit(1);
  if (error) {
    console.error('Error fetching copy_traders:', error);
  } else {
    console.log('Sample copy_trader:', data);
  }

  console.log('Checking copy_trader_applications...');
  const { data: apps, error: appErr } = await supabase.from('copy_trader_applications').select('*').limit(1);
  if (appErr) {
    console.log('copy_trader_applications table status:', appErr.message);
  } else {
    console.log('copy_trader_applications data:', apps);
  }
}

test();

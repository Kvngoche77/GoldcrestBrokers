const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20260808_enhanced_copy_trading.sql'), 'utf8');

  console.log('Trying rpc exec_sql...');
  let res = await supabase.rpc('exec_sql', { sql });
  console.log('exec_sql res:', res);

  if (res.error) {
    console.log('Trying rpc exec_admin_sql...');
    res = await supabase.rpc('exec_admin_sql', { sql_query: sql });
    console.log('exec_admin_sql res:', res);
  }
}

run();

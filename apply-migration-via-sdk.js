// apply-migration-via-sdk.js - Apply SQL migration using Supabase SDK
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20260707_automated_copy_trading.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Applying migration via Supabase RPC...');
  
  // Split SQL into individual statements and execute them one by one
  // to work around any issues with multi-statement execution
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.startsWith('--'));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    const fullStmt = stmt + ';';
    const { data, error } = await supabase.rpc('exec_sql', { sql: fullStmt }).catch(() => ({
      data: null,
      error: { message: 'RPC not available' }
    }));
    
    if (error && error.message === 'RPC not available') {
      // Try using the REST API directly
      break;
    }
    
    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Skipped (already exists):', stmt.slice(0, 60));
        success++;
      } else {
        console.error('❌ Failed:', error.message, '\nSQL:', stmt.slice(0, 100));
        failed++;
      }
    } else {
      console.log('✅ OK:', stmt.slice(0, 60));
      success++;
    }
  }

  console.log(`\nSummary: ${success} succeeded, ${failed} failed`);
}

main().catch(console.error);

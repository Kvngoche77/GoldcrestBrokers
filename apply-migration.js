// apply-migration.js - Run the automated copy trading migration via Supabase REST API
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3OTgyMiwiZXhwIjoyMDkyNjU1ODIyfQ.Y2is3EqCQ2_hmgaC2ZlvXbO77LZXqHzsJMrO8pRQePc';

const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20260707_automated_copy_trading.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/`);

// Use the Supabase SQL execution endpoint
const requestBody = JSON.stringify({ query: sql });

const requestOptions = {
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody),
  },
};

// The pg-meta endpoint for running SQL
const fullUrl = `${SUPABASE_URL}/pg-meta/v1/query`;

console.log('Applying automated copy trading migration...');
console.log('Endpoint:', fullUrl);

const req = https.request(fullUrl, requestOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Migration applied successfully!');
      } else {
        console.error('❌ Migration failed');
      }
    } catch {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(requestBody);
req.end();

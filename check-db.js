const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzk4MjIsImV4cCI6MjA5MjY1NTgyMn0.ehQcmssnST2UQ53C6OSDGMknBlStgljBfmZaHEvwHyM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking profiles...');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').limit(1);
  if (profilesError) console.error('Profiles error:', profilesError);
  else console.log(`Found profiles table`);
}

checkData();

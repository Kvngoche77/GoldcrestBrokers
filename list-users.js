
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzk4MjIsImV4cCI6MjA5MjY1NTgyMn0.ehQcmssnST2UQ53C6OSDGMknBlStgljBfmZaHEvwHyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  const { data, error } = await supabase.from('profiles').select('id, username, is_admin');
  if (error) console.error('Error fetching users:', error);
  else console.log('Users:', JSON.stringify(data, null, 2));
}

listUsers();

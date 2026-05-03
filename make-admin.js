const { createClient } = require('@supabase/supabase-js');

// These should match your .env values
const supabaseUrl = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzk4MjIsImV4cCI6MjA5MjY1NTgyMn0.ehQcmssnST2UQ53C6OSDGMknBlStgljBfmZaHEvwHyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin(emailOrUsername) {
  if (!emailOrUsername) {
    console.error('Please provide an email or username. Usage: node make-admin.js <email_or_username>');
    return;
  }

  console.log(`Attempting to grant admin access to: ${emailOrUsername}...`);
  
  // Try to find user in profiles (which matches auth.users id)
  // We check username or we check auth logic
  
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, username')
    .or(`username.ilike.${emailOrUsername},id.in.(select id from auth.users where email.ilike.${emailOrUsername})`);

  // Note: Standard Supabase client can't query auth.users directly. 
  // We'll try to find by username first.
  
  let userToPromote = null;

  if (profile && profile.length > 0) {
    userToPromote = profile[0];
  } else {
    // If not found in profiles, maybe they just haven't had a profile created yet?
    // But our new AuthContext fallback should fix that.
    console.log('User not found in profiles. Try running the SQL Master Fix script first.');
    return;
  }

  console.log(`Found user: ${userToPromote.username} (ID: ${userToPromote.id})`);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', userToPromote.id);

  if (updateError) {
    console.error('Error granting admin access:', updateError.message);
    console.log('IMPORTANT: You must run this script with a Service Role Key OR update via the SQL Editor in Supabase Dashboard.');
  } else {
    console.log('Successfully granted admin access!');
  }
}

const target = process.argv[2] || 'kvngoche77';
makeAdmin(target);

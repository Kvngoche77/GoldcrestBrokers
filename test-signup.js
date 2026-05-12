const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqcnzmhgdysznjaghfx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWNuem1oZ2R5c3puamFnaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzk4MjIsImV4cCI6MjA5MjY1NTgyMn0.ehQcmssnST2UQ53C6OSDGMknBlStgljBfmZaHEvwHyM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log('Attempting signup for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
        username: 'testuser_' + Date.now(),
      },
    },
  });

  if (error) {
    console.error('Signup Error:', error);
    console.error('Error Details:', JSON.stringify(error, null, 2));
  } else {
    console.log('Signup Successful!');
    console.log('User ID:', data.user.id);
    
    // Try to update profile
    console.log('Waiting for trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Attempting profile update...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        phone: '1234567890',
        country: 'US',
        address: '123 Test St'
      })
      .eq('id', data.user.id);
      
    if (updateError) {
      console.error('Update Error:', updateError);
      console.error('Update Details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('Profile update successful!');
    }
  }
}

testSignup();

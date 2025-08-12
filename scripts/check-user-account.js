const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserAccount(email) {
  console.log(`\n=== Checking account for: ${email} ===\n`);

  try {
    // 1. Check auth.users table
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    const authUser = authData.users.find(u => u.email === email);
    
    if (authUser) {
      console.log('✅ User found in auth.users:');
      console.log(`  - ID: ${authUser.id}`);
      console.log(`  - Email: ${authUser.email}`);
      console.log(`  - Created: ${authUser.created_at}`);
      console.log(`  - Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`  - Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);
      
      // 2. Check fleeks_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profile) {
        console.log('\n✅ Profile found:');
        console.log(`  - Username: ${profile.username}`);
        console.log(`  - Full Name: ${profile.full_name}`);
        console.log(`  - Membership: ${profile.membership_type}`);
        console.log(`  - Role: ${profile.role}`);
        console.log(`  - Status: ${profile.status || 'active'}`);
      } else {
        console.log('\n❌ No profile found in fleeks_profiles');
      }
      
      // 3. Manual password reset
      console.log('\n=== Manual Password Reset ===');
      console.log('To manually reset the password:');
      console.log('1. Go to Supabase Dashboard > Authentication > Users');
      console.log('2. Find the user and click on the three dots menu');
      console.log('3. Select "Send password recovery"');
      console.log('\nOr use this script to send reset email:');
      console.log(`node scripts/send-password-reset.js "${email}"`);
      
    } else {
      console.log('❌ User not found in auth.users');
      console.log('The email is available for new registration.');
    }
    
    // 4. Check email configuration
    console.log('\n=== Email Configuration Status ===');
    console.log('Make sure the following are configured in Supabase:');
    console.log('1. Authentication > Settings > Email Auth is enabled');
    console.log('2. Authentication > Email Templates are configured');
    console.log('3. Project Settings > Email settings are configured');
    console.log('4. Check spam folder for reset emails');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
const targetEmail = 'self.138@gmail.com';
checkUserAccount(targetEmail);
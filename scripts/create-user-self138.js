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

async function createTestUser(email, password) {
  console.log(`\n=== Creating user: ${email} ===\n`);

  try {
    // 1. Create user in auth.users
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: email.split('@')[0],
        username: email.split('@')[0]
      }
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.error('❌ User already exists');
        console.log('Use the password reset function instead');
      } else {
        console.error('❌ Error creating user:', createError.message);
      }
      return;
    }

    if (newUser.user) {
      console.log('✅ User created successfully!');
      console.log(`  - ID: ${newUser.user.id}`);
      console.log(`  - Email: ${newUser.user.email}`);
      
      // 2. Create profile in fleeks_profiles
      const { error: profileError } = await supabase
        .from('fleeks_profiles')
        .insert({
          id: newUser.user.id,
          username: email.split('@')[0],
          full_name: email.split('@')[0],
          membership_type: 'premium', // Set as premium for testing
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('⚠️  Warning: Profile creation failed:', profileError.message);
      } else {
        console.log('✅ Profile created successfully!');
      }

      console.log('\n=== Login Information ===');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`URL: https://app.fleeks.jp/login`);
      console.log('\nYou can now login with these credentials.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create test user for self.138@gmail.com
createTestUser('self.138@gmail.com', 'TestPassword123!');
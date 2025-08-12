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

async function sendPasswordReset(email) {
  console.log(`\n=== Sending password reset email to: ${email} ===\n`);

  try {
    // First check if user exists
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    const userExists = authData.users.some(u => u.email === email);
    
    if (!userExists) {
      console.log('❌ User not found. Cannot send reset email to non-existent user.');
      console.log('Please register first at https://app.fleeks.jp/auth/signup');
      return;
    }

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.fleeks.jp/auth/reset-password',
    });

    if (error) {
      console.error('❌ Error sending reset email:', error.message);
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('Please check your email (including spam folder)');
      console.log('\nNote: Supabase email settings must be configured properly.');
      console.log('If you don\'t receive the email:');
      console.log('1. Check Supabase Dashboard > Project Settings > Auth');
      console.log('2. Verify SMTP settings are configured');
      console.log('3. Check email rate limits');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node scripts/send-password-reset.js "email@example.com"');
  process.exit(1);
}

sendPasswordReset(email);
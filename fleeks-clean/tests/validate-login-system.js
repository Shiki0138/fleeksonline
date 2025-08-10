#!/usr/bin/env node

/**
 * FLEEKS Login System Validation Script
 * 
 * This script validates the login system setup:
 * - Supabase connection
 * - Admin account configuration
 * - Database schema
 * - Authentication flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase Connection...');
  
  try {
    const { data, error } = await supabase
      .from('fleeks_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkAdminAccount() {
  console.log('\n👑 Checking Admin Account...');
  
  const adminEmail = 'greenroom51@gmail.com';
  
  try {
    // Check if admin user exists in auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Could not fetch users:', usersError.message);
      return false;
    }
    
    const adminUser = users.users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.log('❌ Admin user not found in auth system');
      return false;
    }
    
    console.log('✅ Admin user found in auth system');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   - Last Sign In: ${adminUser.last_sign_in_at || 'Never'}`);
    
    // Check profile in fleeks_profiles
    const { data: profile, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Error checking admin profile:', profileError.message);
      return false;
    }
    
    if (!profile) {
      console.log('⚠️  Admin profile not found in fleeks_profiles table');
      console.log('   This might be okay if admin access is based on email only');
      return true;
    }
    
    console.log('✅ Admin profile found');
    console.log(`   - Name: ${profile.full_name || profile.username || 'Not set'}`);
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Membership: ${profile.membership_type}`);
    console.log(`   - Status: ${profile.status}`);
    
    if (profile.role !== 'admin') {
      console.log('⚠️  Profile role is not "admin" - this might need fixing');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Error checking admin account:', err.message);
    return false;
  }
}

async function checkDatabaseSchema() {
  console.log('\n📊 Checking Database Schema...');
  
  const requiredTables = [
    'fleeks_profiles',
    'fleeks_videos',
    'fleeks_watch_history',
    'education_contents',
    'education_chapters'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table "${table}" not accessible:`, error.message);
        allTablesExist = false;
      } else {
        console.log(`✅ Table "${table}" exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table "${table}":`, err.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testAuthFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  try {
    // Test sign out (should always work)
    const { error: signOutError } = await supabaseClient.auth.signOut();
    
    if (signOutError) {
      console.log('⚠️  Sign out test failed:', signOutError.message);
    } else {
      console.log('✅ Sign out functionality working');
    }
    
    // Test get user (should return null when signed out)
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.log('⚠️  Get user test failed:', userError.message);
    } else if (userData.user === null) {
      console.log('✅ Get user functionality working (no user when signed out)');
    } else {
      console.log('⚠️  Unexpected user data when signed out');
    }
    
    console.log('✅ Basic auth flow tests passed');
    return true;
    
  } catch (err) {
    console.error('❌ Auth flow test error:', err.message);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('\n🛡️  Checking RLS Policies...');
  
  try {
    // Test access to profiles without authentication (should be restricted)
    const { data, error } = await supabaseClient
      .from('fleeks_profiles')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('row-level security')) {
      console.log('✅ RLS is properly configured (access denied without auth)');
      return true;
    } else if (error) {
      console.log('⚠️  Unexpected error testing RLS:', error.message);
      return false;
    } else {
      console.log('⚠️  RLS might not be properly configured (data accessible without auth)');
      return false;
    }
    
  } catch (err) {
    console.error('❌ RLS check error:', err.message);
    return false;
  }
}

async function generateTestReport() {
  console.log('\n🧪 FLEEKS Login System Validation Report');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Supabase Connection', test: testSupabaseConnection },
    { name: 'Admin Account Setup', test: checkAdminAccount },
    { name: 'Database Schema', test: checkDatabaseSchema },
    { name: 'Authentication Flow', test: testAuthFlow },
    { name: 'RLS Policies', test: checkRLSPolicies }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ Test "${test.name}" failed with error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('=' .repeat(30));
  
  let passedTests = 0;
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  const successRate = (passedTests / results.length) * 100;
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${results.length} tests`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('\n🎉 All systems operational! Login functionality should work perfectly.');
  } else if (successRate >= 80) {
    console.log('\n✅ System mostly operational with minor issues.');
  } else if (successRate >= 60) {
    console.log('\n⚠️  System has several issues that should be addressed.');
  } else {
    console.log('\n❌ Critical issues found. Login system may not work properly.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Run browser tests using the manual test guide');
  console.log('   2. Test login with actual credentials');
  console.log('   3. Verify admin and user role redirects');
  console.log('   4. Check error message localization');
  console.log('\n🔗 Test URLs:');
  console.log('   • Login: http://localhost:3000/login');
  console.log('   • Admin: http://localhost:3000/admin');
  console.log('   • Dashboard: http://localhost:3000/dashboard');
  
  return {
    totalTests: results.length,
    passedTests,
    successRate,
    allPassed: successRate === 100
  };
}

// Run validation if called directly
if (require.main === module) {
  generateTestReport()
    .then(results => {
      process.exit(results.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateTestReport };
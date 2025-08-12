#!/usr/bin/env node

/**
 * Verify Production Login
 * This script checks if the login system is working in production
 */

console.log('🔍 Production Login System Verification\n')

const PRODUCTION_URL = 'https://fleeksonline.vercel.app'

async function checkEndpoint(url, description) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      redirect: 'manual' // Don't follow redirects automatically
    })
    
    console.log(`📍 ${description}`)
    console.log(`   URL: ${url}`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    const location = response.headers.get('location')
    if (location) {
      console.log(`   Redirects to: ${location}`)
    }
    
    console.log('')
    return response
  } catch (error) {
    console.error(`❌ Error checking ${url}:`, error.message)
    console.log('')
  }
}

async function verifyProduction() {
  // Check main endpoints
  await checkEndpoint(PRODUCTION_URL, 'Homepage')
  await checkEndpoint(`${PRODUCTION_URL}/login`, 'Login Page')
  await checkEndpoint(`${PRODUCTION_URL}/admin`, 'Admin Page (should redirect to login)')
  await checkEndpoint(`${PRODUCTION_URL}/dashboard`, 'Dashboard (should redirect to login)')
  
  console.log('📋 Expected Behavior:')
  console.log('   1. Homepage (/) - Should be accessible (200 OK)')
  console.log('   2. Login page (/login) - Should be accessible (200 OK)')
  console.log('   3. Admin page (/admin) - Should redirect to login (307/308)')
  console.log('   4. Dashboard (/dashboard) - Should redirect to login (307/308)')
  
  console.log('\n🔐 Login Test Instructions:')
  console.log('   1. Open: ' + PRODUCTION_URL + '/login')
  console.log('   2. Login with:')
  console.log('      Email: greenroom51@gmail.com')
  console.log('      Password: Admin123456!')
  console.log('   3. Should redirect to /admin after successful login')
  console.log('   4. Should NOT redirect back to login page')
  
  console.log('\n✅ If login works without redirect loop, the issue is fixed!')
}

verifyProduction()
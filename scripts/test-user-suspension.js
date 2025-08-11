#!/usr/bin/env node

/**
 * Test script for user suspension functionality
 * This script tests the admin user management features
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'greenroom51@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function testUserSuspension() {
  console.log('🧪 Testing user suspension functionality...\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Failed to login as admin');
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin login successful\n');

    // 2. Get users list
    console.log('2️⃣ Fetching users list...');
    const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users');
    }

    const { users } = await usersResponse.json();
    console.log(`✅ Found ${users.length} users\n`);

    // 3. Test suspension on a non-admin user
    const testUser = users.find(u => u.email !== ADMIN_EMAIL && u.status === 'active');
    
    if (testUser) {
      console.log(`3️⃣ Testing suspension on user: ${testUser.email}`);
      
      const suspendResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          action: 'updateStatus',
          userId: testUser.id,
          data: { status: 'suspended' }
        })
      });

      if (!suspendResponse.ok) {
        const error = await suspendResponse.json();
        throw new Error(`Failed to suspend user: ${error.error || 'Unknown error'}`);
      }

      console.log('✅ User suspended successfully\n');

      // 4. Verify suspension
      console.log('4️⃣ Verifying suspension...');
      const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Cookie': cookies
        }
      });

      const { users: updatedUsers } = await verifyResponse.json();
      const updatedUser = updatedUsers.find(u => u.id === testUser.id);

      if (updatedUser && updatedUser.status === 'suspended') {
        console.log('✅ Suspension verified successfully\n');
      } else {
        throw new Error('Suspension not reflected in database');
      }

      // 5. Reactivate user
      console.log('5️⃣ Reactivating user...');
      const reactivateResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          action: 'updateStatus',
          userId: testUser.id,
          data: { status: 'active' }
        })
      });

      if (!reactivateResponse.ok) {
        throw new Error('Failed to reactivate user');
      }

      console.log('✅ User reactivated successfully\n');
    } else {
      console.log('⚠️  No suitable test user found for suspension test\n');
    }

    console.log('✨ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUserSuspension();
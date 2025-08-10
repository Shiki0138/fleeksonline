#!/usr/bin/env node

/**
 * Browser Test Helper for FLEEKS Login System
 * 
 * This script helps with browser-based testing by providing
 * quick access to test scenarios and validation checks.
 */

const open = require('child_process').exec;
const readline = require('readline');

const APP_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test scenarios
const TEST_SCENARIOS = {
  '1': {
    name: 'Admin Login Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Enter email: greenroom51@gmail.com',
      '2. Enter the correct admin password',
      '3. Click Login button',
      '4. Verify redirect to /admin',
      '5. Check for "管理者としてログインしています..." message'
    ]
  },
  '2': {
    name: 'Regular User Login Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Enter a regular user email',
      '2. Enter the correct password',
      '3. Click Login button',
      '4. Verify redirect to /dashboard',
      '5. Check for "ログインしています..." message'
    ]
  },
  '3': {
    name: 'Wrong Password Error Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Enter email: greenroom51@gmail.com',
      '2. Enter wrong password: wrongpassword123',
      '3. Click Login button',
      '4. Verify error message in Japanese',
      '5. Check that form stays on login page'
    ]
  },
  '4': {
    name: 'Non-existent User Error Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Enter email: nonexistent@example.com',
      '2. Enter any password',
      '3. Click Login button',
      '4. Verify error message in Japanese',
      '5. Check error styling (red background)'
    ]
  },
  '5': {
    name: 'UI and Loading State Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Fill in valid credentials',
      '2. Watch for "ログイン中..." loading state',
      '3. Check button becomes disabled during loading',
      '4. Verify success message styling (green background)',
      '5. Test responsive design on different screen sizes'
    ]
  },
  '6': {
    name: 'Admin Dashboard Access Test',
    url: `${APP_URL}/admin`,
    instructions: [
      '1. Access admin page directly (should redirect to login if not authenticated)',
      '2. Login as admin',
      '3. Verify admin dashboard loads',
      '4. Check admin statistics display',
      '5. Test admin navigation menu'
    ]
  },
  '7': {
    name: 'Regular Dashboard Access Test',
    url: `${APP_URL}/dashboard`,
    instructions: [
      '1. Access dashboard directly (should redirect to login if not authenticated)',
      '2. Login as regular user',
      '3. Verify dashboard loads',
      '4. Check video content tabs',
      '5. Test user profile display'
    ]
  },
  '8': {
    name: 'Mobile Responsive Test',
    url: `${APP_URL}/login`,
    instructions: [
      '1. Open browser developer tools',
      '2. Switch to mobile device simulation',
      '3. Test login form on mobile',
      '4. Verify touch-friendly buttons',
      '5. Check text readability on small screens'
    ]
  }
};

function displayMenu() {
  console.log('\n🧪 FLEEKS Login System - Browser Test Helper');
  console.log('=' .repeat(50));
  console.log('Choose a test scenario:');
  console.log('');
  
  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(`${key}. ${scenario.name}`);
  }
  
  console.log('');
  console.log('0. Exit');
  console.log('a. Open all test pages');
  console.log('s. Show system status');
  console.log('');
}

function runTestScenario(scenarioKey) {
  const scenario = TEST_SCENARIOS[scenarioKey];
  
  if (!scenario) {
    console.log('❌ Invalid test scenario selected');
    return;
  }
  
  console.log(`\n🚀 Starting: ${scenario.name}`);
  console.log('=' .repeat(40));
  console.log(`Opening: ${scenario.url}`);
  console.log('');
  console.log('📋 Test Instructions:');
  scenario.instructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  console.log('');
  
  // Open the URL in default browser
  const command = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
  
  open(`${command} ${scenario.url}`, (error) => {
    if (error) {
      console.log('⚠️  Could not open browser automatically. Please navigate to:');
      console.log(`   ${scenario.url}`);
    } else {
      console.log('✅ Browser opened successfully');
    }
  });
}

function openAllTestPages() {
  console.log('\n🌐 Opening all test pages...');
  
  const urls = [
    `${APP_URL}/login`,
    `${APP_URL}/dashboard`,
    `${APP_URL}/admin`
  ];
  
  const command = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
  
  urls.forEach(url => {
    open(`${command} ${url}`, (error) => {
      if (error) {
        console.log(`⚠️  Could not open ${url}`);
      } else {
        console.log(`✅ Opened ${url}`);
      }
    });
  });
}

function showSystemStatus() {
  console.log('\n📊 System Status Check');
  console.log('=' .repeat(30));
  
  // Check if app is running
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    console.log(`✅ App Status: Running (Status: ${res.statusCode})`);
    console.log(`🔗 App URL: ${APP_URL}`);
    console.log('📱 Test Pages:');
    console.log(`   Login: ${APP_URL}/login`);
    console.log(`   Dashboard: ${APP_URL}/dashboard`);
    console.log(`   Admin: ${APP_URL}/admin`);
    console.log('');
    console.log('💡 Tips:');
    console.log('   • Use browser dev tools for responsive testing');
    console.log('   • Check console for JavaScript errors');
    console.log('   • Test with multiple browsers');
    console.log('   • Verify network requests in dev tools');
  });
  
  req.on('error', (error) => {
    console.log('❌ App Status: Not running or not accessible');
    console.log('💡 To start the app: npm run dev');
    console.log(`   Error: ${error.message}`);
  });
  
  req.on('timeout', () => {
    console.log('⏰ App Status: Timeout (may be starting up)');
    console.log('💡 Wait a moment and try again');
    req.destroy();
  });
  
  req.end();
}

function promptUser() {
  rl.question('Enter your choice: ', (answer) => {
    const choice = answer.trim().toLowerCase();
    
    switch (choice) {
      case '0':
        console.log('👋 Thank you for testing FLEEKS!');
        rl.close();
        return;
        
      case 'a':
        openAllTestPages();
        setTimeout(() => promptUser(), 1000);
        break;
        
      case 's':
        showSystemStatus();
        setTimeout(() => promptUser(), 2000);
        break;
        
      default:
        if (TEST_SCENARIOS[choice]) {
          runTestScenario(choice);
          setTimeout(() => promptUser(), 1000);
        } else {
          console.log('❌ Invalid choice. Please try again.');
          promptUser();
        }
        break;
    }
  });
}

// Main execution
function main() {
  console.log('🎯 FLEEKS Login System Testing Tool');
  console.log(`📍 Target Application: ${APP_URL}`);
  console.log('');
  console.log('This tool helps you conduct comprehensive browser tests');
  console.log('for the FLEEKS login system functionality.');
  console.log('');
  
  displayMenu();
  promptUser();
}

// Handle cleanup
rl.on('SIGINT', () => {
  console.log('\n👋 Exiting test helper...');
  rl.close();
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  TEST_SCENARIOS,
  runTestScenario,
  showSystemStatus
};
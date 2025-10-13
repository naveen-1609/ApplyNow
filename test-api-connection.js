// Test script to verify API connection and get user ID
const fetch = require('node-fetch');

async function testAPIConnection() {
  console.log('🧪 Testing API Connection...');
  console.log('================================');
  
  try {
    // Test 1: Check if the app is running
    console.log('1️⃣ Testing if Application Console is running...');
    const healthResponse = await fetch('https://appconsole.tech/api/scheduler/settings', {
      method: 'POST'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Application Console is running!');
      console.log('📋 Available endpoints:', healthData.endpoints);
    } else {
      throw new Error(`App not running: ${healthResponse.status}`);
    }
    
    console.log('');
    console.log('2️⃣ Testing settings API with mock user...');
    
    // Test 2: Try to get settings (this will fail with current-user, but that's expected)
    const settingsResponse = await fetch('https://appconsole.tech/api/scheduler/settings?userId=current-user');
    
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      console.log('✅ Settings API is working!');
      console.log('📊 Response:', JSON.stringify(settingsData, null, 2));
    } else {
      const errorData = await settingsResponse.json();
      console.log('⚠️  Settings API responded with error (expected):');
      console.log('📊 Error:', errorData.error);
    }
    
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Open your Application Console app in browser');
    console.log('   2. Open Developer Tools (F12)');
    console.log('   3. Go to Console tab');
    console.log('   4. Type: console.log(firebase.auth().currentUser?.uid)');
    console.log('   5. Copy the user ID that appears');
    console.log('   6. Replace "current-user" in api-scheduler.js with your actual user ID');
    console.log('   7. Restart the scheduler');
    
  } catch (error) {
    console.error('❌ API Connection failed:', error.message);
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('   1. Make sure your Application Console app is running: npm run dev');
    console.log('   2. Check that it\'s running on https://appconsole.tech');
    console.log('   3. Wait for the app to fully load before testing');
  }
}

// Run the test
testAPIConnection();

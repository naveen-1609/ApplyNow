// Test script for the Vercel cron job
const fetch = require('node-fetch');

async function testCronJob() {
  console.log('🧪 Testing Vercel Cron Job Implementation...');
  console.log('==========================================');
  
  const baseUrl = 'http://localhost:3000';
  const testTypes = ['reminder', 'summary', 'all'];
  
  for (const testType of testTypes) {
    console.log(`\n📧 Testing ${testType} emails...`);
    
    const cronUrl = testType === 'all' 
      ? `${baseUrl}/api/cron/notifications`
      : `${baseUrl}/api/cron/notifications?type=${testType}`;
    
    try {
      console.log(`📡 Testing cron endpoint: ${cronUrl}`);
      
      const response = await fetch(cronUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'vercel-cron/1.0' // Simulate Vercel cron user agent
        }
      });
      
      const result = await response.json();
      
      console.log('✅ Cron job response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`\n🎉 ${testType} cron job executed successfully!`);
        if (result.results && result.results.length > 0) {
          console.log('📧 Email results:');
          result.results.forEach((emailResult, index) => {
            console.log(`   ${index + 1}. ${emailResult.type} email to ${emailResult.user}: ${emailResult.success ? '✅ Sent' : '❌ Failed'}`);
          });
        } else {
          console.log('ℹ️  No emails were sent (no users enabled or wrong type)');
        }
      } else {
        console.log('❌ Cron job failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to test cron job:', error.message);
      console.log('\n💡 Make sure your Next.js app is running on localhost:3000');
    }
  }
  
  console.log('\n==========================================');
  console.log('📝 Next steps:');
  console.log('   1. Deploy to Vercel');
  console.log('   2. Set environment variables in Vercel dashboard:');
  console.log('      - USER_ID (your Firebase user ID)');
  console.log('      - SENDGRID_API_KEY (your SendGrid API key)');
  console.log('   3. Test with: https://your-app.vercel.app/api/cron/test');
  console.log('   4. Check Vercel Function logs for cron execution');
  console.log('   5. Cron jobs will run daily at 7 AM UTC (reminder) and 8 PM UTC (summary)');
}

// Run the test
testCronJob();

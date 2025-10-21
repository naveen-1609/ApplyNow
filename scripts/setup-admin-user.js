// Script to set up admin user for ApplyNow
// Run this after deploying the updated schema

const adminEmail = 'naveenvenkat58@gmail.com';
const adminPassword = '123123123';

console.log('🔧 Admin User Setup Instructions:');
console.log('');
console.log('1. First, create a Firebase Auth user with:');
console.log(`   Email: ${adminEmail}`);
console.log(`   Password: ${adminPassword}`);
console.log('');
console.log('2. Then run this script to set up the admin profile:');
console.log('   node scripts/setup-admin-user.js');
console.log('');
console.log('3. Or manually set up the admin user in Firebase Console:');
console.log('   - Go to Firebase Console > Authentication');
console.log('   - Add user with the email and password above');
console.log('   - Go to Firestore Database');
console.log('   - Create a document in "users" collection with the user\'s UID');
console.log('   - Set the following fields:');
console.log('     - email: "naveenvenkat58@gmail.com"');
console.log('     - name: "Naveen Venkat"');
console.log('     - subscriptionPlan: "ADMIN"');
console.log('     - subscriptionStatus: "active"');
console.log('     - isAdmin: true');
console.log('     - createdAt: current timestamp');
console.log('     - updatedAt: current timestamp');
console.log('');
console.log('4. Access the admin dashboard:');
console.log('   - Sign in with the admin credentials');
console.log('   - Go to /admin');
console.log('   - Enter password: 123123123');
console.log('   - You\'ll have full admin access!');
console.log('');
console.log('✅ Admin setup complete!');

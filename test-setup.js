const axios = require('axios');

async function testSetup() {
  console.log('🧪 Testing Trashify Setup...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Server is running:', healthResponse.data);
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    console.log('   Make sure to run: npm run dev');
    return;
  }
  
  try {
    // Test 2: Test authentication endpoint
    console.log('\n2. Testing authentication endpoint...');
    const authResponse = await axios.post('http://localhost:3000/api/auth/login', {
      phone: '9999999999',
      password: 'admin123'
    });
    console.log('✅ Admin login successful:', authResponse.data.message);
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
  }
  
  try {
    // Test 3: Test materials endpoint
    console.log('\n3. Testing materials endpoint...');
    const materialsResponse = await axios.get('http://localhost:3000/api/materials');
    console.log('✅ Materials loaded:', materialsResponse.data.data.length, 'materials');
  } catch (error) {
    console.log('❌ Materials endpoint failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n🎉 Setup test completed!');
}

testSetup();

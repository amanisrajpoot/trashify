const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Test 1: Register a new user
    console.log('1. Testing User Registration...');
    const registerData = {
      phone: '9876543210',
      name: 'Test User',
      password: 'password123',
      role: 'customer',
      email: 'test@example.com'
    };

    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);

    // Test 2: Login
    console.log('\n2. Testing User Login...');
    const loginData = {
      phone: '9876543210',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.message);
    const token = loginResponse.data.data.token;

    // Test 3: Get user profile
    console.log('\n3. Testing Get Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.data.user.name);

    // Test 4: Send OTP
    console.log('\n4. Testing OTP Send...');
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phone: '9876543210'
    });
    console.log('✅ OTP sent:', otpResponse.data.message);

    // Test 5: Test materials endpoint
    console.log('\n5. Testing Materials Endpoint...');
    const materialsResponse = await axios.get(`${BASE_URL}/api/materials`);
    console.log('✅ Materials retrieved:', materialsResponse.data.data.materials.length, 'materials');

    // Test 6: Test booking creation
    console.log('\n6. Testing Booking Creation...');
    const bookingData = {
      pickup_address: '123 Test Street, Test City',
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      preferred_pickup_date: '2024-01-15T10:00:00Z',
      time_slot: '10:00-12:00',
      materials: [
        { material_id: 'mat_001', quantity: 2.5 }
      ],
      contact_person: 'Test User',
      contact_phone: '9876543210'
    };

    const bookingResponse = await axios.post(`${BASE_URL}/api/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Booking created:', bookingResponse.data.message);

    console.log('\n🎉 All authentication flow tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthFlow();

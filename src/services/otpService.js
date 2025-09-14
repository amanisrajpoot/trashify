const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Redis with expiration
async function storeOTP(phone, otp, expiresInMinutes = 5) {
  try {
    const redis = getRedisClient();
    const key = `otp:${phone}`;
    const data = {
      otp,
      attempts: 0,
      createdAt: new Date().toISOString()
    };
    
    // For mock Redis, we'll store in memory
    if (redis.setex) {
      await redis.setex(key, expiresInMinutes * 60, JSON.stringify(data));
    } else {
      // Mock storage - in production this would be Redis
      global.otpStorage = global.otpStorage || {};
      global.otpStorage[key] = {
        data: JSON.stringify(data),
        expiresAt: Date.now() + (expiresInMinutes * 60 * 1000)
      };
    }
    return true;
  } catch (error) {
    console.error('Store OTP error:', error);
    return false;
  }
}

// Verify OTP
async function verifyOTP(phone, inputOTP) {
  try {
    const redis = getRedisClient();
    const key = `otp:${phone}`;
    let storedData;
    
    if (redis.get) {
      storedData = await redis.get(key);
    } else {
      // Mock storage
      global.otpStorage = global.otpStorage || {};
      const stored = global.otpStorage[key];
      if (stored && stored.expiresAt > Date.now()) {
        storedData = stored.data;
      } else {
        storedData = null;
        delete global.otpStorage[key];
      }
    }
    
    if (!storedData) {
      return { success: false, message: 'OTP expired or not found' };
    }
    
    const data = JSON.parse(storedData);
    
    // Check attempts limit
    if (data.attempts >= 3) {
      if (redis.del) {
        await redis.del(key);
      } else {
        delete global.otpStorage[key];
      }
      return { success: false, message: 'Too many attempts. OTP expired.' };
    }
    
    // Verify OTP
    if (data.otp !== inputOTP) {
      data.attempts += 1;
      if (redis.setex) {
        await redis.setex(key, 5 * 60, JSON.stringify(data)); // Reset expiration
      } else {
        global.otpStorage[key] = {
          data: JSON.stringify(data),
          expiresAt: Date.now() + (5 * 60 * 1000)
        };
      }
      return { 
        success: false, 
        message: `Invalid OTP. ${3 - data.attempts} attempts remaining.` 
      };
    }
    
    // OTP verified successfully
    if (redis.del) {
      await redis.del(key);
    } else {
      delete global.otpStorage[key];
    }
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, message: 'OTP verification failed' };
  }
}

// Send OTP via SMS (mock implementation)
async function sendOTP(phone, otp) {
  try {
    // In development, just log the OTP
    console.log(`📱 SMS to ${phone}: Your Trashify OTP is ${otp}. Valid for 5 minutes.`);
    
    // In production, integrate with SMS service like:
    // - Twilio
    // - AWS SNS
    // - TextLocal
    // - MSG91
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
}

// Generate and send OTP
async function generateAndSendOTP(phone) {
  try {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    const stored = await storeOTP(phone, otp);
    if (!stored) {
      return { success: false, message: 'Failed to store OTP' };
    }
    
    // Send OTP
    const sent = await sendOTP(phone, otp);
    if (!sent.success) {
      return sent;
    }
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Generate and send OTP error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
}

// Resend OTP
async function resendOTP(phone) {
  try {
    // Check if there's an existing OTP
    const redis = getRedisClient();
    const key = `otp:${phone}`;
    const existingData = await redis.get(key);
    
    if (existingData) {
      const data = JSON.parse(existingData);
      const timeElapsed = (new Date() - new Date(data.createdAt)) / 1000 / 60; // minutes
      
      if (timeElapsed < 1) { // Wait at least 1 minute before resend
        return { 
          success: false, 
          message: `Please wait ${Math.ceil(60 - timeElapsed * 60)} seconds before requesting another OTP` 
        };
      }
    }
    
    // Generate and send new OTP
    return await generateAndSendOTP(phone);
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { success: false, message: 'Failed to resend OTP' };
  }
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP,
  generateAndSendOTP,
  resendOTP
};

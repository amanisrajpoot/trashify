import apiService from './api';

class AuthService {
  // Register user
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(phone, password) {
    try {
      const response = await apiService.post('/auth/login', {
        phone,
        password,
      });
      
      // Store token for future requests
      if (response.data && response.data.token) {
        apiService.setToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Send OTP
  async sendOTP(phone) {
    try {
      const response = await apiService.post('/auth/send-otp', { phone });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(phone, otp) {
    try {
      const response = await apiService.post('/auth/verify-otp', {
        phone,
        otp,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(phone) {
    try {
      const response = await apiService.post('/auth/resend-otp', { phone });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(phone) {
    try {
      const response = await apiService.post('/auth/forgot-password', { phone });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(phone, otp, newPassword) {
    try {
      const response = await apiService.post('/auth/reset-password', {
        phone,
        otp,
        new_password: newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout
  logout() {
    apiService.setToken(null);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!apiService.token;
  }

  // Get stored token
  getToken() {
    return apiService.token;
  }

  // Set token (for app initialization)
  setToken(token) {
    apiService.setToken(token);
  }
}

export default new AuthService();

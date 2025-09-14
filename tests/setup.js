// Jest setup file
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/trashify_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Generate random phone number
  generatePhone: () => {
    const prefix = ['6', '7', '8', '9'][Math.floor(Math.random() * 4)];
    const suffix = Math.floor(100000000 + Math.random() * 900000000);
    return prefix + suffix.toString();
  },
  
  // Generate random email
  generateEmail: () => {
    const random = Math.random().toString(36).substring(7);
    return `test${random}@example.com`;
  },
  
  // Generate random UUID
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // Wait for specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

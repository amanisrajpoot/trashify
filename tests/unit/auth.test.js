const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database for testing
const mockUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    phone: '9876543210',
    name: 'Test User',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7',
    role: 'customer',
    status: 'active',
    is_verified: true
  }
];

// Mock auth service
const authService = {
  async register(userData) {
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.phone === userData.phone);
    if (existingUser) {
      return {
        success: false,
        message: 'User with this phone number already exists'
      };
    }

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(userData.phone)) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const newUser = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      phone: userData.phone,
      name: userData.name,
      password_hash: passwordHash,
      role: userData.role,
      status: 'active',
      is_verified: userData.role === 'customer'
    };

    mockUsers.push(newUser);

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      'test-secret',
      { expiresIn: '1h' }
    );

    return {
      success: true,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        is_verified: newUser.is_verified
      },
      token
    };
  },

  async login(credentials) {
    const user = mockUsers.find(u => u.phone === credentials.phone);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid phone number or password'
      };
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid phone number or password'
      };
    }

    if (user.status !== 'active') {
      return {
        success: false,
        message: 'Account is inactive or suspended'
      };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'test-secret',
      { expiresIn: '1h' }
    );

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified
      },
      token
    };
  }
};

describe('Authentication Service', () => {
  beforeEach(() => {
    // Reset mock users array
    mockUsers.length = 1; // Keep the original test user
  });

  describe('User Registration', () => {
    test('should register new customer successfully', async () => {
      const userData = {
        phone: '9876543211',
        name: 'John Doe',
        password: 'password123',
        role: 'customer'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user.phone).toBe(userData.phone);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.role).toBe('customer');
      expect(result.token).toBeDefined();
    });

    test('should register new collector successfully', async () => {
      const userData = {
        phone: '9876543212',
        name: 'Jane Collector',
        password: 'password123',
        role: 'collector'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user.phone).toBe(userData.phone);
      expect(result.user.role).toBe('collector');
      expect(result.user.is_verified).toBe(false); // Collectors need manual verification
    });

    test('should reject duplicate phone numbers', async () => {
      const userData = {
        phone: '9876543210', // Already exists
        name: 'Duplicate User',
        password: 'password123',
        role: 'customer'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    test('should validate phone number format', async () => {
      const userData = {
        phone: '123456789', // Invalid format
        name: 'Invalid Phone',
        password: 'password123',
        role: 'customer'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid phone number format');
    });

    test('should hash password securely', async () => {
      const userData = {
        phone: '9876543213',
        name: 'Password Test',
        password: 'password123',
        role: 'customer'
      };

      const result = await authService.register(userData);
      
      expect(result.success).toBe(true);
      
      // Find the user in mock data
      const user = mockUsers.find(u => u.phone === userData.phone);
      expect(user.password_hash).not.toBe(userData.password);
      expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      const credentials = {
        phone: '9876543210',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.user.phone).toBe(credentials.phone);
      expect(result.token).toBeDefined();
    });

    test('should reject invalid phone number', async () => {
      const credentials = {
        phone: '9999999999', // Non-existent
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid phone number or password');
    });

    test('should reject invalid password', async () => {
      const credentials = {
        phone: '9876543210',
        password: 'wrongpassword'
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid phone number or password');
    });

    test('should reject inactive accounts', async () => {
      // Add an inactive user
      const inactiveUser = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        phone: '9876543214',
        name: 'Inactive User',
        password_hash: await bcrypt.hash('password123', 12),
        role: 'customer',
        status: 'inactive',
        is_verified: true
      };
      mockUsers.push(inactiveUser);

      const credentials = {
        phone: '9876543214',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Account is inactive or suspended');
    });
  });
});

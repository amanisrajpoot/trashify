# Trashify Testing Strategy & Quality Assurance

## Overview
This document outlines the comprehensive testing strategy for Trashify, ensuring high-quality delivery across all phases of development.

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \  ← End-to-End Tests (10%)
                 /______\
                /        \
               / Integration \  ← Integration Tests (20%)
              /______________\
             /                \
            /   Unit Tests     \  ← Unit Tests (70%)
           /____________________\
```

## Phase 1: Foundation Testing (Weeks 1-8)

### 1.1 Backend Unit Testing

#### Authentication Service Tests
```javascript
// tests/services/auth.test.js
describe('Authentication Service', () => {
  describe('User Registration', () => {
    test('should register new customer successfully', async () => {
      const userData = {
        phone: '9876543210',
        name: 'John Doe',
        password: 'password123',
        role: 'customer'
      }
      
      const result = await authService.register(userData)
      
      expect(result.success).toBe(true)
      expect(result.user.phone).toBe(userData.phone)
      expect(result.user.role).toBe('customer')
      expect(result.token).toBeDefined()
    })
    
    test('should reject duplicate phone numbers', async () => {
      const userData = {
        phone: '9876543210',
        name: 'Jane Doe',
        password: 'password123',
        role: 'customer'
      }
      
      // First registration
      await authService.register(userData)
      
      // Second registration with same phone
      const result = await authService.register(userData)
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('already exists')
    })
    
    test('should validate phone number format', async () => {
      const userData = {
        phone: '123456789', // Invalid format
        name: 'John Doe',
        password: 'password123',
        role: 'customer'
      }
      
      const result = await authService.register(userData)
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid phone number')
    })
  })
  
  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      const credentials = {
        phone: '9876543210',
        password: 'password123'
      }
      
      const result = await authService.login(credentials)
      
      expect(result.success).toBe(true)
      expect(result.user.phone).toBe(credentials.phone)
      expect(result.token).toBeDefined()
    })
    
    test('should reject invalid credentials', async () => {
      const credentials = {
        phone: '9876543210',
        password: 'wrongpassword'
      }
      
      const result = await authService.login(credentials)
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid credentials')
    })
  })
})
```

#### Database Service Tests
```javascript
// tests/services/database.test.js
describe('Database Service', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })
  
  afterEach(async () => {
    await db.migrate.rollback()
  })
  
  describe('User Operations', () => {
    test('should create user record', async () => {
      const userData = {
        phone: '9876543210',
        name: 'John Doe',
        password_hash: 'hashedpassword',
        role: 'customer'
      }
      
      const [user] = await db('users').insert(userData).returning('*')
      
      expect(user.phone).toBe(userData.phone)
      expect(user.name).toBe(userData.name)
      expect(user.role).toBe(userData.role)
    })
    
    test('should enforce unique phone constraint', async () => {
      const userData = {
        phone: '9876543210',
        name: 'John Doe',
        password_hash: 'hashedpassword',
        role: 'customer'
      }
      
      await db('users').insert(userData)
      
      await expect(
        db('users').insert(userData)
      ).rejects.toThrow()
    })
  })
})
```

### 1.2 Mobile App Unit Testing

#### Component Testing
```javascript
// tests/components/LoginScreen.test.js
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from '../src/screens/auth/LoginScreen'

describe('LoginScreen', () => {
  test('should render login form', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    
    expect(getByPlaceholderText('Phone Number')).toBeTruthy()
    expect(getByPlaceholderText('Password')).toBeTruthy()
    expect(getByText('Login')).toBeTruthy()
  })
  
  test('should validate phone number format', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    
    const phoneInput = getByPlaceholderText('Phone Number')
    const loginButton = getByText('Login')
    
    fireEvent.changeText(phoneInput, '123456789')
    fireEvent.press(loginButton)
    
    await waitFor(() => {
      expect(getByText('Invalid phone number format')).toBeTruthy()
    })
  })
  
  test('should call login function on valid input', async () => {
    const mockLogin = jest.fn()
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockLogin} />
    )
    
    const phoneInput = getByPlaceholderText('Phone Number')
    const passwordInput = getByPlaceholderText('Password')
    const loginButton = getByText('Login')
    
    fireEvent.changeText(phoneInput, '9876543210')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.press(loginButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phone: '9876543210',
        password: 'password123'
      })
    })
  })
})
```

#### Context Testing
```javascript
// tests/contexts/AuthContext.test.js
import { renderHook, act } from '@testing-library/react-hooks'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'

describe('AuthContext', () => {
  test('should provide initial state', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })
  
  test('should login user successfully', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.login('9876543210', 'password123')
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

### 1.3 Integration Testing

#### API Integration Tests
```javascript
// tests/integration/auth.test.js
const request = require('supertest')
const app = require('../src/server')

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register new user', async () => {
      const userData = {
        phone: '9876543210',
        name: 'John Doe',
        password: 'password123',
        role: 'customer'
      }
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.phone).toBe(userData.phone)
      expect(response.body.data.token).toBeDefined()
    })
    
    test('should validate required fields', async () => {
      const userData = {
        phone: '9876543210'
        // Missing required fields
      }
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
  
  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const credentials = {
        phone: '9876543210',
        password: 'password123'
      }
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
    })
  })
})
```

## Phase 2: Core Booking System Testing (Weeks 9-16)

### 2.1 Booking Flow Testing

#### Booking Creation Tests
```javascript
// tests/integration/booking.test.js
describe('Booking API', () => {
  let authToken
  let customerId
  
  beforeEach(async () => {
    // Create test user and get auth token
    const userData = {
      phone: '9876543210',
      name: 'John Doe',
      password: 'password123',
      role: 'customer'
    }
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
    
    authToken = response.body.data.token
    customerId = response.body.data.user.id
  })
  
  describe('POST /api/bookings', () => {
    test('should create booking successfully', async () => {
      const bookingData = {
        pickup_address: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          latitude: 19.0760,
          longitude: 72.8777
        },
        materials: [
          {
            material_id: 'material-uuid',
            estimated_weight: 5.5
          }
        ],
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.booking.customer_id).toBe(customerId)
      expect(response.body.data.booking.status).toBe('pending')
    })
    
    test('should validate required fields', async () => {
      const bookingData = {
        pickup_address: {
          street: '123 Main St'
          // Missing required fields
        }
      }
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})
```

#### Mobile App Booking Flow Tests
```javascript
// tests/e2e/booking-flow.test.js
describe('Booking Flow E2E', () => {
  test('should complete booking creation flow', async () => {
    // 1. Login as customer
    await loginUser('customer@test.com', 'password123')
    
    // 2. Navigate to create booking
    await element(by.id('create-booking-button')).tap()
    
    // 3. Select address
    await element(by.id('address-input')).typeText('123 Main St, Mumbai')
    await element(by.id('confirm-address-button')).tap()
    
    // 4. Select materials
    await element(by.id('material-paper')).tap()
    await element(by.id('weight-input')).typeText('5.5')
    
    // 5. Schedule pickup
    await element(by.id('date-picker')).tap()
    await element(by.id('tomorrow-option')).tap()
    await element(by.id('time-slot-10am')).tap()
    
    // 6. Confirm booking
    await element(by.id('confirm-booking-button')).tap()
    
    // 7. Verify booking created
    await expect(element(by.id('booking-success-message'))).toBeVisible()
  })
})
```

### 2.2 Real-time Features Testing

#### WebSocket Testing
```javascript
// tests/integration/websocket.test.js
const io = require('socket.io-client')

describe('WebSocket Integration', () => {
  let client
  
  beforeEach(() => {
    client = io('http://localhost:3000')
  })
  
  afterEach(() => {
    client.disconnect()
  })
  
  test('should join booking room', (done) => {
    const bookingId = 'test-booking-id'
    
    client.emit('join_booking', bookingId)
    
    client.on('joined_booking', (data) => {
      expect(data.bookingId).toBe(bookingId)
      done()
    })
  })
  
  test('should receive location updates', (done) => {
    const bookingId = 'test-booking-id'
    const locationData = {
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 10
    }
    
    client.emit('join_booking', bookingId)
    client.emit('update_location', { bookingId, ...locationData })
    
    client.on('collector_location', (data) => {
      expect(data.latitude).toBe(locationData.latitude)
      expect(data.longitude).toBe(locationData.longitude)
      done()
    })
  })
})
```

## Phase 3: Payment System Testing (Weeks 17-24)

### 3.1 Payment Gateway Testing

#### Razorpay Integration Tests
```javascript
// tests/integration/payment.test.js
describe('Payment Integration', () => {
  describe('Payment Order Creation', () => {
    test('should create payment order', async () => {
      const orderData = {
        amount: 100.50,
        booking_id: 'test-booking-id'
      }
      
      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.order_id).toBeDefined()
      expect(response.body.data.amount).toBe(10050) // Amount in paise
    })
  })
  
  describe('Payment Verification', () => {
    test('should verify payment successfully', async () => {
      const paymentData = {
        order_id: 'order_test_id',
        payment_id: 'pay_test_id',
        signature: 'test_signature'
      }
      
      // Mock Razorpay verification
      jest.spyOn(razorpay, 'payments').mockResolvedValue({
        status: 'captured',
        amount: 10050
      })
      
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
```

#### Mobile App Payment Tests
```javascript
// tests/e2e/payment-flow.test.js
describe('Payment Flow E2E', () => {
  test('should complete payment process', async () => {
    // 1. Complete booking
    await completeBookingFlow()
    
    // 2. Navigate to payment
    await element(by.id('payment-button')).tap()
    
    // 3. Select payment method
    await element(by.id('razorpay-option')).tap()
    
    // 4. Process payment
    await element(by.id('pay-now-button')).tap()
    
    // 5. Mock payment success
    await mockPaymentSuccess()
    
    // 6. Verify payment success
    await expect(element(by.id('payment-success-message'))).toBeVisible()
  })
})
```

## Phase 4: Advanced Features Testing (Weeks 25-32)

### 4.1 Rating System Testing

#### Rating API Tests
```javascript
// tests/integration/rating.test.js
describe('Rating System', () => {
  test('should submit rating successfully', async () => {
    const ratingData = {
      booking_id: 'test-booking-id',
      rating: 4.5,
      review: 'Great service!',
      categories: {
        punctuality: 5,
        communication: 4,
        quality: 4,
        overall: 4.5
      }
    }
    
    const response = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(ratingData)
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
  })
  
  test('should calculate average rating', async () => {
    // Submit multiple ratings
    await submitRating('booking-1', 4.0)
    await submitRating('booking-2', 5.0)
    await submitRating('booking-3', 3.0)
    
    const response = await request(app)
      .get('/api/collectors/test-collector-id/rating')
    
    expect(response.body.data.averageRating).toBe(4.0)
  })
})
```

### 4.2 Notification Testing

#### Push Notification Tests
```javascript
// tests/integration/notification.test.js
describe('Notification System', () => {
  test('should send push notification', async () => {
    const notificationData = {
      user_id: 'test-user-id',
      title: 'Booking Accepted',
      message: 'Your pickup request has been accepted',
      type: 'booking',
      data: { booking_id: 'test-booking-id' }
    }
    
    const response = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(notificationData)
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

## Phase 5: Performance Testing (Weeks 33-36)

### 5.1 Load Testing

#### API Load Tests
```javascript
// tests/load/api-load.test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1']
  }
}

export default function() {
  // Test booking creation
  let response = http.post('http://localhost:3000/api/bookings', {
    pickup_address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      latitude: 19.0760,
      longitude: 72.8777
    },
    materials: [{
      material_id: 'test-material-id',
      estimated_weight: 5.5
    }],
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }, {
    headers: { 'Authorization': 'Bearer test-token' }
  })
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
  
  sleep(1)
}
```

#### Database Performance Tests
```javascript
// tests/performance/database.test.js
describe('Database Performance', () => {
  test('should handle concurrent user registrations', async () => {
    const promises = []
    
    for (let i = 0; i < 100; i++) {
      promises.push(createUser({
        phone: `9876543${i.toString().padStart(3, '0')}`,
        name: `User ${i}`,
        password: 'password123',
        role: 'customer'
      }))
    }
    
    const start = Date.now()
    await Promise.all(promises)
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
  })
  
  test('should efficiently query nearby collectors', async () => {
    const start = Date.now()
    
    const collectors = await findNearbyCollectors({
      latitude: 19.0760,
      longitude: 72.8777,
      radius: 10
    })
    
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(100) // Should complete within 100ms
    expect(collectors.length).toBeGreaterThan(0)
  })
})
```

### 5.2 Mobile App Performance Tests

#### React Native Performance
```javascript
// tests/performance/mobile-app.test.js
describe('Mobile App Performance', () => {
  test('should render home screen within 2 seconds', async () => {
    const start = Date.now()
    
    const { getByTestId } = render(<HomeScreen />)
    await waitFor(() => getByTestId('home-screen'))
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })
  
  test('should handle large material lists efficiently', async () => {
    const materials = generateMockMaterials(1000)
    
    const start = Date.now()
    const { getByTestId } = render(<MaterialListScreen materials={materials} />)
    await waitFor(() => getByTestId('material-list'))
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(3000)
  })
})
```

## Phase 6: Security Testing (Weeks 33-36)

### 6.1 Security Test Suite

#### Authentication Security
```javascript
// tests/security/auth-security.test.js
describe('Authentication Security', () => {
  test('should prevent SQL injection in login', async () => {
    const maliciousInput = "'; DROP TABLE users; --"
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: maliciousInput,
        password: 'password123'
      })
    
    expect(response.status).toBe(400)
    // Verify users table still exists
    const users = await db('users').select('*').limit(1)
    expect(users).toBeDefined()
  })
  
  test('should rate limit login attempts', async () => {
    const credentials = {
      phone: '9876543210',
      password: 'wrongpassword'
    }
    
    // Make multiple failed login attempts
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/auth/login')
        .send(credentials)
    }
    
    // Should be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
    
    expect(response.status).toBe(429)
  })
})
```

#### Data Security
```javascript
// tests/security/data-security.test.js
describe('Data Security', () => {
  test('should encrypt sensitive data', async () => {
    const userData = {
      phone: '9876543210',
      name: 'John Doe',
      password: 'password123',
      role: 'customer'
    }
    
    await request(app)
      .post('/api/auth/register')
      .send(userData)
    
    // Check that password is hashed in database
    const user = await db('users').where('phone', userData.phone).first()
    expect(user.password_hash).not.toBe(userData.password)
    expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/)
  })
  
  test('should validate JWT tokens', async () => {
    const invalidToken = 'invalid.jwt.token'
    
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${invalidToken}`)
    
    expect(response.status).toBe(401)
  })
})
```

## Quality Gates & Metrics

### Code Coverage Requirements
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: 70%+ coverage

### Performance Benchmarks
- **API Response Time**: < 500ms (95th percentile)
- **Database Queries**: < 100ms (95th percentile)
- **Mobile App Launch**: < 3 seconds
- **Memory Usage**: < 100MB (mobile app)

### Security Requirements
- **OWASP Top 10**: All vulnerabilities addressed
- **Authentication**: Multi-factor authentication support
- **Data Encryption**: All sensitive data encrypted
- **Rate Limiting**: Implemented on all endpoints

### Testing Tools & Frameworks

#### Backend Testing
- **Jest**: Unit testing framework
- **Supertest**: API testing
- **K6**: Load testing
- **Postman**: API documentation and testing

#### Mobile App Testing
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing
- **Flipper**: Debugging and performance

#### Admin Dashboard Testing
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **Storybook**: Component documentation

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: trashify_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/trashify_test
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

This comprehensive testing strategy ensures that Trashify is delivered with high quality, security, and performance standards across all phases of development.

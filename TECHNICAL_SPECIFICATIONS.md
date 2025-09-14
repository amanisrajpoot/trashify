# Trashify Technical Specifications

## Phase 1: Foundation & Core Infrastructure

### 1.1 Backend API Specifications

#### Authentication System
```javascript
// User Registration Schema
{
  "phone": "string (10 digits, Indian format)",
  "email": "string (optional, valid email)",
  "name": "string (2-50 characters)",
  "password": "string (min 6 characters)",
  "role": "enum ['customer', 'collector', 'admin']",
  "address": {
    "street": "string",
    "city": "string", 
    "state": "string",
    "pincode": "string (6 digits)",
    "landmark": "string (optional)"
  }
}

// JWT Token Structure
{
  "userId": "uuid",
  "role": "string",
  "iat": "timestamp",
  "exp": "timestamp"
}
```

#### Database Schema Requirements
```sql
-- Users table with proper indexing
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status user_status DEFAULT 'active',
  profile_image_url VARCHAR(500),
  address JSONB,
  verification_documents JSONB,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### API Endpoints Specification
```javascript
// Authentication Endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me

// User Management Endpoints
GET  /api/users/profile
PUT  /api/users/profile
PUT  /api/users/change-password
GET  /api/users/stats
PUT  /api/users/location
GET  /api/users/nearby-collectors
```

### 1.2 Mobile App Specifications

#### Navigation Structure
```javascript
// Authentication Flow
AuthNavigator
├── WelcomeScreen
├── LoginScreen
├── RegisterScreen
├── ForgotPasswordScreen
└── OTPVerificationScreen

// Main App Flow
AppNavigator
├── CustomerStack
│   ├── HomeScreen
│   ├── CreateBookingScreen
│   ├── BookingDetailsScreen
│   ├── MaterialListScreen
│   └── PaymentHistoryScreen
├── BookingsStack
│   ├── BookingsListScreen
│   └── BookingDetailsScreen
└── ProfileStack
    ├── ProfileScreen
    ├── SettingsScreen
    └── HelpScreen
```

#### State Management Architecture
```javascript
// Context Providers
AuthContext
├── user: User | null
├── token: string | null
├── isLoading: boolean
├── login: (credentials) => Promise<AuthResult>
├── register: (userData) => Promise<AuthResult>
├── logout: () => Promise<void>
└── updateUser: (userData) => void

LocationContext
├── location: Location | null
├── isLoading: boolean
├── error: string | null
├── requestPermission: () => Promise<boolean>
├── getCurrentLocation: () => Promise<Location>
└── refreshLocation: () => Promise<void>

NotificationContext
├── notifications: Notification[]
├── unreadCount: number
├── sendLocalNotification: (title, message) => void
├── scheduleNotification: (title, message, date) => void
└── cancelAllNotifications: () => void
```

### 1.3 Admin Dashboard Specifications

#### Component Architecture
```javascript
// Layout Structure
Layout
├── Sidebar
│   ├── NavigationMenu
│   ├── UserProfile
│   └── LogoutButton
├── Header
│   ├── PageTitle
│   ├── SearchBar
│   └── NotificationBell
└── MainContent
    ├── Dashboard
    ├── Users
    ├── Bookings
    ├── Payments
    ├── Inventory
    ├── Materials
    ├── Analytics
    └── Settings
```

#### Data Management
```javascript
// API Integration
const useQuery = (queryKey, queryFn, options) => {
  // React Query implementation
  // Automatic caching, background updates
  // Error handling and retry logic
}

// State Management
const useAuth = () => {
  // Authentication state
  // Token management
  // User session handling
}
```

## Phase 2: Core Booking System

### 2.1 Booking Creation Flow

#### Backend API Specifications
```javascript
// Booking Creation Schema
{
  "pickup_address": {
    "street": "string (required)",
    "city": "string (required)",
    "state": "string (required)",
    "pincode": "string (6 digits, required)",
    "landmark": "string (optional)",
    "latitude": "number (required)",
    "longitude": "number (required)"
  },
  "materials": [
    {
      "material_id": "uuid (required)",
      "estimated_weight": "number (required, > 0)",
      "description": "string (optional)"
    }
  ],
  "scheduled_at": "datetime (required, future date)",
  "special_instructions": "string (optional, max 500 chars)"
}

// Booking Status Flow
pending → accepted → in_progress → completed
    ↓
cancelled
```

#### Database Schema
```sql
-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status booking_status DEFAULT 'pending',
  pickup_address JSONB NOT NULL,
  materials JSONB NOT NULL,
  estimated_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  scheduled_at TIMESTAMP NOT NULL,
  picked_up_at TIMESTAMP,
  special_instructions TEXT,
  images JSONB,
  rating DECIMAL(2,1),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_collector_id ON bookings(collector_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
```

### 2.2 Mobile App Booking Flow

#### Screen Specifications
```javascript
// CreateBookingScreen Components
const CreateBookingScreen = () => {
  // Step 1: Address Selection
  const AddressStep = () => {
    // Location permission handling
    // Maps integration
    // Address validation
    // Manual address input
  }

  // Step 2: Material Selection
  const MaterialStep = () => {
    // Material categories
    // Weight estimation
    // Price calculation
    // Material images
  }

  // Step 3: Scheduling
  const SchedulingStep = () => {
    // Date picker
    // Time slot selection
    // Availability checking
    // Special instructions
  }

  // Step 4: Confirmation
  const ConfirmationStep = () => {
    // Booking summary
    // Price breakdown
    // Terms and conditions
    // Final confirmation
  }
}
```

#### State Management
```javascript
// Booking Context
const BookingContext = createContext({
  currentStep: 1,
  bookingData: {
    address: null,
    materials: [],
    scheduledAt: null,
    specialInstructions: ''
  },
  setStep: (step) => void,
  updateBookingData: (data) => void,
  resetBooking: () => void,
  submitBooking: () => Promise<Booking>
})
```

### 2.3 Real-time Tracking System

#### WebSocket Implementation
```javascript
// WebSocket Events
const WebSocketEvents = {
  // Client to Server
  JOIN_BOOKING: 'join_booking',
  UPDATE_LOCATION: 'update_location',
  SEND_MESSAGE: 'send_message',
  
  // Server to Client
  BOOKING_UPDATED: 'booking_updated',
  COLLECTOR_LOCATION: 'collector_location',
  MESSAGE_RECEIVED: 'message_received',
  STATUS_CHANGED: 'status_changed'
}

// WebSocket Handler
const handleWebSocket = (socket) => {
  socket.on('join_booking', (bookingId) => {
    socket.join(`booking_${bookingId}`)
  })
  
  socket.on('update_location', (data) => {
    // Update collector location
    // Broadcast to customer
  })
}
```

#### Location Tracking
```javascript
// Location Service
const LocationService = {
  startTracking: (bookingId) => {
    // Start GPS tracking
    // Send location updates
    // Handle accuracy requirements
  },
  
  stopTracking: () => {
    // Stop GPS tracking
    // Clean up resources
  },
  
  getCurrentLocation: () => {
    // Get accurate location
    // Handle permissions
    // Return coordinates
  }
}
```

## Phase 3: Payment & Financial System

### 3.1 Payment Gateway Integration

#### Razorpay Integration
```javascript
// Payment Order Creation
const createPaymentOrder = async (amount, bookingId) => {
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: `booking_${bookingId}_${Date.now()}`,
    notes: {
      booking_id: bookingId,
      user_id: userId
    }
  }
  
  return await razorpay.orders.create(options)
}

// Payment Verification
const verifyPayment = async (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex')
  
  return expectedSignature === signature
}
```

#### Database Schema
```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type payment_type NOT NULL,
  status payment_status DEFAULT 'pending',
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  payment_details JSONB,
  failure_reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Wallet System

#### Wallet Implementation
```javascript
// Wallet Service
const WalletService = {
  getBalance: async (userId) => {
    // Get current wallet balance
    // Include pending transactions
  },
  
  addFunds: async (userId, amount, source) => {
    // Add funds to wallet
    // Create transaction record
    // Update balance
  },
  
  deductFunds: async (userId, amount, purpose) => {
    // Deduct funds from wallet
    // Check sufficient balance
    // Create transaction record
  },
  
  getTransactionHistory: async (userId, filters) => {
    // Get transaction history
    // Apply filters
    // Paginate results
  }
}
```

#### Mobile App Wallet Interface
```javascript
// WalletScreen Components
const WalletScreen = () => {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Wallet balance display
  // Transaction history
  // Add funds button
  // Withdraw funds button
  // Transaction filters
}
```

## Phase 4: Advanced Features & Optimization

### 4.1 Rating & Review System

#### Rating Implementation
```javascript
// Rating Schema
{
  "booking_id": "uuid",
  "customer_id": "uuid",
  "collector_id": "uuid",
  "rating": "number (1-5)",
  "review": "string (optional)",
  "categories": {
    "punctuality": "number (1-5)",
    "communication": "number (1-5)",
    "quality": "number (1-5)",
    "overall": "number (1-5)"
  },
  "created_at": "timestamp"
}

// Rating Calculation
const calculateAverageRating = (ratings) => {
  const total = ratings.reduce((sum, rating) => sum + rating.overall, 0)
  return total / ratings.length
}
```

#### Review Management
```javascript
// Review Service
const ReviewService = {
  submitReview: async (bookingId, rating, review) => {
    // Validate rating
    // Save review
    // Update collector rating
    // Send notifications
  },
  
  getReviews: async (collectorId, filters) => {
    // Get reviews for collector
    // Apply filters
    // Paginate results
  },
  
  moderateReview: async (reviewId, action) => {
    // Moderate review content
    // Approve/reject review
    // Update status
  }
}
```

### 4.2 Notification System

#### Push Notification Service
```javascript
// Firebase Cloud Messaging
const sendNotification = async (userId, notification) => {
  const message = {
    notification: {
      title: notification.title,
      body: notification.message
    },
    data: {
      type: notification.type,
      booking_id: notification.booking_id
    },
    token: user.fcm_token
  }
  
  return await admin.messaging().send(message)
}

// Notification Types
const NotificationTypes = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_IN_PROGRESS: 'booking_in_progress',
  BOOKING_COMPLETED: 'booking_completed',
  PAYMENT_RECEIVED: 'payment_received',
  RATING_RECEIVED: 'rating_received'
}
```

#### Mobile App Notification Handling
```javascript
// Notification Handler
const NotificationHandler = {
  handleNotification: (notification) => {
    const { type, data } = notification
    
    switch (type) {
      case 'booking_created':
        // Navigate to booking details
        break
      case 'payment_received':
        // Show payment confirmation
        break
      default:
        // Handle generic notification
    }
  },
  
  scheduleNotification: (title, message, date) => {
    // Schedule local notification
    // Handle timezone
    // Store notification data
  }
}
```

### 4.3 Analytics & Reporting

#### Analytics Data Collection
```javascript
// Analytics Service
const AnalyticsService = {
  trackEvent: (event, properties) => {
    // Track user events
    // Store analytics data
    // Send to analytics service
  },
  
  trackPageView: (page, properties) => {
    // Track page views
    // Store navigation data
    // Calculate engagement metrics
  },
  
  trackConversion: (conversion, value) => {
    // Track conversions
    // Calculate conversion rate
    // Store revenue data
  }
}

// Key Metrics
const KeyMetrics = {
  USER_ACQUISITION: 'user_acquisition',
  USER_RETENTION: 'user_retention',
  BOOKING_CONVERSION: 'booking_conversion',
  PAYMENT_SUCCESS: 'payment_success',
  USER_ENGAGEMENT: 'user_engagement'
}
```

#### Reporting Dashboard
```javascript
// Analytics Dashboard
const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState({})
  const [dateRange, setDateRange] = useState('7d')
  
  // Revenue metrics
  // User metrics
  // Booking metrics
  // Performance metrics
  // Custom date range
  // Export functionality
}
```

## Phase 5: Testing & Quality Assurance

### 5.1 Testing Strategy

#### Unit Testing
```javascript
// Backend Unit Tests
describe('Authentication Service', () => {
  test('should register new user', async () => {
    const userData = {
      phone: '9876543210',
      name: 'Test User',
      password: 'password123',
      role: 'customer'
    }
    
    const result = await authService.register(userData)
    expect(result.success).toBe(true)
    expect(result.user.phone).toBe(userData.phone)
  })
})

// Mobile App Unit Tests
describe('Booking Context', () => {
  test('should update booking data', () => {
    const { result } = renderHook(() => useBooking())
    
    act(() => {
      result.current.updateBookingData({
        address: mockAddress,
        materials: mockMaterials
      })
    })
    
    expect(result.current.bookingData.address).toBe(mockAddress)
  })
})
```

#### Integration Testing
```javascript
// API Integration Tests
describe('Booking API', () => {
  test('should create booking successfully', async () => {
    const bookingData = {
      pickup_address: mockAddress,
      materials: mockMaterials,
      scheduled_at: futureDate
    }
    
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingData)
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
  })
})
```

#### End-to-End Testing
```javascript
// E2E Test Scenarios
describe('Complete Booking Flow', () => {
  test('should complete booking from creation to payment', async () => {
    // 1. User login
    await loginUser('customer@test.com', 'password')
    
    // 2. Create booking
    await createBooking(mockBookingData)
    
    // 3. Assign collector
    await assignCollector(bookingId, collectorId)
    
    // 4. Complete pickup
    await completePickup(bookingId, pickupData)
    
    // 5. Process payment
    await processPayment(bookingId, paymentData)
    
    // Verify final state
    expect(booking.status).toBe('completed')
    expect(payment.status).toBe('completed')
  })
})
```

### 5.2 Performance Testing

#### Load Testing
```javascript
// Load Test Configuration
const loadTestConfig = {
  target: 'http://localhost:3000',
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
```

#### Mobile App Performance
```javascript
// Performance Monitoring
const PerformanceMonitor = {
  trackRenderTime: (componentName, renderTime) => {
    // Track component render times
    // Identify performance bottlenecks
    // Optimize slow components
  },
  
  trackMemoryUsage: () => {
    // Monitor memory usage
    // Detect memory leaks
    // Optimize memory consumption
  },
  
  trackNetworkPerformance: (request, responseTime) => {
    // Track API response times
    // Optimize network requests
    // Implement caching strategies
  }
}
```

## Phase 6: Launch & Post-Launch

### 6.1 Production Deployment

#### Infrastructure Setup
```yaml
# Docker Compose Production
version: '3.8'
services:
  backend:
    image: trashify-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=trashify
      - POSTGRES_USER=trashify_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

#### Monitoring Setup
```javascript
// Monitoring Configuration
const monitoringConfig = {
  healthChecks: {
    database: 'http://localhost:3000/health/db',
    redis: 'http://localhost:3000/health/redis',
    api: 'http://localhost:3000/health'
  },
  
  metrics: {
    responseTime: true,
    errorRate: true,
    throughput: true,
    memoryUsage: true,
    cpuUsage: true
  },
  
  alerts: {
    errorRate: { threshold: 5, duration: '5m' },
    responseTime: { threshold: 1000, duration: '2m' },
    memoryUsage: { threshold: 80, duration: '10m' }
  }
}
```

### 6.2 Post-Launch Monitoring

#### Key Performance Indicators
```javascript
// KPI Tracking
const KPIs = {
  userMetrics: {
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0,
    userRetentionRate: 0,
    userAcquisitionCost: 0
  },
  
  businessMetrics: {
    dailyBookings: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0
  },
  
  technicalMetrics: {
    apiResponseTime: 0,
    errorRate: 0,
    uptime: 0,
    mobileAppCrashRate: 0
  }
}
```

#### Continuous Improvement
```javascript
// Feedback Collection
const FeedbackSystem = {
  collectUserFeedback: (userId, feedback) => {
    // Collect user feedback
    // Analyze sentiment
    // Identify improvement areas
  },
  
  trackFeatureUsage: (feature, usage) => {
    // Track feature usage
    // Identify popular features
    // Optimize underused features
  },
  
  monitorPerformance: () => {
    // Monitor system performance
    // Identify bottlenecks
    // Implement optimizations
  }
}
```

This technical specification ensures that each phase is thoroughly planned with detailed implementation requirements, testing strategies, and quality gates to maintain high standards throughout development.

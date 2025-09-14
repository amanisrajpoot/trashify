# Trashify - Home Pickup Service for Recyclable Waste

## Overview
Trashify is a mobile application that connects users with waste collectors for home pickup of recyclable materials. Users can book pickup services, and collectors will come to their location, collect recyclable waste, and pay users based on the weight and type of materials collected.

## Key Features

### For Users (Customers)
- **Easy Booking**: Schedule trash pickup appointments
- **Material Classification**: Categorize waste (paper, plastic, metal, glass, e-waste)
- **Real-time Tracking**: Track collector location and pickup status
- **Instant Payment**: Receive payment immediately after pickup
- **Pickup History**: View past pickups and earnings
- **Rating System**: Rate collector service

### For Collectors
- **Job Management**: View and accept pickup requests
- **Route Optimization**: Efficient pickup routes
- **Payment Tracking**: Track earnings and payments
- **Inventory Management**: Manage collected materials
- **Customer Communication**: Chat with customers

### For Admin
- **Dashboard**: Monitor operations and analytics
- **Collector Management**: Manage collector profiles and verification
- **Pricing Management**: Set rates for different materials
- **Quality Control**: Monitor pickup quality and customer satisfaction
- **Financial Reports**: Track payments and earnings

## Technology Stack

### Frontend
- **Mobile App**: React Native (iOS & Android)
- **Admin Dashboard**: React.js with Material-UI

### Backend
- **API Server**: Node.js with Express.js
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 for images

### Infrastructure
- **Cloud**: AWS (EC2, RDS, S3, CloudFront)
- **Payment**: Razorpay integration
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging
- **Monitoring**: AWS CloudWatch

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Admin Panel   │    │  Collector App  │
│   (Customer)    │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │    (Rate Limiting,        │
                    │     Authentication)       │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Microservices        │
                    │  ┌─────────────────────┐  │
                    │  │   User Service      │  │
                    │  │   Booking Service   │  │
                    │  │   Payment Service   │  │
                    │  │   Notification Svc  │  │
                    │  │   Inventory Service │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Database Layer       │
                    │  ┌─────────────────────┐  │
                    │  │   PostgreSQL        │  │
                    │  │   Redis Cache       │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

## Database Schema

### Core Tables
- **users**: Customer and collector profiles
- **bookings**: Pickup requests and status
- **materials**: Recyclable material types and pricing
- **payments**: Transaction records
- **inventory**: Collected materials tracking
- **notifications**: User notifications
- **reviews**: Service ratings and feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Bookings
- `POST /api/bookings` - Create pickup request
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/calculate` - Calculate payment amount
- `POST /api/payments/process` - Process payment
- `GET /api/payments/history` - Payment history

### Materials
- `GET /api/materials` - Get material types and prices
- `PUT /api/materials/:id` - Update material pricing (admin)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- React Native development environment

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations
5. Start the development server

## Environment Variables
```
DATABASE_URL=postgresql://username:password@localhost:5432/trashify
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
FCM_SERVER_KEY=your_fcm_server_key
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License
MIT License

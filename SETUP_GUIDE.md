# Trashify Setup Guide

## Prerequisites

Before setting up Trashify, ensure you have the following installed:

### Required Software
- **Node.js 18+**: [Download here](https://nodejs.org/)
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download here](https://git-scm.com/)

### Optional Software
- **VS Code**: [Download here](https://code.visualstudio.com/)
- **Postman**: [Download here](https://www.postman.com/) (for API testing)
- **Android Studio**: [Download here](https://developer.android.com/studio) (for mobile development)
- **Xcode**: [Download here](https://developer.apple.com/xcode/) (for iOS development)

## Quick Setup (Automated)

### Windows
```bash
# Run the setup script
scripts\setup.bat
```

### Linux/macOS
```bash
# Make script executable and run
chmod +x scripts/setup.sh
./scripts/setup.sh
```

## Manual Setup

If the automated setup doesn't work, follow these manual steps:

### 1. Clone and Setup Project

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd trashify

# Create necessary directories
mkdir logs uploads ssl
mkdir mobile-app/android/app/src/main/assets
mkdir admin-dashboard/public
```

### 2. Environment Configuration

```bash
# Copy environment files
cp env.example .env
cp mobile-app/env.example mobile-app/.env
cp admin-dashboard/env.example admin-dashboard/.env
```

**Important**: Update the `.env` files with your actual API keys and configuration values.

### 3. Install Dependencies

```bash
# Backend dependencies
npm install

# Mobile app dependencies
cd mobile-app
npm install
cd ..

# Admin dashboard dependencies
cd admin-dashboard
npm install
cd ..
```

### 4. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d postgres redis

# Wait for services to be ready (about 30 seconds)
```

### 5. Setup Database

```bash
# Run database migrations
npm run migrate

# Seed database with initial data
npm run seed
```

### 6. Create SSL Certificates (Development)

```bash
# For Windows (using Git Bash or WSL)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=Trashify/OU=Development/CN=localhost"

# For Linux/macOS
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=Trashify/OU=Development/CN=localhost"
```

## Configuration

### Backend Configuration (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://trashify_user:trashify_password@localhost:5432/trashify
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key
FCM_PROJECT_ID=your_fcm_project_id

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=trashify-uploads
```

### Mobile App Configuration (mobile-app/.env)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000

# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Razorpay Configuration
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Admin Dashboard Configuration (admin-dashboard/.env)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# App Configuration
REACT_APP_APP_NAME=Trashify Admin
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Running the Application

### Start Backend API

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at: `http://localhost:3000`

### Start Admin Dashboard

```bash
cd admin-dashboard
npm start
```

The admin dashboard will be available at: `http://localhost:3001`

### Start Mobile App

```bash
cd mobile-app

# For Android
npm run android

# For iOS
npm run ios

# For development server only
npm start
```

## API Documentation

Once the backend is running, you can access:

- **API Health Check**: `GET http://localhost:3000/health`
- **API Documentation**: Available in the `/docs` endpoint (if implemented)

## Default Credentials

After running the seed script, you can use these default credentials:

### Admin User
- **Phone**: 9999999999
- **Password**: admin123
- **Role**: admin

### Test Customer
- **Phone**: 9876543210
- **Password**: customer123
- **Role**: customer

### Test Collector
- **Phone**: 9876543211
- **Password**: collector123
- **Role**: collector

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts (customers, collectors, admins)
- `materials` - Recyclable material types and pricing
- `bookings` - Pickup requests and status
- `payments` - Payment transactions
- `inventory` - Collected materials tracking
- `notifications` - User notifications
- `collector_locations` - Real-time collector locations

## Troubleshooting

### Common Issues

1. **Docker not starting**
   - Ensure Docker Desktop is running
   - Check if ports 5432 and 6379 are available

2. **Database connection failed**
   - Wait for PostgreSQL to fully start (30-60 seconds)
   - Check if the database container is running: `docker-compose ps`

3. **Node modules issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **Mobile app build issues**
   - Ensure Android Studio is installed for Android development
   - Ensure Xcode is installed for iOS development
   - Check if React Native CLI is installed: `npm install -g react-native-cli`

5. **Permission issues (Linux/macOS)**
   - Run `chmod +x scripts/setup.sh`
   - Ensure you have proper permissions for the project directory

### Logs

- **Backend logs**: Check `logs/` directory
- **Docker logs**: `docker-compose logs [service-name]`
- **Mobile app logs**: Use React Native debugger or Metro bundler console

### Reset Everything

If you need to start fresh:

```bash
# Stop all services
docker-compose down

# Remove all data
docker-compose down -v

# Remove node_modules
rm -rf node_modules mobile-app/node_modules admin-dashboard/node_modules

# Reinstall and setup
npm install
cd mobile-app && npm install && cd ..
cd admin-dashboard && npm install && cd ..

# Start fresh
docker-compose up -d postgres redis
npm run migrate
npm run seed
```

## Development Workflow

1. **Start the backend**: `npm run dev`
2. **Start the admin dashboard**: `cd admin-dashboard && npm start`
3. **Start the mobile app**: `cd mobile-app && npm start`
4. **Make changes** to the code
5. **Test** using the provided test credentials
6. **Commit** your changes

## Next Steps

After successful setup:

1. **Update API keys** in the `.env` files
2. **Test the API** using Postman or the admin dashboard
3. **Test the mobile app** on a device or simulator
4. **Start developing** new features following the development phases

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all prerequisites are installed
4. Check if all services are running properly

For additional help, refer to the project documentation or create an issue in the repository.

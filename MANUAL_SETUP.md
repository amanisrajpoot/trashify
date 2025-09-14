# Manual Setup Guide (Without Docker)

Since Docker Desktop is not running, here's how to set up Trashify manually:

## Prerequisites
- Node.js 18+ ✅ (Already installed)
- PostgreSQL (Download from: https://www.postgresql.org/download/windows/)
- Redis (Download from: https://github.com/microsoftarchive/redis/releases)

## Step 1: Install PostgreSQL

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Start PostgreSQL service

## Step 2: Install Redis

1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Keep Redis running in a separate terminal

## Step 3: Create Database

```sql
-- Connect to PostgreSQL and run these commands:
CREATE DATABASE trashify;
CREATE USER trashify_user WITH PASSWORD 'trashify_password';
GRANT ALL PRIVILEGES ON DATABASE trashify TO trashify_user;
```

## Step 4: Update Environment Variables

Update your `.env` file with the correct database URL:

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

# Payment Gateway (Razorpay) - Add your keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Maps API - Add your key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Cloud Messaging - Add your keys
FCM_SERVER_KEY=your_fcm_server_key
FCM_PROJECT_ID=your_fcm_project_id

# AWS Configuration - Add your keys
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=trashify-uploads
```

## Step 5: Run Database Migrations

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

## Step 6: Start the Application

```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Admin Dashboard
cd admin-dashboard
npm start

# Terminal 3: Mobile App (when ready)
cd mobile-app
npm start
```

## Alternative: Use SQLite (Simplest Option)

If you want to avoid PostgreSQL setup, I can modify the configuration to use SQLite instead, which requires no additional installation.

Would you like me to:
1. **Wait for you to start Docker Desktop** and continue with the original setup?
2. **Create a SQLite version** that works without any database installation?
3. **Help you install PostgreSQL and Redis** manually?

Let me know which option you prefer!

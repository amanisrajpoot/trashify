@echo off
REM Quick Setup Script for Trashify (SQLite Version)
REM This script sets up Trashify using SQLite instead of PostgreSQL

echo 🚀 Quick Setup for Trashify (SQLite Version)...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is installed

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist mobile-app\android\app\src\main\assets mkdir mobile-app\android\app\src\main\assets
if not exist admin-dashboard\public mkdir admin-dashboard\public
echo [SUCCESS] Directories created

REM Copy environment files
echo [INFO] Setting up environment files...
if not exist .env (
    copy env.example .env
    echo [WARNING] Created .env file from env.example. Please update with your actual values.
) else (
    echo [SUCCESS] .env file already exists
)

REM Update .env for SQLite
echo [INFO] Configuring for SQLite...
echo DATABASE_URL=sqlite3://./dev.sqlite3 > .env.sqlite
echo REDIS_URL=redis://localhost:6379 >> .env.sqlite
echo JWT_SECRET=your_super_secret_jwt_key_here >> .env.sqlite
echo JWT_REFRESH_SECRET=your_super_secret_refresh_key_here >> .env.sqlite
echo JWT_EXPIRES_IN=1h >> .env.sqlite
echo JWT_REFRESH_EXPIRES_IN=7d >> .env.sqlite
echo PORT=3000 >> .env.sqlite
echo NODE_ENV=development >> .env.sqlite
echo RAZORPAY_KEY_ID=your_razorpay_key_id >> .env.sqlite
echo RAZORPAY_KEY_SECRET=your_razorpay_key_secret >> .env.sqlite
echo GOOGLE_MAPS_API_KEY=your_google_maps_api_key >> .env.sqlite
echo FCM_SERVER_KEY=your_fcm_server_key >> .env.sqlite
echo FCM_PROJECT_ID=your_fcm_project_id >> .env.sqlite
echo AWS_ACCESS_KEY_ID=your_aws_access_key >> .env.sqlite
echo AWS_SECRET_ACCESS_KEY=your_aws_secret_key >> .env.sqlite
echo AWS_REGION=ap-south-1 >> .env.sqlite
echo AWS_S3_BUCKET=trashify-uploads >> .env.sqlite

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

REM Install mobile app dependencies
echo [INFO] Installing mobile app dependencies...
cd mobile-app
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install mobile app dependencies
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Mobile app dependencies installed

REM Install admin dashboard dependencies
echo [INFO] Installing admin dashboard dependencies...
cd admin-dashboard
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install admin dashboard dependencies
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Admin dashboard dependencies installed

REM Run database migrations with SQLite
echo [INFO] Running database migrations with SQLite...
call npx knex migrate:latest --knexfile knexfile.sqlite.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run database migrations
    pause
    exit /b 1
)
echo [SUCCESS] Database migrations completed

REM Seed database
echo [INFO] Seeding database with initial data...
call npx knex seed:run --knexfile knexfile.sqlite.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to seed database
    pause
    exit /b 1
)
echo [SUCCESS] Database seeded with initial data

echo.
echo ==========================================
echo [SUCCESS] Quick setup completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Update .env file with your actual API keys
echo 2. Start the development servers:
echo    - Backend: npm run dev
echo    - Admin Dashboard: cd admin-dashboard ^&^& npm start
echo    - Mobile App: cd mobile-app ^&^& npm start
echo.
echo Default admin credentials:
echo   Phone: 9999999999
echo   Password: admin123
echo.
echo Test user credentials:
echo   Customer - Phone: 9876543210, Password: customer123
echo   Collector - Phone: 9876543211, Password: collector123
echo.
echo Note: This setup uses SQLite instead of PostgreSQL.
echo For production, you should use PostgreSQL.
echo.
echo Happy coding! 🎉
pause

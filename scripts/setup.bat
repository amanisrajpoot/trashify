@echo off
REM Trashify Development Environment Setup Script for Windows
REM This script sets up the development environment for Trashify

echo 🚀 Setting up Trashify Development Environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/install/
    pause
    exit /b 1
)
echo [SUCCESS] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)
echo [SUCCESS] Docker Compose is installed

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
if not exist ssl mkdir ssl
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

if not exist mobile-app\.env (
    copy mobile-app\env.example mobile-app\.env
    echo [WARNING] Created mobile-app\.env file. Please update with your actual values.
) else (
    echo [SUCCESS] mobile-app\.env file already exists
)

if not exist admin-dashboard\.env (
    copy admin-dashboard\env.example admin-dashboard\.env
    echo [WARNING] Created admin-dashboard\.env file. Please update with your actual values.
) else (
    echo [SUCCESS] admin-dashboard\.env file already exists
)

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
call npm install
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

REM Start Docker services
echo [INFO] Starting Docker services (PostgreSQL and Redis)...
docker-compose up -d postgres redis
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services
    pause
    exit /b 1
)
echo [SUCCESS] Docker services started

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Check if database is ready
for /l %%i in (1,1,30) do (
    docker-compose exec -T postgres pg_isready -U trashify_user -d trashify >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database is ready
        goto :db_ready
    )
    echo [INFO] Waiting for database... (%%i/30)
    timeout /t 2 /nobreak >nul
)

echo [ERROR] Database failed to start within 60 seconds
pause
exit /b 1

:db_ready

REM Run database migrations
echo [INFO] Running database migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run database migrations
    pause
    exit /b 1
)
echo [SUCCESS] Database migrations completed

REM Seed database
echo [INFO] Seeding database with initial data...
call npm run seed
if %errorlevel% neq 0 (
    echo [ERROR] Failed to seed database
    pause
    exit /b 1
)
echo [SUCCESS] Database seeded with initial data

echo.
echo ==========================================
echo [SUCCESS] Setup completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Update .env files with your actual API keys and configuration
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
echo Happy coding! 🎉
pause

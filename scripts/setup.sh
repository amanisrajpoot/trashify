#!/bin/bash

# Trashify Development Environment Setup Script
# This script sets up the development environment for Trashify

set -e

echo "🚀 Setting up Trashify Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p ssl
    mkdir -p mobile-app/android/app/src/main/assets
    mkdir -p admin-dashboard/public
    
    print_success "Directories created"
}

# Copy environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_warning "Created .env file from env.example. Please update with your actual values."
    else
        print_success ".env file already exists"
    fi
    
    if [ ! -f mobile-app/.env ]; then
        cp mobile-app/env.example mobile-app/.env
        print_warning "Created mobile-app/.env file. Please update with your actual values."
    else
        print_success "mobile-app/.env file already exists"
    fi
    
    if [ ! -f admin-dashboard/.env ]; then
        cp admin-dashboard/env.example admin-dashboard/.env
        print_warning "Created admin-dashboard/.env file. Please update with your actual values."
    else
        print_success "admin-dashboard/.env file already exists"
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
}

# Install mobile app dependencies
install_mobile_deps() {
    print_status "Installing mobile app dependencies..."
    cd mobile-app
    npm install
    cd ..
    print_success "Mobile app dependencies installed"
}

# Install admin dashboard dependencies
install_admin_deps() {
    print_status "Installing admin dashboard dependencies..."
    cd admin-dashboard
    npm install
    cd ..
    print_success "Admin dashboard dependencies installed"
}

# Start Docker services
start_docker_services() {
    print_status "Starting Docker services (PostgreSQL and Redis)..."
    docker-compose up -d postgres redis
    print_success "Docker services started"
}

# Wait for database to be ready
wait_for_database() {
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Check if database is ready
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U trashify_user -d trashify &> /dev/null; then
            print_success "Database is ready"
            return
        fi
        print_status "Waiting for database... ($i/30)"
        sleep 2
    done
    
    print_error "Database failed to start within 60 seconds"
    exit 1
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npm run migrate
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database with initial data..."
    npm run seed
    print_success "Database seeded with initial data"
}

# Create SSL certificates for development
create_ssl_certificates() {
    print_status "Creating SSL certificates for development..."
    
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=Trashify/OU=Development/CN=localhost"
        print_success "SSL certificates created"
    else
        print_success "SSL certificates already exist"
    fi
}

# Main setup function
main() {
    echo "=========================================="
    echo "  Trashify Development Environment Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_docker
    check_docker_compose
    check_node
    
    # Setup environment
    create_directories
    setup_environment
    
    # Install dependencies
    install_backend_deps
    install_mobile_deps
    install_admin_deps
    
    # Start services
    start_docker_services
    wait_for_database
    
    # Setup database
    run_migrations
    seed_database
    
    # Create SSL certificates
    create_ssl_certificates
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update .env files with your actual API keys and configuration"
    echo "2. Start the development servers:"
    echo "   - Backend: npm run dev"
    echo "   - Admin Dashboard: cd admin-dashboard && npm start"
    echo "   - Mobile App: cd mobile-app && npm start"
    echo ""
    echo "Default admin credentials:"
    echo "  Phone: 9999999999"
    echo "  Password: admin123"
    echo ""
    echo "Test user credentials:"
    echo "  Customer - Phone: 9876543210, Password: customer123"
    echo "  Collector - Phone: 9876543211, Password: collector123"
    echo ""
    echo "Happy coding! 🎉"
}

# Run main function
main "$@"

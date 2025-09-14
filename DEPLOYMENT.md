# Trashify Deployment Guide

## Overview
This guide covers the deployment of the Trashify home pickup service application, including the backend API, mobile app, and admin dashboard.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │  Admin Dashboard│    │   Web Portal    │
│  (iOS/Android)  │    │   (React.js)    │    │   (Optional)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Nginx Proxy          │
                    │    (Load Balancer)        │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Backend API          │
                    │    (Node.js/Express)      │
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

## Prerequisites

### System Requirements
- **Server**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **CPU**: Minimum 2 cores, Recommended 4 cores
- **Network**: Stable internet connection with static IP

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL Certificate (Let's Encrypt recommended)

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Clone Repository

```bash
git clone https://github.com/your-username/trashify.git
cd trashify
```

### 3. Environment Configuration

Create environment files:

```bash
# Backend environment
cp env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://trashify_user:trashify_password@postgres:5432/trashify
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase
FCM_SERVER_KEY=your_fcm_server_key
FCM_PROJECT_ID=your_fcm_project_id

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=trashify-uploads
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot -y

# Generate SSL certificate
sudo certbot certonly --standalone -d api.trashify.com -d admin.trashify.com -d trashify.com

# Copy certificates to nginx directory
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/trashify.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/trashify.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

### 5. Database Initialization

```bash
# Run database migrations
docker-compose up -d postgres redis
sleep 30
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### 6. Deploy Application

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7. Mobile App Deployment

#### Android
```bash
cd mobile-app
npm install

# Generate signed APK
cd android
./gradlew assembleRelease

# Upload to Google Play Console
```

#### iOS
```bash
cd mobile-app
npm install

# Build for iOS
npx react-native run-ios --configuration Release

# Upload to App Store Connect
```

### 8. Domain Configuration

Update DNS records:
- `api.trashify.com` → Your server IP
- `admin.trashify.com` → Your server IP
- `trashify.com` → Your server IP

## Monitoring and Maintenance

### Health Checks

```bash
# Check API health
curl http://api.trashify.com/health

# Check admin dashboard
curl http://admin.trashify.com

# Check database
docker-compose exec postgres psql -U trashify_user -d trashify -c "SELECT 1;"
```

### Log Management

```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

### Backup Strategy

```bash
# Database backup
docker-compose exec postgres pg_dump -U trashify_user trashify > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U trashify_user trashify > /backups/trashify_$DATE.sql
find /backups -name "trashify_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Update nginx configuration for load balancing
# Add multiple backend servers in nginx.conf
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Enable HSTS headers
- Regular certificate renewal

### 3. Database Security
- Use strong passwords
- Enable SSL connections
- Regular security updates

### 4. Application Security
- Regular dependency updates
- Input validation
- Rate limiting
- CORS configuration

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if postgres is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **API Not Responding**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Restart backend
   docker-compose restart backend
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   sudo certbot renew
   
   # Restart nginx
   docker-compose restart nginx
   ```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Regular VACUUM and ANALYZE
   - Connection pooling

2. **Caching**
   - Redis for session storage
   - CDN for static assets
   - Application-level caching

3. **Monitoring**
   - Set up monitoring with Prometheus/Grafana
   - Log aggregation with ELK stack
   - Application performance monitoring

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations completed
- [ ] All services running
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance testing completed
- [ ] Documentation updated

## Support

For deployment issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation
- Contact development team
- Create GitHub issue

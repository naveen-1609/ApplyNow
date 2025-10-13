# ApplyNow Deployment Guide

This guide will help you deploy the ApplyNow application and scheduler as separate services.

## Architecture Overview

The ApplyNow application is now split into two main services:

1. **Main Application** (`app`): The Next.js web application
2. **Email Scheduler** (`scheduler`): The email notification service

## Prerequisites

Before deploying, ensure you have:

- Docker and Docker Compose installed
- Environment variables configured
- SendGrid API key for email functionality
- Firebase configuration

## Environment Setup

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your actual values:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # SendGrid Configuration
   SENDGRID_API_KEY=your_sendgrid_api_key_here

   # Redis Configuration
   REDIS_PASSWORD=your_redis_password_here

   # Application Configuration
   APP_URL=http://localhost:3000
   NODE_ENV=production
   ```

## Deployment Options

### Option 1: Deploy Both Services Together

Use the main docker-compose.yml file to deploy both services:

```bash
# Deploy everything
docker-compose up -d

# Scale the app service
docker-compose up -d --scale app=3

# Check status
docker-compose ps
```

### Option 2: Deploy Services Separately

#### Deploy App Only

```bash
# Using the dedicated script
./deploy-app.sh deploy

# Or using docker-compose directly
docker-compose -f docker-compose.app.yml up -d

# Scale the app
./deploy-app.sh scale 5
```

#### Deploy Scheduler Only

```bash
# Using the dedicated script
./deploy-scheduler.sh deploy

# Or using docker-compose directly
docker-compose -f docker-compose.scheduler.yml up -d
```

### Option 3: Use Deployment Scripts

The project includes dedicated deployment scripts:

#### App Deployment Script (`deploy-app.sh`)

```bash
# Interactive menu
./deploy-app.sh menu

# Direct commands
./deploy-app.sh deploy    # Deploy app
./deploy-app.sh scale 3   # Scale to 3 replicas
./deploy-app.sh health    # Health check
./deploy-app.sh logs      # Show logs
./deploy-app.sh status    # Show status
./deploy-app.sh stop      # Stop app
```

#### Scheduler Deployment Script (`deploy-scheduler.sh`)

```bash
# Interactive menu
./deploy-scheduler.sh menu

# Direct commands
./deploy-scheduler.sh deploy    # Deploy scheduler
./deploy-scheduler.sh health    # Health check
./deploy-scheduler.sh test      # Test functionality
./deploy-scheduler.sh logs      # Show logs
./deploy-scheduler.sh status    # Show status
./deploy-scheduler.sh restart   # Restart scheduler
./deploy-scheduler.sh stop      # Stop scheduler
```

## Service Configuration

### Main Application Service

- **Port**: 3000
- **Replicas**: 3 (configurable)
- **Resources**: 1 CPU, 1GB RAM per replica
- **Dependencies**: Redis, Nginx
- **Health Check**: Available at `/health`

### Scheduler Service

- **Port**: Internal only
- **Replicas**: 1 (single instance recommended)
- **Resources**: 0.5 CPU, 512MB RAM
- **Dependencies**: App service (for API calls)
- **Health Check**: Built-in process monitoring

## Monitoring and Logs

### View Logs

```bash
# App logs
docker-compose logs -f app

# Scheduler logs
docker-compose logs -f scheduler

# All services
docker-compose logs -f
```

### Health Checks

```bash
# Check app health
curl http://localhost/health

# Check scheduler status
docker-compose ps scheduler
```

### Resource Monitoring

```bash
# View resource usage
docker stats

# View service status
docker-compose ps
```

## Scaling

### Scale the Application

```bash
# Scale to 5 replicas
docker-compose up -d --scale app=5

# Or use the script
./deploy-app.sh scale 5
```

### Scale the Scheduler

The scheduler should typically run as a single instance to avoid duplicate emails:

```bash
# Restart scheduler (if needed)
./deploy-scheduler.sh restart
```

## Troubleshooting

### Common Issues

1. **Scheduler not sending emails**
   - Check SendGrid API key in `.env`
   - Verify scheduler logs: `docker-compose logs scheduler`
   - Ensure app is running and accessible

2. **App not starting**
   - Check Firebase configuration
   - Verify all environment variables
   - Check app logs: `docker-compose logs app`

3. **Redis connection issues**
   - Verify Redis password in `.env`
   - Check Redis logs: `docker-compose logs redis`

### Debug Commands

```bash
# Check all service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100

# Restart specific service
docker-compose restart app
docker-compose restart scheduler

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

## Production Considerations

### Security

- Use strong passwords for Redis
- Keep environment variables secure
- Use HTTPS in production
- Regularly update dependencies

### Performance

- Monitor resource usage
- Scale app replicas based on load
- Use Redis for caching
- Monitor email delivery rates

### Backup

```bash
# Backup Redis data
docker-compose exec redis redis-cli --rdb /data/dump.rdb

# Backup application data
docker-compose exec app tar -czf /tmp/app-backup.tar.gz /app/data
```

## Maintenance

### Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Cleanup

```bash
# Remove unused containers and images
docker system prune -f

# Remove volumes (WARNING: This will delete data)
docker-compose down -v
```

## Support

For issues or questions:

1. Check the logs first
2. Verify environment configuration
3. Test individual services
4. Check the troubleshooting section above

## Quick Start Commands

```bash
# 1. Setup environment
cp env.example .env
# Edit .env with your values

# 2. Deploy both services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f

# 5. Access application
# Open http://localhost in your browser
```

This deployment setup provides flexibility to deploy services independently while maintaining the ability to run them together when needed.

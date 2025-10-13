#!/bin/bash

# ApplyNow Deployment Script for Scaling
# This script handles deployment and scaling operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SCALE=${2:-1}
REGION=${3:-us-east-1}

echo -e "${BLUE}🚀 ApplyNow Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Scale: ${SCALE} replicas${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, creating template..."
        cp .env.example .env
        print_warning "Please update .env file with your configuration"
    fi
    
    print_status "Prerequisites check completed"
}

# Build and deploy
deploy() {
    print_status "Building and deploying application..."
    
    # Build the application
    docker-compose build --no-cache
    
    # Deploy with specified scale
    docker-compose up -d --scale app=${SCALE}
    
    print_status "Deployment completed"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Services are running"
        
        # Test application endpoint
        if curl -f http://localhost/health > /dev/null 2>&1; then
            print_status "Application is healthy"
        else
            print_warning "Application health check failed"
        fi
    else
        print_error "Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Scale application
scale() {
    print_status "Scaling application to ${SCALE} replicas..."
    
    docker-compose up -d --scale app=${SCALE}
    
    print_status "Scaling completed"
}

# Monitor performance
monitor() {
    print_status "Starting performance monitoring..."
    
    # Start monitoring services
    docker-compose up -d prometheus grafana
    
    echo -e "${BLUE}📊 Monitoring URLs:${NC}"
    echo -e "${BLUE}  - Grafana: http://localhost:3001${NC}"
    echo -e "${BLUE}  - Prometheus: http://localhost:9090${NC}"
    echo -e "${BLUE}  - Application: http://localhost${NC}"
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    docker-compose down -v
    docker system prune -f
    
    print_status "Cleanup completed"
}

# Backup data
backup() {
    print_status "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    
    # Backup Redis data
    docker-compose exec redis redis-cli --rdb /data/dump.rdb
    docker cp $(docker-compose ps -q redis):/data/dump.rdb ${BACKUP_DIR}/
    
    # Backup application data
    docker-compose exec app tar -czf /tmp/app-backup.tar.gz /app/data
    docker cp $(docker-compose ps -q app):/tmp/app-backup.tar.gz ${BACKUP_DIR}/
    
    print_status "Backup created in ${BACKUP_DIR}"
}

# Restore data
restore() {
    BACKUP_DIR=${1:-"backups/latest"}
    
    if [ ! -d "${BACKUP_DIR}" ]; then
        print_error "Backup directory not found: ${BACKUP_DIR}"
        exit 1
    fi
    
    print_status "Restoring from ${BACKUP_DIR}..."
    
    # Restore Redis data
    docker cp ${BACKUP_DIR}/dump.rdb $(docker-compose ps -q redis):/data/
    docker-compose exec redis redis-cli --rdb /data/dump.rdb
    
    # Restore application data
    docker cp ${BACKUP_DIR}/app-backup.tar.gz $(docker-compose ps -q app):/tmp/
    docker-compose exec app tar -xzf /tmp/app-backup.tar.gz -C /
    
    print_status "Restore completed"
}

# Performance test
performance_test() {
    print_status "Running performance tests..."
    
    # Install k6 if not present
    if ! command -v k6 &> /dev/null; then
        print_warning "k6 not found, installing..."
        curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
        sudo mv k6 /usr/local/bin/
    fi
    
    # Run performance tests
    k6 run --vus 10 --duration 30s performance-test.js
    
    print_status "Performance tests completed"
}

# Show logs
logs() {
    SERVICE=${1:-app}
    
    print_status "Showing logs for ${SERVICE}..."
    docker-compose logs -f ${SERVICE}
}

# Show status
status() {
    print_status "Application Status:"
    docker-compose ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream
    
    echo ""
    print_status "Performance Metrics:"
    curl -s http://localhost/metrics | grep -E "(http_requests_total|response_time)"
}

# Main menu
show_menu() {
    echo -e "${BLUE}ApplyNow Deployment Menu${NC}"
    echo "1. Deploy Application"
    echo "2. Scale Application"
    echo "3. Health Check"
    echo "4. Monitor Performance"
    echo "5. Backup Data"
    echo "6. Restore Data"
    echo "7. Performance Test"
    echo "8. Show Logs"
    echo "9. Show Status"
    echo "10. Cleanup"
    echo "0. Exit"
    echo ""
    read -p "Select an option: " choice
    
    case $choice in
        1) check_prerequisites && deploy && health_check ;;
        2) read -p "Enter number of replicas: " SCALE && scale ;;
        3) health_check ;;
        4) monitor ;;
        5) backup ;;
        6) read -p "Enter backup directory: " BACKUP_DIR && restore $BACKUP_DIR ;;
        7) performance_test ;;
        8) read -p "Enter service name (default: app): " SERVICE && logs $SERVICE ;;
        9) status ;;
        10) cleanup ;;
        0) exit 0 ;;
        *) print_error "Invalid option" && show_menu ;;
    esac
}

# Handle command line arguments
case "${1:-menu}" in
    deploy) check_prerequisites && deploy && health_check ;;
    scale) scale ;;
    health) health_check ;;
    monitor) monitor ;;
    backup) backup ;;
    restore) restore $2 ;;
    test) performance_test ;;
    logs) logs $2 ;;
    status) status ;;
    cleanup) cleanup ;;
    menu) show_menu ;;
    *) 
        print_error "Unknown command: $1"
        echo "Usage: $0 [deploy|scale|health|monitor|backup|restore|test|logs|status|cleanup|menu]"
        exit 1
        ;;
esac

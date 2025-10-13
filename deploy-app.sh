#!/bin/bash

# ApplyNow App Deployment Script
# This script deploys only the main application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SCALE=${2:-3}
REGION=${3:-us-east-1}

echo -e "${BLUE}🚀 ApplyNow App Deployment Script${NC}"
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
        cp .env.example .env 2>/dev/null || echo "Please create .env file with your configuration"
        print_warning "Please update .env file with your configuration"
    fi
    
    print_status "Prerequisites check completed"
}

# Build and deploy app only
deploy_app() {
    print_status "Building and deploying application..."
    
    # Build only the app service
    docker-compose build --no-cache app
    
    # Deploy app with specified scale
    docker-compose up -d --scale app=${SCALE} app redis nginx
    
    print_status "App deployment completed"
}

# Health check for app
health_check() {
    print_status "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check if app is running
    if docker-compose ps app | grep -q "Up"; then
        print_status "App service is running"
        
        # Test application endpoint
        if curl -f http://localhost/health > /dev/null 2>&1; then
            print_status "Application is healthy"
        else
            print_warning "Application health check failed"
        fi
    else
        print_error "App service failed to start"
        docker-compose logs app
        exit 1
    fi
}

# Scale app
scale_app() {
    print_status "Scaling app to ${SCALE} replicas..."
    
    docker-compose up -d --scale app=${SCALE} app
    
    print_status "App scaling completed"
}

# Show app logs
show_logs() {
    print_status "Showing app logs..."
    docker-compose logs -f app
}

# Show app status
show_status() {
    print_status "App Status:"
    docker-compose ps app redis nginx
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream $(docker-compose ps -q app redis nginx)
}

# Main menu
show_menu() {
    echo -e "${BLUE}ApplyNow App Deployment Menu${NC}"
    echo "1. Deploy App Only"
    echo "2. Scale App"
    echo "3. Health Check"
    echo "4. Show Logs"
    echo "5. Show Status"
    echo "6. Stop App"
    echo "0. Exit"
    echo ""
    read -p "Select an option: " choice
    
    case $choice in
        1) check_prerequisites && deploy_app && health_check ;;
        2) read -p "Enter number of replicas: " SCALE && scale_app ;;
        3) health_check ;;
        4) show_logs ;;
        5) show_status ;;
        6) docker-compose stop app ;;
        0) exit 0 ;;
        *) print_error "Invalid option" && show_menu ;;
    esac
}

# Handle command line arguments
case "${1:-menu}" in
    deploy) check_prerequisites && deploy_app && health_check ;;
    scale) scale_app ;;
    health) health_check ;;
    logs) show_logs ;;
    status) show_status ;;
    stop) docker-compose stop app ;;
    menu) show_menu ;;
    *) 
        print_error "Unknown command: $1"
        echo "Usage: $0 [deploy|scale|health|logs|status|stop|menu]"
        exit 1
        ;;
esac

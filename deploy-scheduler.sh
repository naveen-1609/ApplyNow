#!/bin/bash

# ApplyNow Scheduler Deployment Script
# This script deploys only the email scheduler service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}

echo -e "${BLUE}📧 ApplyNow Scheduler Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
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
    
    if [ ! -f "scheduler/api-scheduler.js" ]; then
        print_error "Scheduler file not found at scheduler/api-scheduler.js"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Build and deploy scheduler only
deploy_scheduler() {
    print_status "Building and deploying scheduler service..."
    
    # Build only the scheduler service
    docker-compose build --no-cache scheduler
    
    # Deploy scheduler
    docker-compose up -d scheduler
    
    print_status "Scheduler deployment completed"
}

# Health check for scheduler
health_check() {
    print_status "Performing scheduler health check..."
    
    # Wait for scheduler to start
    sleep 10
    
    # Check if scheduler is running
    if docker-compose ps scheduler | grep -q "Up"; then
        print_status "Scheduler service is running"
        
        # Check scheduler logs for any errors
        if docker-compose logs scheduler | grep -q "Starting API Email Scheduler"; then
            print_status "Scheduler started successfully"
        else
            print_warning "Scheduler may not have started properly"
        fi
    else
        print_error "Scheduler service failed to start"
        docker-compose logs scheduler
        exit 1
    fi
}

# Test scheduler functionality
test_scheduler() {
    print_status "Testing scheduler functionality..."
    
    # Check if scheduler is running
    if ! docker-compose ps scheduler | grep -q "Up"; then
        print_error "Scheduler is not running"
        exit 1
    fi
    
    # Check recent logs for activity
    print_status "Recent scheduler activity:"
    docker-compose logs --tail=20 scheduler
    
    print_status "Scheduler test completed"
}

# Show scheduler logs
show_logs() {
    print_status "Showing scheduler logs..."
    docker-compose logs -f scheduler
}

# Show scheduler status
show_status() {
    print_status "Scheduler Status:"
    docker-compose ps scheduler
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream $(docker-compose ps -q scheduler)
    
    echo ""
    print_status "Recent Logs:"
    docker-compose logs --tail=10 scheduler
}

# Restart scheduler
restart_scheduler() {
    print_status "Restarting scheduler service..."
    docker-compose restart scheduler
    print_status "Scheduler restarted"
}

# Main menu
show_menu() {
    echo -e "${BLUE}ApplyNow Scheduler Deployment Menu${NC}"
    echo "1. Deploy Scheduler Only"
    echo "2. Health Check"
    echo "3. Test Scheduler"
    echo "4. Show Logs"
    echo "5. Show Status"
    echo "6. Restart Scheduler"
    echo "7. Stop Scheduler"
    echo "0. Exit"
    echo ""
    read -p "Select an option: " choice
    
    case $choice in
        1) check_prerequisites && deploy_scheduler && health_check ;;
        2) health_check ;;
        3) test_scheduler ;;
        4) show_logs ;;
        5) show_status ;;
        6) restart_scheduler ;;
        7) docker-compose stop scheduler ;;
        0) exit 0 ;;
        *) print_error "Invalid option" && show_menu ;;
    esac
}

# Handle command line arguments
case "${1:-menu}" in
    deploy) check_prerequisites && deploy_scheduler && health_check ;;
    health) health_check ;;
    test) test_scheduler ;;
    logs) show_logs ;;
    status) show_status ;;
    restart) restart_scheduler ;;
    stop) docker-compose stop scheduler ;;
    menu) show_menu ;;
    *) 
        print_error "Unknown command: $1"
        echo "Usage: $0 [deploy|health|test|logs|status|restart|stop|menu]"
        exit 1
        ;;
esac

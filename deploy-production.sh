#!/bin/bash

# Production Deployment Script for applicationconsole.tech
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Production Deployment for applicationconsole.tech${NC}"
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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    apt update
    apt install -y curl wget git nginx certbot python3-certbot-nginx
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    # Install Docker Compose if not present
    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        apt install -y docker-compose
    fi
    
    print_status "Dependencies installed"
}

# Setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Stop nginx if running
    systemctl stop nginx 2>/dev/null || true
    
    # Get SSL certificate
    certbot certonly --standalone -d applicationconsole.tech -d www.applicationconsole.tech --non-interactive --agree-tos --email admin@applicationconsole.tech
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    print_status "SSL certificate setup complete"
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    # Copy production environment
    if [ ! -f ".env" ]; then
        cp env.production .env
        print_warning "Please update .env file with your actual credentials"
        print_warning "Edit .env file and run this script again"
        exit 1
    fi
    
    # Build and start services
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Application deployed"
}

# Setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    print_status "Firewall configured"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        print_status "Services are running"
        
        # Test HTTPS endpoint
        if curl -f https://applicationconsole.tech/health > /dev/null 2>&1; then
            print_status "Application is healthy and accessible"
        else
            print_warning "Application health check failed"
        fi
    else
        print_error "Some services failed to start"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
}

# Show status
show_status() {
    print_status "Production Status:"
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream
    
    echo ""
    print_status "Application URLs:"
    echo "  - https://applicationconsole.tech"
    echo "  - https://www.applicationconsole.tech"
}

# Main deployment
main() {
    check_root
    install_dependencies
    setup_firewall
    setup_ssl
    deploy_app
    health_check
    
    echo ""
    print_status "🎉 Deployment Complete!"
    echo ""
    print_status "Your application is now live at:"
    echo "  - https://applicationconsole.tech"
    echo "  - https://www.applicationconsole.tech"
    echo ""
    print_status "Next steps:"
    echo "  1. Update your .env file with actual credentials"
    echo "  2. Test your application"
    echo "  3. Monitor logs: docker-compose -f docker-compose.production.yml logs -f"
    echo ""
}

# Handle command line arguments
case "${1:-deploy}" in
    deploy) main ;;
    status) show_status ;;
    logs) docker-compose -f docker-compose.production.yml logs -f ;;
    restart) docker-compose -f docker-compose.production.yml restart ;;
    stop) docker-compose -f docker-compose.production.yml down ;;
    *) 
        print_error "Unknown command: $1"
        echo "Usage: $0 [deploy|status|logs|restart|stop]"
        exit 1
        ;;
esac

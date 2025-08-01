
#!/bin/bash

# SolarFactsNW Production Deployment Script
# Automated deployment with health checks and rollback capability

set -e

# Configuration
APP_NAME="SolarFactsNW"
VERSION="3.0.0"
DEPLOY_DIR="/opt/solarfactsnw"
BACKUP_DIR="/opt/solarfactsnw-backups"
LOG_FILE="/var/log/solarfactsnw-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    success "Directories created"
}

# Backup current deployment
backup_current() {
    if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
        log "Backing up current deployment..."
        
        BACKUP_NAME="solarfactsnw-backup-$(date +%Y%m%d-%H%M%S)"
        BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
        
        cp -r "$DEPLOY_DIR" "$BACKUP_PATH"
        
        success "Backup created: $BACKUP_PATH"
        echo "$BACKUP_PATH" > /tmp/solarfactsnw-last-backup
    else
        log "No existing deployment to backup"
    fi
}

# Deploy application
deploy_application() {
    log "Deploying $APP_NAME v$VERSION..."
    
    # Copy application files
    cp -r . "$DEPLOY_DIR/"
    
    # Set permissions
    chown -R solarfacts:solarfacts "$DEPLOY_DIR"
    chmod +x "$DEPLOY_DIR/scripts/"*.sh
    chmod +x "$DEPLOY_DIR/scripts/"*.js
    
    success "Application deployed to $DEPLOY_DIR"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$DEPLOY_DIR"
    
    # Install Node.js dependencies
    npm ci --production
    
    # Install system dependencies
    apt-get update
    apt-get install -y curl nginx mysql-client redis-tools
    
    success "Dependencies installed"
}

# Configure services
configure_services() {
    log "Configuring system services..."
    
    # Copy systemd service file
    cp "$DEPLOY_DIR/dist/solarfactsnw.service" /etc/systemd/system/
    
    # Copy nginx configuration
    cp "$DEPLOY_DIR/nginx/nginx.conf" /etc/nginx/sites-available/solarfactsnw
    ln -sf /etc/nginx/sites-available/solarfactsnw /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Reload systemd
    systemctl daemon-reload
    
    success "Services configured"
}

# Run health checks
health_check() {
    log "Running health checks..."
    
    cd "$DEPLOY_DIR"
    
    # Run startup health check
    if node scripts/startup-health-check.js; then
        success "Health checks passed"
        return 0
    else
        error "Health checks failed"
        return 1
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start and enable SolarFactsNW service
    systemctl enable solarfactsnw
    systemctl start solarfactsnw
    
    # Start nginx
    systemctl enable nginx
    systemctl restart nginx
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    if systemctl is-active --quiet solarfactsnw; then
        success "SolarFactsNW service started"
    else
        error "Failed to start SolarFactsNW service"
        return 1
    fi
    
    if systemctl is-active --quiet nginx; then
        success "Nginx service started"
    else
        error "Failed to start Nginx service"
        return 1
    fi
}

# Rollback deployment
rollback() {
    error "Deployment failed, initiating rollback..."
    
    if [ -f /tmp/solarfactsnw-last-backup ]; then
        BACKUP_PATH=$(cat /tmp/solarfactsnw-last-backup)
        
        if [ -d "$BACKUP_PATH" ]; then
            log "Rolling back to: $BACKUP_PATH"
            
            # Stop services
            systemctl stop solarfactsnw || true
            
            # Restore backup
            rm -rf "$DEPLOY_DIR"
            cp -r "$BACKUP_PATH" "$DEPLOY_DIR"
            
            # Restart services
            systemctl start solarfactsnw || true
            
            success "Rollback completed"
        else
            error "Backup not found: $BACKUP_PATH"
        fi
    else
        error "No backup available for rollback"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    success "Backup cleanup completed"
}

# Main deployment function
main() {
    log "Starting $APP_NAME v$VERSION deployment..."
    
    # Pre-deployment checks
    check_root
    setup_directories
    
    # Deployment process
    backup_current
    
    if deploy_application && install_dependencies && configure_services; then
        if health_check; then
            if start_services; then
                cleanup_backups
                success "🎉 Deployment completed successfully!"
                
                log "Access your application at:"
                log "  - Main interface: https://your-domain.com"
                log "  - Health dashboard: https://your-domain.com/health/dashboard"
                log "  - System dashboard: https://your-domain.com/dashboard"
                
                exit 0
            else
                rollback
                exit 1
            fi
        else
            rollback
            exit 1
        fi
    else
        rollback
        exit 1
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted"; rollback; exit 1' INT TERM

# Run main function
main "$@"

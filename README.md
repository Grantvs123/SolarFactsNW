# SolarFactsNW Production Powerhouse v3.0

## 🚀 Complete Production-Ready Solar Energy Management System

SolarFactsNW Production Powerhouse v3.0 is a comprehensive, enterprise-grade solar energy management platform built with Node-RED, featuring modular architecture, advanced security, health monitoring, and auto-healing capabilities.

## ✨ Key Features

### 🏗️ **Modular Architecture**
- **Core System** (`/core`): Auto-healing, environment resolution, patch management
- **Shared Components** (`/shared`): Dashboards, middleware, static assets
- **Vertical Solutions** (`/verticals`): Solar-specific implementations
- Clean separation of concerns for maximum maintainability

### 🔒 **Security Hardening**
- Environment-based configuration management
- Secure credential handling with migration scripts
- Docker containerization with security best practices
- Nginx reverse proxy with SSL/TLS support
- Comprehensive `.env` configuration system

### 🏥 **Health Monitoring & Auto-Healing**
- Real-time system health monitoring
- Automated failure detection and recovery
- Health dashboard with visual indicators
- Startup health checks and validation
- Comprehensive logging and alerting

### 📊 **Production Features**
- Multi-environment support (development, staging, production)
- Automated deployment scripts
- Docker Compose orchestration
- Service management for Linux and Windows
- Comprehensive backup and recovery systems

## 🏗️ System Architecture

```
SolarFactsNW/
├── core/                          # Core system components
│   ├── auto-heal.js              # Auto-healing system
│   ├── environment-resolver.js    # Environment management
│   ├── patch-manager.js          # System patching
│   ├── health/                   # Health monitoring
│   │   ├── health-checker.js     # Health check engine
│   │   ├── health-dashboard.js   # Health visualization
│   │   ├── health-flow.json      # Health monitoring flows
│   │   └── startup-monitor.js    # Startup monitoring
│   └── utils/                    # Core utilities
├── shared/                       # Shared components
│   ├── dashboards/              # Reusable dashboards
│   ├── middleware/              # Express middleware
│   └── static/                  # Static assets
├── verticals/                   # Vertical solutions
│   └── solar/                   # Solar energy specific
├── scripts/                     # Deployment & management
│   ├── deploy.sh               # Production deployment
│   ├── generate-secrets.js     # Security setup
│   ├── install-health-system.js # Health system setup
│   ├── migrate-credentials.js   # Credential migration
│   └── startup-health-check.js  # Startup validation
├── nginx/                       # Reverse proxy config
├── dist/                        # Distribution packages
└── docs/                        # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Linux/Windows/macOS support

### 1. Clone and Setup
```bash
git clone https://github.com/Grantvs123/SolarFactsNW.git
cd SolarFactsNW
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Generate secure secrets
node scripts/generate-secrets.js

# Configure your environment variables in .env.local
```

### 3. Install Health Monitoring
```bash
node scripts/install-health-system.js
```

### 4. Start the System
```bash
# Development mode
npm start

# Production mode with health checks
./start-with-health-check.sh

# Docker deployment
docker-compose up -d
```

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Deployment
```bash
# Deploy with production configuration
./scripts/deploy.sh production

# Monitor deployment
docker-compose ps
docker-compose logs -f solarfactsnw
```

## 🏥 Health Monitoring

### Health Dashboard
Access the health monitoring dashboard at:
- **Local**: http://localhost:1880/health
- **Production**: https://your-domain.com/health

### Health Check Endpoints
- `/health/status` - System status overview
- `/health/detailed` - Detailed health metrics
- `/health/auto-heal` - Auto-healing status

### Monitoring Features
- **Real-time Metrics**: CPU, memory, disk usage
- **Service Health**: Node-RED, database, external APIs
- **Auto-healing**: Automatic recovery from failures
- **Alerting**: Email and webhook notifications
- **Historical Data**: Performance trends and analytics

## 🔧 Configuration

### Environment Variables
Key configuration options in `.env.local`:

```bash
# System Configuration
NODE_ENV=production
PORT=1880
HEALTH_CHECK_INTERVAL=30000

# Security
SESSION_SECRET=your-secure-session-secret
ADMIN_PASSWORD=your-admin-password

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=solarfactsnw
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Monitoring
HEALTH_DASHBOARD_ENABLED=true
AUTO_HEAL_ENABLED=true
LOG_LEVEL=info
```

### Advanced Configuration
See `settings.js` for detailed Node-RED configuration options including:
- Security settings
- Database connections
- API endpoints
- Dashboard customization
- Performance tuning

## 📚 Documentation

### Available Guides
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Windows Installation](WINDOWS_INSTALLATION_GUIDE.md)** - Windows-specific setup
- **[Transferability Report](TRANSFERABILITY_REPORT.md)** - System portability guide
- **[Phase 4D Completion](PHASE4D_COMPLETION_REPORT.md)** - Development milestone report

### API Documentation
- REST API endpoints for system integration
- WebSocket connections for real-time data
- Health monitoring API reference
- Authentication and authorization guide

## 🛠️ Development

### Development Setup
```bash
# Install development dependencies
npm install --include=dev

# Start in development mode
npm run dev

# Run health checks
npm run health-check

# Run tests
npm test
```

### Project Structure
- **Modular Design**: Clean separation between core, shared, and vertical components
- **Environment Management**: Automatic environment detection and configuration
- **Health Integration**: Built-in monitoring and auto-healing
- **Security First**: Comprehensive security measures throughout

## 🔄 Auto-Healing System

The auto-healing system provides:
- **Automatic Recovery**: Detects and recovers from common failures
- **Service Restart**: Restarts failed services automatically
- **Resource Management**: Monitors and manages system resources
- **Failure Analysis**: Logs and analyzes failure patterns
- **Preventive Actions**: Takes preventive measures based on trends

## 🌐 Production Deployment

### Linux Service Installation
```bash
# Install as system service
sudo ./scripts/deploy.sh install-service

# Start service
sudo systemctl start solarfactsnw
sudo systemctl enable solarfactsnw
```

### Windows Service Installation
```powershell
# Run as administrator
.\scripts\create-service.ps1
```

### Nginx Configuration
The included Nginx configuration provides:
- SSL/TLS termination
- Load balancing
- Static file serving
- Security headers
- Rate limiting

## 📊 Monitoring & Analytics

### Built-in Dashboards
- **System Overview**: Real-time system status
- **Solar Analytics**: Energy production and consumption
- **Performance Metrics**: System performance indicators
- **Health Status**: Comprehensive health monitoring
- **Historical Data**: Trends and analytics

### Integration Options
- **Grafana**: Advanced visualization and alerting
- **Prometheus**: Metrics collection and monitoring
- **ELK Stack**: Centralized logging and analysis
- **Custom APIs**: Integration with external systems

## 🔐 Security Features

### Authentication & Authorization
- Multi-factor authentication support
- Role-based access control
- Session management
- API key authentication

### Data Protection
- Encrypted data storage
- Secure communication (HTTPS/WSS)
- Input validation and sanitization
- SQL injection prevention

### Infrastructure Security
- Container security best practices
- Network segmentation
- Firewall configuration
- Regular security updates

## 🚀 Performance Optimization

### System Performance
- **Caching**: Redis-based caching for improved response times
- **Database Optimization**: Indexed queries and connection pooling
- **Resource Management**: Efficient memory and CPU usage
- **Load Balancing**: Horizontal scaling support

### Monitoring Performance
- Real-time performance metrics
- Resource usage tracking
- Response time monitoring
- Throughput analysis

## 🆘 Troubleshooting

### Common Issues
1. **Port Conflicts**: Check if port 1880 is available
2. **Database Connection**: Verify database credentials and connectivity
3. **Permission Issues**: Ensure proper file permissions
4. **Memory Issues**: Monitor system resources

### Health Check Commands
```bash
# Check system status
curl http://localhost:1880/health/status

# Detailed health report
curl http://localhost:1880/health/detailed

# Auto-healing status
curl http://localhost:1880/health/auto-heal
```

### Log Analysis
```bash
# View system logs
tail -f logs/solarfactsnw.log

# View health logs
tail -f logs/health.log

# View error logs
tail -f logs/error.log
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and health checks
5. Submit a pull request

### Code Standards
- Follow Node.js best practices
- Include comprehensive tests
- Update documentation
- Maintain security standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Comprehensive guides and API reference
- **Health Dashboard**: Built-in system monitoring and diagnostics
- **Logs**: Detailed logging for troubleshooting
- **Community**: GitHub issues and discussions

### Professional Support
For enterprise support, custom development, or consulting services, please contact the development team.

## 🎯 Roadmap

### Upcoming Features
- **Advanced Analytics**: Machine learning-powered insights
- **Mobile App**: Native mobile applications
- **Cloud Integration**: AWS/Azure/GCP deployment options
- **API Gateway**: Enhanced API management
- **Multi-tenant Support**: SaaS deployment capabilities

---

**SolarFactsNW Production Powerhouse v3.0** - Powering the future of solar energy management with enterprise-grade reliability, security, and performance.

Built with ❤️ for the renewable energy community.

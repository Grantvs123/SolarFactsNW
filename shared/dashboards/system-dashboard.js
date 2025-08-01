
/**
 * SolarFactsNW System Dashboard
 * Comprehensive system monitoring and management interface
 */

const express = require('express');
const path = require('path');

class SystemDashboard {
    constructor(options = {}) {
        this.options = {
            endpoint: options.endpoint || '/dashboard',
            title: options.title || 'SolarFactsNW System Dashboard',
            ...options
        };
        
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Main dashboard
        this.router.get(this.options.endpoint, (req, res) => {
            const html = this.generateDashboardHTML();
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });

        // System info API
        this.router.get(`${this.options.endpoint}/api/system`, (req, res) => {
            res.json(this.getSystemInfo());
        });

        // Module status API
        this.router.get(`${this.options.endpoint}/api/modules`, (req, res) => {
            res.json(this.getModuleStatus());
        });
    }

    getSystemInfo() {
        return {
            name: 'SolarFactsNW Production Powerhouse',
            version: '3.0.0',
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        };
    }

    getModuleStatus() {
        return {
            core: {
                name: 'Core System',
                status: 'active',
                version: '3.0.0',
                components: ['HealthChecker', 'StartupMonitor', 'ConfigManager', 'Logger']
            },
            shared: {
                name: 'Shared Utilities',
                status: 'active', 
                version: '3.0.0',
                components: ['AuthMiddleware', 'RateLimitMiddleware', 'SystemDashboard']
            },
            solar: {
                name: 'Solar Vertical',
                status: 'active',
                version: '3.0.0',
                components: ['LeadProcessor', 'SolarCalculator', 'QuoteGenerator']
            }
        };
    }

    generateDashboardHTML() {
        const systemInfo = this.getSystemInfo();
        const moduleStatus = this.getModuleStatus();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
        }
        .metric-card {
            border-left: 4px solid #007bff;
            transition: transform 0.2s;
        }
        .metric-card:hover {
            transform: translateY(-2px);
        }
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
        }
        .status-active { background-color: #28a745; color: white; }
        .status-inactive { background-color: #dc3545; color: white; }
        .status-warning { background-color: #ffc107; color: black; }
    </style>
</head>
<body class="bg-light">
    <div class="dashboard-header">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="mb-0"><i class="fas fa-solar-panel me-2"></i>${this.options.title}</h1>
                    <p class="mb-0 opacity-75">Production-Ready AI PatchBay SaaS Platform</p>
                </div>
                <div class="col-md-4 text-end">
                    <span class="badge bg-success fs-6">v${systemInfo.version}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="container mt-4">
        <!-- System Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title text-muted">Uptime</h6>
                                <h4 class="mb-0">${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m</h4>
                            </div>
                            <div class="text-primary">
                                <i class="fas fa-clock fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title text-muted">Memory Usage</h6>
                                <h4 class="mb-0">${Math.round(systemInfo.memory.heapUsed / 1024 / 1024)}MB</h4>
                            </div>
                            <div class="text-success">
                                <i class="fas fa-memory fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title text-muted">Platform</h6>
                                <h4 class="mb-0">${systemInfo.platform}</h4>
                            </div>
                            <div class="text-info">
                                <i class="fas fa-server fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title text-muted">Environment</h6>
                                <h4 class="mb-0">${systemInfo.env}</h4>
                            </div>
                            <div class="text-warning">
                                <i class="fas fa-cog fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Module Status -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-puzzle-piece me-2"></i>Module Status</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${Object.entries(moduleStatus).map(([key, module]) => `
                            <div class="col-md-4 mb-3">
                                <div class="card border-0 bg-light">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">${module.name}</h6>
                                            <span class="status-badge status-${module.status}">${module.status}</span>
                                        </div>
                                        <small class="text-muted">v${module.version}</small>
                                        <div class="mt-2">
                                            <small class="text-muted">Components: ${module.components.length}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-2">
                                <a href="/health/dashboard" class="btn btn-outline-primary w-100">
                                    <i class="fas fa-heartbeat me-2"></i>Health Dashboard
                                </a>
                            </div>
                            <div class="col-md-3 mb-2">
                                <a href="/" class="btn btn-outline-success w-100">
                                    <i class="fas fa-project-diagram me-2"></i>Node-RED Editor
                                </a>
                            </div>
                            <div class="col-md-3 mb-2">
                                <button class="btn btn-outline-warning w-100" onclick="refreshData()">
                                    <i class="fas fa-sync me-2"></i>Refresh Data
                                </button>
                            </div>
                            <div class="col-md-3 mb-2">
                                <a href="/admin" class="btn btn-outline-danger w-100">
                                    <i class="fas fa-cogs me-2"></i>Admin Panel
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function refreshData() {
            location.reload();
        }

        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        `;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SystemDashboard;

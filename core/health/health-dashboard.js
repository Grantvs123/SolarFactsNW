
/**
 * SolarFactsNW Health Dashboard
 * Express middleware for health status monitoring and reporting
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

class HealthDashboard {
    constructor(healthChecker, config = {}) {
        this.healthChecker = healthChecker;
        this.config = {
            endpoint: config.endpoint || '/health',
            dashboardEndpoint: config.dashboardEndpoint || '/health/dashboard',
            enableUI: config.enableUI !== false,
            ...config
        };
        
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check API endpoint
        this.router.get(this.config.endpoint, async (req, res) => {
            try {
                const healthStatus = await this.healthChecker.performFullHealthCheck();
                
                const httpStatus = this.getHttpStatusFromHealth(healthStatus.overall);
                res.status(httpStatus).json({
                    status: healthStatus.overall,
                    timestamp: healthStatus.lastCheck,
                    uptime: healthStatus.uptime,
                    services: healthStatus.services,
                    summary: {
                        healthy: healthStatus.healthyServices,
                        total: healthStatus.totalServices,
                        checkDuration: healthStatus.checkDuration
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Health dashboard UI
        if (this.config.enableUI) {
            this.router.get(this.config.dashboardEndpoint, async (req, res) => {
                try {
                    const healthStatus = await this.healthChecker.performFullHealthCheck();
                    const html = this.generateDashboardHTML(healthStatus);
                    res.setHeader('Content-Type', 'text/html');
                    res.send(html);
                } catch (error) {
                    res.status(500).send(`<h1>Health Dashboard Error</h1><p>${error.message}</p>`);
                }
            });
        }

        // Service-specific health checks
        this.router.get(`${this.config.endpoint}/openai`, async (req, res) => {
            const result = await this.healthChecker.checkOpenAI();
            res.json({ service: 'OpenAI API', healthy: result });
        });

        this.router.get(`${this.config.endpoint}/telnyx`, async (req, res) => {
            const result = await this.healthChecker.checkTelnyx();
            res.json({ service: 'Telnyx API', healthy: result });
        });

        this.router.get(`${this.config.endpoint}/retell`, async (req, res) => {
            const result = await this.healthChecker.checkRetell();
            res.json({ service: 'Retell API', healthy: result });
        });

        this.router.get(`${this.config.endpoint}/mysql`, async (req, res) => {
            const result = await this.healthChecker.checkMySQL();
            res.json({ service: 'MySQL Database', healthy: result });
        });

        // Auto-healing endpoint
        this.router.post(`${this.config.endpoint}/heal`, async (req, res) => {
            try {
                const result = await this.healthChecker.autoHeal();
                res.json({
                    success: result,
                    message: result ? 'Auto-healing completed successfully' : 'Auto-healing failed',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    getHttpStatusFromHealth(healthStatus) {
        switch (healthStatus) {
            case 'healthy': return 200;
            case 'degraded': return 207; // Multi-Status
            case 'unhealthy': return 503; // Service Unavailable
            default: return 500;
        }
    }

    generateDashboardHTML(healthStatus) {
        const statusColor = {
            'healthy': '#28a745',
            'degraded': '#ffc107', 
            'unhealthy': '#dc3545',
            'unknown': '#6c757d'
        };

        const serviceRows = Object.entries(healthStatus.services).map(([name, service]) => {
            const statusIcon = service.status === 'healthy' ? '✅' : '❌';
            const statusClass = service.status === 'healthy' ? 'text-success' : 'text-danger';
            
            return `
                <tr>
                    <td>${statusIcon} ${name}</td>
                    <td><span class="${statusClass}">${service.status}</span></td>
                    <td>${service.lastCheck ? new Date(service.lastCheck).toLocaleString() : 'N/A'}</td>
                    <td>${service.details || 'N/A'}</td>
                    <td>${service.error || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SolarFactsNW Health Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: bold;
        }
        .refresh-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
        }
    </style>
</head>
<body class="bg-light">
    <div class="container mt-4">
        <div class="row">
            <div class="col-12">
                <h1 class="mb-4">🏥 SolarFactsNW Health Dashboard</h1>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Overall System Status</h5>
                        <div class="d-flex align-items-center">
                            <span class="status-badge me-3" style="background-color: ${statusColor[healthStatus.overall]}">
                                ${healthStatus.overall.toUpperCase()}
                            </span>
                            <div>
                                <small class="text-muted">
                                    ${healthStatus.healthyServices}/${healthStatus.totalServices} services healthy
                                    • Last check: ${new Date(healthStatus.lastCheck).toLocaleString()}
                                    • Check duration: ${healthStatus.checkDuration}ms
                                    • Uptime: ${Math.floor(healthStatus.uptime / 3600)}h ${Math.floor((healthStatus.uptime % 3600) / 60)}m
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Service Details</h5>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Status</th>
                                        <th>Last Check</th>
                                        <th>Details</th>
                                        <th>Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${serviceRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <button class="btn btn-primary me-2" onclick="location.reload()">🔄 Refresh</button>
                    <button class="btn btn-warning" onclick="triggerHealing()">🔧 Trigger Auto-Healing</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function triggerHealing() {
            try {
                const response = await fetch('${this.config.endpoint}/heal', { method: 'POST' });
                const result = await response.json();
                alert(result.message);
                location.reload();
            } catch (error) {
                alert('Failed to trigger auto-healing: ' + error.message);
            }
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

module.exports = HealthDashboard;

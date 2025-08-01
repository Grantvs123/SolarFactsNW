
/**
 * SolarFactsNW Startup Health Monitor
 * Monitors system health during startup and ensures all dependencies are ready
 */

const HealthChecker = require('./health-checker');
const path = require('path');

class StartupMonitor {
    constructor(config = {}) {
        this.config = {
            maxStartupTime: config.maxStartupTime || 120000, // 2 minutes
            healthCheckInterval: config.healthCheckInterval || 5000, // 5 seconds
            requiredServices: config.requiredServices || [
                'OpenAI API',
                'Telnyx API', 
                'Retell API',
                'MySQL Database',
                'Dynamic IP Resolution'
            ],
            ...config
        };
        
        this.healthChecker = new HealthChecker(config);
        this.startupComplete = false;
        this.startupStartTime = Date.now();
    }

    async waitForHealthyServices() {
        console.log('🚀 Starting SolarFactsNW startup health monitoring...');
        console.log(`⏱️  Maximum startup time: ${this.config.maxStartupTime / 1000}s`);
        console.log(`🔄 Health check interval: ${this.config.healthCheckInterval / 1000}s`);
        
        const startTime = Date.now();
        let attempts = 0;
        
        while (Date.now() - startTime < this.config.maxStartupTime) {
            attempts++;
            console.log(`\n🔍 Startup health check attempt #${attempts}`);
            
            const healthStatus = await this.healthChecker.performFullHealthCheck();
            
            // Check if all required services are healthy
            const requiredServicesStatus = this.config.requiredServices.map(serviceName => {
                const service = healthStatus.services[serviceName];
                return {
                    name: serviceName,
                    healthy: service && service.status === 'healthy'
                };
            });
            
            const allRequiredHealthy = requiredServicesStatus.every(service => service.healthy);
            
            if (allRequiredHealthy) {
                console.log('🎉 All required services are healthy! Startup complete.');
                this.startupComplete = true;
                
                // Save startup report
                await this.saveStartupReport(healthStatus, attempts);
                return true;
            }
            
            // Show status of each required service
            console.log('📊 Required services status:');
            requiredServicesStatus.forEach(service => {
                const status = service.healthy ? '✅' : '❌';
                console.log(`   ${status} ${service.name}`);
            });
            
            // Attempt auto-healing for unhealthy services
            const unhealthyServices = requiredServicesStatus
                .filter(service => !service.healthy)
                .map(service => service.name);
            
            if (unhealthyServices.length > 0) {
                console.log(`🔧 Attempting to heal ${unhealthyServices.length} unhealthy services...`);
                await this.healthChecker.autoHeal();
            }
            
            // Wait before next check
            console.log(`⏳ Waiting ${this.config.healthCheckInterval / 1000}s before next check...`);
            await new Promise(resolve => setTimeout(resolve, this.config.healthCheckInterval));
        }
        
        // Startup timeout reached
        console.log('❌ Startup timeout reached! Some services may be unhealthy.');
        await this.saveStartupReport(await this.healthChecker.performFullHealthCheck(), attempts);
        return false;
    }

    async saveStartupReport(healthStatus, attempts) {
        const report = {
            startupComplete: this.startupComplete,
            startupDuration: Date.now() - this.startupStartTime,
            healthCheckAttempts: attempts,
            finalHealthStatus: healthStatus,
            requiredServices: this.config.requiredServices,
            timestamp: new Date().toISOString(),
            version: '3.0'
        };
        
        const reportPath = path.join(__dirname, '..', '..', 'logs', 'startup-report.json');
        
        try {
            const fs = require('fs').promises;
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Startup report saved to ${reportPath}`);
        } catch (error) {
            console.error(`❌ Failed to save startup report: ${error.message}`);
        }
    }

    async monitorContinuousHealth(interval = 60000) {
        if (!this.startupComplete) {
            console.log('⚠️  Startup not complete, skipping continuous monitoring');
            return;
        }
        
        console.log(`🔄 Starting continuous health monitoring (every ${interval / 1000}s)`);
        
        setInterval(async () => {
            console.log('\n🔍 Performing scheduled health check...');
            const healthStatus = await this.healthChecker.performFullHealthCheck();
            
            if (healthStatus.overall !== 'healthy') {
                console.log('⚠️  System health degraded, attempting auto-healing...');
                await this.healthChecker.autoHeal();
            }
            
            // Save health report
            const reportPath = path.join(__dirname, '..', '..', 'logs', 'health-report.json');
            await this.healthChecker.saveHealthReport(reportPath);
            
        }, interval);
    }

    getStartupStatus() {
        return {
            complete: this.startupComplete,
            duration: Date.now() - this.startupStartTime,
            healthStatus: this.healthChecker.getHealthStatus()
        };
    }
}

module.exports = StartupMonitor;

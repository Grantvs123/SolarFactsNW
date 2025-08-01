
/**
 * SolarFactsNW Startup Health Check Script
 * Runs comprehensive health checks before allowing system startup
 */

const StartupMonitor = require('../core/health/startup-monitor');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

async function runStartupHealthCheck() {
    console.log('🚀 SolarFactsNW Production Powerhouse v3.0');
    console.log('==========================================');
    console.log('Starting comprehensive startup health check...\n');

    const startupMonitor = new StartupMonitor({
        maxStartupTime: 120000, // 2 minutes
        healthCheckInterval: 5000, // 5 seconds
        requiredServices: [
            'OpenAI API',
            'Telnyx API',
            'Retell API', 
            'MySQL Database',
            'Dynamic IP Resolution'
        ]
    });

    try {
        const success = await startupMonitor.waitForHealthyServices();
        
        if (success) {
            console.log('\n🎉 ===== STARTUP HEALTH CHECK PASSED =====');
            console.log('✅ All required services are healthy');
            console.log('✅ System is ready for production use');
            console.log('✅ Node-RED can now be started safely');
            
            // Start continuous monitoring
            console.log('\n🔄 Starting continuous health monitoring...');
            startupMonitor.monitorContinuousHealth(60000); // Every minute
            
            return true;
        } else {
            console.log('\n❌ ===== STARTUP HEALTH CHECK FAILED =====');
            console.log('⚠️  Some required services are unhealthy');
            console.log('⚠️  System may not function properly');
            console.log('⚠️  Check the logs and fix issues before proceeding');
            
            const status = startupMonitor.getStartupStatus();
            console.log('\n📊 Final Status Summary:');
            Object.entries(status.healthStatus.services).forEach(([name, service]) => {
                const icon = service.status === 'healthy' ? '✅' : '❌';
                console.log(`   ${icon} ${name}: ${service.status}`);
                if (service.error) {
                    console.log(`      Error: ${service.error}`);
                }
            });
            
            return false;
        }
    } catch (error) {
        console.error('\n💥 ===== STARTUP HEALTH CHECK ERROR =====');
        console.error('❌ Critical error during health check:', error.message);
        console.error('❌ System startup aborted');
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    runStartupHealthCheck().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runStartupHealthCheck };

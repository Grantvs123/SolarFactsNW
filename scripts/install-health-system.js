
/**
 * SolarFactsNW Health System Installer
 * Installs and configures the health monitoring system
 */

const fs = require('fs').promises;
const path = require('path');

async function installHealthSystem() {
    console.log('🏥 Installing SolarFactsNW Health System...');
    
    try {
        // Create necessary directories
        const dirs = [
            'logs',
            'core/health',
            'shared/middleware'
        ];
        
        for (const dir of dirs) {
            const dirPath = path.join(__dirname, '..', dir);
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
        
        // Install health system in Node-RED settings
        const settingsPath = path.join(__dirname, '..', 'settings.js');
        let settingsContent = await fs.readFile(settingsPath, 'utf8');
        
        // Add health system initialization to functionGlobalContext
        const healthSystemInit = `
        // Health System Integration
        HealthChecker: require('./core/health/health-checker'),
        StartupMonitor: require('./core/health/startup-monitor'),
        HealthDashboard: require('./core/health/health-dashboard'),`;
        
        if (!settingsContent.includes('HealthChecker')) {
            settingsContent = settingsContent.replace(
                'functionGlobalContext: {',
                `functionGlobalContext: {${healthSystemInit}`
            );
            
            await fs.writeFile(settingsPath, settingsContent);
            console.log('✅ Updated settings.js with health system integration');
        }
        
        // Create health system startup script
        const startupScript = `#!/bin/bash
# SolarFactsNW Health-Aware Startup Script

echo "🚀 Starting SolarFactsNW with Health Monitoring..."

# Run startup health check
node scripts/startup-health-check.js

if [ $? -eq 0 ]; then
    echo "✅ Health check passed - starting Node-RED..."
    npm start
else
    echo "❌ Health check failed - startup aborted"
    exit 1
fi
`;
        
        const startupScriptPath = path.join(__dirname, '..', 'start-with-health-check.sh');
        await fs.writeFile(startupScriptPath, startupScript);
        
        // Make script executable
        const { exec } = require('child_process');
        exec(`chmod +x "${startupScriptPath}"`);
        
        console.log('✅ Created health-aware startup script');
        
        // Create systemd service file template
        const systemdService = `[Unit]
Description=SolarFactsNW Production Powerhouse
After=network.target mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SolarFactsNW
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/SolarFactsNW/.env.local
ExecStartPre=/usr/bin/node scripts/startup-health-check.js
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=solarfactsnw

[Install]
WantedBy=multi-user.target
`;
        
        const serviceFilePath = path.join(__dirname, '..', 'dist', 'solarfactsnw.service');
        await fs.writeFile(serviceFilePath, systemdService);
        console.log('✅ Created systemd service file template');
        
        console.log('\n🎉 Health System Installation Complete!');
        console.log('\nNext steps:');
        console.log('1. Test health system: node scripts/startup-health-check.js');
        console.log('2. Start with health check: ./start-with-health-check.sh');
        console.log('3. View health dashboard: http://localhost:1880/health/dashboard');
        console.log('4. Install as service: sudo cp dist/solarfactsnw.service /etc/systemd/system/');
        
    } catch (error) {
        console.error('❌ Health system installation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    installHealthSystem();
}

module.exports = { installHealthSystem };

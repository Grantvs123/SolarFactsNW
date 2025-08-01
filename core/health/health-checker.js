
/**
 * SolarFactsNW Health Check System
 * Comprehensive health monitoring for all external dependencies
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

class HealthChecker {
    constructor(config = {}) {
        this.config = {
            timeout: config.timeout || 10000,
            retries: config.retries || 3,
            retryDelay: config.retryDelay || 2000,
            ...config
        };
        
        this.healthStatus = {
            overall: 'unknown',
            services: {},
            lastCheck: null,
            uptime: process.uptime()
        };
        
        this.healingAttempts = new Map();
    }

    async checkOpenAI() {
        const serviceName = 'OpenAI API';
        console.log(`🔍 Checking ${serviceName}...`);
        
        try {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey || apiKey === 'your_openai_api_key_here') {
                throw new Error('OpenAI API key not configured');
            }

            const response = await axios.get('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.config.timeout
            });

            if (response.status === 200) {
                this.healthStatus.services[serviceName] = {
                    status: 'healthy',
                    responseTime: response.headers['x-response-time'] || 'N/A',
                    lastCheck: new Date().toISOString(),
                    details: `${response.data.data?.length || 0} models available`
                };
                console.log(`✅ ${serviceName} is healthy`);
                return true;
            }
        } catch (error) {
            this.healthStatus.services[serviceName] = {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString(),
                details: 'Failed to connect to OpenAI API'
            };
            console.log(`❌ ${serviceName} is unhealthy: ${error.message}`);
            return false;
        }
    }

    async checkTelnyx() {
        const serviceName = 'Telnyx API';
        console.log(`🔍 Checking ${serviceName}...`);
        
        try {
            const apiKey = process.env.TELNYX_API_KEY;
            if (!apiKey || apiKey === 'your_telnyx_api_key_here') {
                throw new Error('Telnyx API key not configured');
            }

            const response = await axios.get('https://api.telnyx.com/v2/phone_numbers', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.config.timeout,
                params: { 'page[size]': 1 }
            });

            if (response.status === 200) {
                this.healthStatus.services[serviceName] = {
                    status: 'healthy',
                    responseTime: response.headers['x-response-time'] || 'N/A',
                    lastCheck: new Date().toISOString(),
                    details: 'API connection successful'
                };
                console.log(`✅ ${serviceName} is healthy`);
                return true;
            }
        } catch (error) {
            this.healthStatus.services[serviceName] = {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString(),
                details: 'Failed to connect to Telnyx API'
            };
            console.log(`❌ ${serviceName} is unhealthy: ${error.message}`);
            return false;
        }
    }

    async checkRetell() {
        const serviceName = 'Retell API';
        console.log(`🔍 Checking ${serviceName}...`);
        
        try {
            const apiKey = process.env.RETELL_API_KEY;
            if (!apiKey || apiKey === 'your_retell_api_key_here') {
                throw new Error('Retell API key not configured');
            }

            // Retell API health check endpoint
            const response = await axios.get('https://api.retellai.com/health', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.config.timeout
            });

            if (response.status === 200) {
                this.healthStatus.services[serviceName] = {
                    status: 'healthy',
                    responseTime: response.headers['x-response-time'] || 'N/A',
                    lastCheck: new Date().toISOString(),
                    details: 'API connection successful'
                };
                console.log(`✅ ${serviceName} is healthy`);
                return true;
            }
        } catch (error) {
            this.healthStatus.services[serviceName] = {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString(),
                details: 'Failed to connect to Retell API'
            };
            console.log(`❌ ${serviceName} is unhealthy: ${error.message}`);
            return false;
        }
    }

    async checkMySQL() {
        const serviceName = 'MySQL Database';
        console.log(`🔍 Checking ${serviceName}...`);
        
        let connection = null;
        try {
            const config = {
                host: process.env.MYSQL_HOST || 'localhost',
                port: process.env.MYSQL_PORT || 3306,
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || '',
                database: process.env.MYSQL_DATABASE || 'solarfacts_db',
                connectTimeout: this.config.timeout,
                acquireTimeout: this.config.timeout
            };

            connection = await mysql.createConnection(config);
            
            // Test query
            const [rows] = await connection.execute('SELECT 1 as test');
            
            if (rows && rows[0].test === 1) {
                this.healthStatus.services[serviceName] = {
                    status: 'healthy',
                    lastCheck: new Date().toISOString(),
                    details: `Connected to ${config.host}:${config.port}/${config.database}`
                };
                console.log(`✅ ${serviceName} is healthy`);
                return true;
            }
        } catch (error) {
            this.healthStatus.services[serviceName] = {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString(),
                details: 'Failed to connect to MySQL database'
            };
            console.log(`❌ ${serviceName} is unhealthy: ${error.message}`);
            return false;
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    async checkDynamicIP() {
        const serviceName = 'Dynamic IP Resolution';
        console.log(`🔍 Checking ${serviceName}...`);
        
        try {
            // Check external IP resolution
            const response = await axios.get('https://api.ipify.org?format=json', {
                timeout: this.config.timeout
            });

            if (response.data && response.data.ip) {
                this.healthStatus.services[serviceName] = {
                    status: 'healthy',
                    lastCheck: new Date().toISOString(),
                    details: `External IP: ${response.data.ip}`,
                    externalIP: response.data.ip
                };
                console.log(`✅ ${serviceName} is healthy - IP: ${response.data.ip}`);
                return true;
            }
        } catch (error) {
            this.healthStatus.services[serviceName] = {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString(),
                details: 'Failed to resolve external IP'
            };
            console.log(`❌ ${serviceName} is unhealthy: ${error.message}`);
            return false;
        }
    }

    async performFullHealthCheck() {
        console.log('🏥 Starting comprehensive health check...');
        const startTime = Date.now();
        
        this.healthStatus.lastCheck = new Date().toISOString();
        
        const checks = [
            this.checkOpenAI(),
            this.checkTelnyx(),
            this.checkRetell(),
            this.checkMySQL(),
            this.checkDynamicIP()
        ];

        const results = await Promise.allSettled(checks);
        
        // Calculate overall health
        const healthyServices = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
        const totalServices = results.length;
        
        if (healthyServices === totalServices) {
            this.healthStatus.overall = 'healthy';
        } else if (healthyServices > totalServices / 2) {
            this.healthStatus.overall = 'degraded';
        } else {
            this.healthStatus.overall = 'unhealthy';
        }
        
        this.healthStatus.checkDuration = Date.now() - startTime;
        this.healthStatus.healthyServices = healthyServices;
        this.healthStatus.totalServices = totalServices;
        
        console.log(`🏥 Health check completed in ${this.healthStatus.checkDuration}ms`);
        console.log(`📊 Overall status: ${this.healthStatus.overall} (${healthyServices}/${totalServices} services healthy)`);
        
        return this.healthStatus;
    }

    async attemptHealing(serviceName) {
        console.log(`🔧 Attempting to heal ${serviceName}...`);
        
        const attempts = this.healingAttempts.get(serviceName) || 0;
        if (attempts >= this.config.retries) {
            console.log(`❌ Max healing attempts reached for ${serviceName}`);
            return false;
        }
        
        this.healingAttempts.set(serviceName, attempts + 1);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        
        // Attempt service-specific healing
        switch (serviceName) {
            case 'OpenAI API':
                return await this.checkOpenAI();
            case 'Telnyx API':
                return await this.checkTelnyx();
            case 'Retell API':
                return await this.checkRetell();
            case 'MySQL Database':
                return await this.checkMySQL();
            case 'Dynamic IP Resolution':
                return await this.checkDynamicIP();
            default:
                return false;
        }
    }

    async autoHeal() {
        console.log('🔧 Starting auto-healing process...');
        
        const unhealthyServices = Object.entries(this.healthStatus.services)
            .filter(([name, status]) => status.status === 'unhealthy')
            .map(([name]) => name);
        
        if (unhealthyServices.length === 0) {
            console.log('✅ No unhealthy services found');
            return true;
        }
        
        const healingPromises = unhealthyServices.map(serviceName => 
            this.attemptHealing(serviceName)
        );
        
        const healingResults = await Promise.allSettled(healingPromises);
        const healedServices = healingResults.filter(result => 
            result.status === 'fulfilled' && result.value === true
        ).length;
        
        console.log(`🔧 Auto-healing completed: ${healedServices}/${unhealthyServices.length} services healed`);
        
        return healedServices === unhealthyServices.length;
    }

    getHealthStatus() {
        return this.healthStatus;
    }

    async saveHealthReport(filePath) {
        try {
            const report = {
                ...this.healthStatus,
                generatedAt: new Date().toISOString(),
                version: '3.0'
            };
            
            await fs.writeFile(filePath, JSON.stringify(report, null, 2));
            console.log(`📄 Health report saved to ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to save health report: ${error.message}`);
        }
    }
}

module.exports = HealthChecker;

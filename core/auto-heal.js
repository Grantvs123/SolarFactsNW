
/**
 * SolarFactsNW Auto-Healing System
 * Intelligent failure detection and automatic recovery
 */

const HealthChecker = require('./health/health-checker');
const Logger = require('./utils/logger');
const ConfigManager = require('./utils/config-manager');

class AutoHealSystem {
    constructor(config = {}) {
        this.config = {
            healingInterval: config.healingInterval || 60000, // 1 minute
            maxHealingAttempts: config.maxHealingAttempts || 5,
            healingCooldown: config.healingCooldown || 300000, // 5 minutes
            criticalServices: config.criticalServices || [
                'OpenAI API',
                'Telnyx API',
                'Retell API',
                'MySQL Database'
            ],
            enableAutoRestart: config.enableAutoRestart !== false,
            enableServiceRecovery: config.enableServiceRecovery !== false,
            ...config
        };
        
        this.logger = Logger;
        this.configManager = new ConfigManager();
        this.healthChecker = new HealthChecker();
        
        this.healingAttempts = new Map();
        this.lastHealingAttempt = new Map();
        this.healingHistory = [];
        this.isHealing = false;
        this.healingInterval = null;
    }

    async initialize() {
        this.logger.info('🔧 Initializing Auto-Healing System...');
        
        try {
            // Start continuous monitoring
            await this.startContinuousHealing();
            
            this.logger.info('✅ Auto-Healing System initialized');
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize Auto-Healing System:', error.message);
            return false;
        }
    }

    async startContinuousHealing() {
        if (this.healingInterval) {
            clearInterval(this.healingInterval);
        }
        
        this.logger.info(`🔄 Starting continuous healing (every ${this.config.healingInterval / 1000}s)`);
        
        this.healingInterval = setInterval(async () => {
            if (!this.isHealing) {
                await this.performHealingCycle();
            }
        }, this.config.healingInterval);
    }

    async performHealingCycle() {
        this.isHealing = true;
        
        try {
            this.logger.debug('🔍 Performing healing cycle...');
            
            // Get current health status
            const healthStatus = await this.healthChecker.performFullHealthCheck();
            
            // Identify unhealthy services
            const unhealthyServices = Object.entries(healthStatus.services)
                .filter(([name, service]) => service.status === 'unhealthy')
                .map(([name]) => name);
            
            if (unhealthyServices.length === 0) {
                this.logger.debug('✅ All services healthy - no healing needed');
                return;
            }
            
            this.logger.info(`🔧 Found ${unhealthyServices.length} unhealthy services: ${unhealthyServices.join(', ')}`);
            
            // Attempt healing for each unhealthy service
            const healingResults = [];
            for (const serviceName of unhealthyServices) {
                const result = await this.attemptServiceHealing(serviceName);
                healingResults.push({ service: serviceName, ...result });
            }
            
            // Log healing results
            const successful = healingResults.filter(r => r.success).length;
            const failed = healingResults.filter(r => !r.success).length;
            
            this.logger.info(`🔧 Healing cycle complete: ${successful} successful, ${failed} failed`);
            
            // Record healing history
            this.recordHealingAttempt(unhealthyServices, healingResults);
            
            // Check if critical services are still down
            await this.handleCriticalServiceFailures(unhealthyServices, healingResults);
            
        } catch (error) {
            this.logger.error('❌ Error during healing cycle:', error.message);
        } finally {
            this.isHealing = false;
        }
    }

    async attemptServiceHealing(serviceName) {
        const now = Date.now();
        const attempts = this.healingAttempts.get(serviceName) || 0;
        const lastAttempt = this.lastHealingAttempt.get(serviceName) || 0;
        
        // Check if we're in cooldown period
        if (now - lastAttempt < this.config.healingCooldown) {
            return {
                success: false,
                reason: 'cooldown',
                message: 'Service is in healing cooldown period'
            };
        }
        
        // Check if max attempts reached
        if (attempts >= this.config.maxHealingAttempts) {
            return {
                success: false,
                reason: 'max_attempts',
                message: 'Maximum healing attempts reached'
            };
        }
        
        this.logger.info(`🔧 Attempting to heal service: ${serviceName} (attempt ${attempts + 1}/${this.config.maxHealingAttempts})`);
        
        try {
            const healingStrategy = this.getHealingStrategy(serviceName);
            const result = await this.executeHealingStrategy(serviceName, healingStrategy);
            
            // Update attempt counters
            if (result.success) {
                this.healingAttempts.delete(serviceName);
                this.lastHealingAttempt.delete(serviceName);
                this.logger.info(`✅ Successfully healed service: ${serviceName}`);
            } else {
                this.healingAttempts.set(serviceName, attempts + 1);
                this.lastHealingAttempt.set(serviceName, now);
                this.logger.warn(`⚠️ Failed to heal service: ${serviceName} - ${result.message}`);
            }
            
            return result;
        } catch (error) {
            this.healingAttempts.set(serviceName, attempts + 1);
            this.lastHealingAttempt.set(serviceName, now);
            
            this.logger.error(`❌ Error healing service ${serviceName}:`, error.message);
            return {
                success: false,
                reason: 'error',
                message: error.message
            };
        }
    }

    getHealingStrategy(serviceName) {
        const strategies = {
            'OpenAI API': 'api_reconnect',
            'Telnyx API': 'api_reconnect',
            'Retell API': 'api_reconnect',
            'MySQL Database': 'database_reconnect',
            'Dynamic IP Resolution': 'network_refresh'
        };
        
        return strategies[serviceName] || 'generic_restart';
    }

    async executeHealingStrategy(serviceName, strategy) {
        this.logger.debug(`🔧 Executing healing strategy '${strategy}' for ${serviceName}`);
        
        switch (strategy) {
            case 'api_reconnect':
                return await this.healApiService(serviceName);
                
            case 'database_reconnect':
                return await this.healDatabaseService(serviceName);
                
            case 'network_refresh':
                return await this.healNetworkService(serviceName);
                
            case 'generic_restart':
                return await this.healGenericService(serviceName);
                
            default:
                return {
                    success: false,
                    reason: 'unknown_strategy',
                    message: `Unknown healing strategy: ${strategy}`
                };
        }
    }

    async healApiService(serviceName) {
        try {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test the API connection
            let testResult = false;
            switch (serviceName) {
                case 'OpenAI API':
                    testResult = await this.healthChecker.checkOpenAI();
                    break;
                case 'Telnyx API':
                    testResult = await this.healthChecker.checkTelnyx();
                    break;
                case 'Retell API':
                    testResult = await this.healthChecker.checkRetell();
                    break;
            }
            
            return {
                success: testResult,
                reason: testResult ? 'reconnected' : 'still_failing',
                message: testResult ? 'API service reconnected successfully' : 'API service still failing'
            };
        } catch (error) {
            return {
                success: false,
                reason: 'error',
                message: error.message
            };
        }
    }

    async healDatabaseService(serviceName) {
        try {
            // Wait before retrying database connection
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Test database connection
            const testResult = await this.healthChecker.checkMySQL();
            
            return {
                success: testResult,
                reason: testResult ? 'reconnected' : 'still_failing',
                message: testResult ? 'Database reconnected successfully' : 'Database still failing'
            };
        } catch (error) {
            return {
                success: false,
                reason: 'error',
                message: error.message
            };
        }
    }

    async healNetworkService(serviceName) {
        try {
            // Refresh network connection
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test network connectivity
            const testResult = await this.healthChecker.checkDynamicIP();
            
            return {
                success: testResult,
                reason: testResult ? 'network_refreshed' : 'still_failing',
                message: testResult ? 'Network connectivity restored' : 'Network still failing'
            };
        } catch (error) {
            return {
                success: false,
                reason: 'error',
                message: error.message
            };
        }
    }

    async healGenericService(serviceName) {
        // Generic healing strategy - just wait and retry
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return {
            success: false,
            reason: 'generic_retry',
            message: 'Generic healing strategy applied - manual intervention may be required'
        };
    }

    async handleCriticalServiceFailures(unhealthyServices, healingResults) {
        const criticalFailures = unhealthyServices.filter(service => 
            this.config.criticalServices.includes(service)
        );
        
        const failedCriticalHealing = healingResults.filter(result => 
            this.config.criticalServices.includes(result.service) && !result.success
        );
        
        if (failedCriticalHealing.length > 0) {
            this.logger.error(`🚨 Critical service healing failed: ${failedCriticalHealing.map(r => r.service).join(', ')}`);
            
            // Trigger emergency procedures if enabled
            if (this.config.enableAutoRestart) {
                await this.triggerEmergencyRestart(failedCriticalHealing);
            }
        }
    }

    async triggerEmergencyRestart(failedServices) {
        this.logger.error('🚨 Triggering emergency restart procedures...');
        
        // Log the emergency restart
        this.recordEmergencyRestart(failedServices);
        
        // In a real implementation, this might restart the entire application
        // For now, we'll just log the action
        this.logger.error('🔄 Emergency restart would be triggered here');
        
        // Reset healing attempts for failed services
        failedServices.forEach(result => {
            this.healingAttempts.delete(result.service);
            this.lastHealingAttempt.delete(result.service);
        });
    }

    recordHealingAttempt(unhealthyServices, results) {
        const record = {
            timestamp: new Date().toISOString(),
            unhealthyServices: unhealthyServices,
            results: results,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };
        
        this.healingHistory.push(record);
        
        // Keep only last 100 records
        if (this.healingHistory.length > 100) {
            this.healingHistory = this.healingHistory.slice(-100);
        }
    }

    recordEmergencyRestart(failedServices) {
        const record = {
            timestamp: new Date().toISOString(),
            type: 'emergency_restart',
            failedServices: failedServices.map(r => r.service),
            reason: 'critical_service_healing_failed'
        };
        
        this.healingHistory.push(record);
    }

    getHealingStats() {
        const recentHistory = this.healingHistory.slice(-10);
        
        return {
            totalAttempts: this.healingHistory.length,
            recentAttempts: recentHistory.length,
            currentlyHealing: this.isHealing,
            servicesInCooldown: Array.from(this.lastHealingAttempt.keys()),
            healingInterval: this.config.healingInterval,
            maxAttempts: this.config.maxHealingAttempts,
            recentHistory: recentHistory
        };
    }

    async stop() {
        if (this.healingInterval) {
            clearInterval(this.healingInterval);
            this.healingInterval = null;
        }
        
        this.logger.info('🔧 Auto-Healing System stopped');
    }
}

module.exports = AutoHealSystem;

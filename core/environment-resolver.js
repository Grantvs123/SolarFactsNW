
/**
 * SolarFactsNW Environment Resolution System
 * Multi-tenant environment configuration management
 */

const fs = require('fs').promises;
const path = require('path');
const ConfigManager = require('./utils/config-manager');
const Logger = require('./utils/logger');

class EnvironmentResolver {
    constructor(config = {}) {
        this.config = {
            envDir: config.envDir || path.join(__dirname, '..', 'environments'),
            defaultEnv: config.defaultEnv || 'development',
            tenantEnvPrefix: config.tenantEnvPrefix || 'tenant_',
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            ...config
        };
        
        this.logger = Logger;
        this.envCache = new Map();
        this.tenantConfigs = new Map();
    }

    async initialize() {
        this.logger.info('🌍 Initializing Environment Resolution System...');
        
        try {
            // Ensure environment directory exists
            await this.ensureEnvDirectory();
            
            // Load base environments
            await this.loadBaseEnvironments();
            
            // Detect tenant configurations
            await this.detectTenantConfigs();
            
            this.logger.info('✅ Environment Resolution System initialized');
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize Environment Resolution System:', error.message);
            return false;
        }
    }

    async ensureEnvDirectory() {
        try {
            await fs.mkdir(this.config.envDir, { recursive: true });
            
            // Create subdirectories
            const subDirs = ['base', 'tenants', 'templates', 'overrides'];
            for (const subDir of subDirs) {
                await fs.mkdir(path.join(this.config.envDir, subDir), { recursive: true });
            }
            
            // Create default environment files if they don't exist
            await this.createDefaultEnvironments();
            
            this.logger.debug('📁 Environment directories ensured');
        } catch (error) {
            throw new Error(`Failed to create environment directories: ${error.message}`);
        }
    }

    async createDefaultEnvironments() {
        const baseEnvs = ['development', 'staging', 'production'];
        
        for (const env of baseEnvs) {
            const envFile = path.join(this.config.envDir, 'base', `${env}.json`);
            
            try {
                await fs.access(envFile);
                // File exists, skip
                continue;
            } catch {
                // File doesn't exist, create it
                const defaultConfig = this.getDefaultEnvironmentConfig(env);
                await fs.writeFile(envFile, JSON.stringify(defaultConfig, null, 2));
                this.logger.info(`📄 Created default environment: ${env}`);
            }
        }
    }

    getDefaultEnvironmentConfig(env) {
        const baseConfig = {
            name: env,
            version: '3.0.0',
            created: new Date().toISOString(),
            description: `Default ${env} environment for SolarFactsNW`,
            
            application: {
                name: 'SolarFactsNW',
                port: env === 'production' ? 80 : 1880,
                host: env === 'production' ? '0.0.0.0' : '127.0.0.1',
                logLevel: env === 'production' ? 'info' : 'debug'
            },
            
            features: {
                healthChecks: true,
                autoHealing: env === 'production',
                monitoring: env === 'production',
                authentication: env === 'production',
                rateLimit: env === 'production'
            },
            
            security: {
                enableHttps: env === 'production',
                requireAuth: env === 'production',
                sessionTimeout: env === 'production' ? 3600 : 86400,
                maxLoginAttempts: 5
            },
            
            database: {
                host: 'localhost',
                port: 3306,
                database: `solarfacts_${env}`,
                connectionLimit: env === 'production' ? 20 : 5,
                acquireTimeout: 60000,
                timeout: 60000
            },
            
            apis: {
                timeout: 30000,
                retries: env === 'production' ? 3 : 1,
                rateLimit: env === 'production' ? 100 : 1000
            }
        };
        
        return baseConfig;
    }

    async loadBaseEnvironments() {
        this.logger.info('📦 Loading base environments...');
        
        try {
            const baseDir = path.join(this.config.envDir, 'base');
            const files = await fs.readdir(baseDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const envName = path.basename(file, '.json');
                    const envPath = path.join(baseDir, file);
                    
                    try {
                        const content = await fs.readFile(envPath, 'utf8');
                        const envConfig = JSON.parse(content);
                        
                        this.envCache.set(envName, {
                            config: envConfig,
                            loadedAt: new Date(),
                            source: 'base',
                            path: envPath
                        });
                        
                        this.logger.debug(`📄 Loaded base environment: ${envName}`);
                    } catch (error) {
                        this.logger.error(`❌ Failed to load base environment ${envName}:`, error.message);
                    }
                }
            }
            
            this.logger.info(`✅ Loaded ${this.envCache.size} base environments`);
        } catch (error) {
            this.logger.error('❌ Failed to load base environments:', error.message);
        }
    }

    async detectTenantConfigs() {
        this.logger.info('🏢 Detecting tenant configurations...');
        
        try {
            const tenantsDir = path.join(this.config.envDir, 'tenants');
            const files = await fs.readdir(tenantsDir);
            
            for (const file of files) {
                if (file.endsWith('.json') && file.startsWith(this.config.tenantEnvPrefix)) {
                    const tenantId = file.replace(this.config.tenantEnvPrefix, '').replace('.json', '');
                    const tenantPath = path.join(tenantsDir, file);
                    
                    try {
                        const content = await fs.readFile(tenantPath, 'utf8');
                        const tenantConfig = JSON.parse(content);
                        
                        this.tenantConfigs.set(tenantId, {
                            config: tenantConfig,
                            loadedAt: new Date(),
                            path: tenantPath
                        });
                        
                        this.logger.debug(`🏢 Loaded tenant config: ${tenantId}`);
                    } catch (error) {
                        this.logger.error(`❌ Failed to load tenant config ${tenantId}:`, error.message);
                    }
                }
            }
            
            this.logger.info(`✅ Detected ${this.tenantConfigs.size} tenant configurations`);
        } catch (error) {
            this.logger.error('❌ Failed to detect tenant configurations:', error.message);
        }
    }

    async resolveEnvironment(envName, tenantId = null, overrides = {}) {
        this.logger.debug(`🔍 Resolving environment: ${envName}${tenantId ? ` for tenant ${tenantId}` : ''}`);
        
        try {
            // Get base environment
            const baseEnv = this.envCache.get(envName);
            if (!baseEnv) {
                throw new Error(`Base environment ${envName} not found`);
            }
            
            let resolvedConfig = JSON.parse(JSON.stringify(baseEnv.config));
            
            // Apply tenant-specific overrides
            if (tenantId) {
                const tenantConfig = this.tenantConfigs.get(tenantId);
                if (tenantConfig) {
                    resolvedConfig = this.mergeConfigs(resolvedConfig, tenantConfig.config);
                    this.logger.debug(`🏢 Applied tenant overrides for: ${tenantId}`);
                }
            }
            
            // Apply runtime overrides
            if (Object.keys(overrides).length > 0) {
                resolvedConfig = this.mergeConfigs(resolvedConfig, overrides);
                this.logger.debug('⚙️ Applied runtime overrides');
            }
            
            // Add resolution metadata
            resolvedConfig._resolution = {
                baseEnv: envName,
                tenantId: tenantId,
                resolvedAt: new Date().toISOString(),
                hasOverrides: Object.keys(overrides).length > 0
            };
            
            return resolvedConfig;
        } catch (error) {
            this.logger.error(`❌ Failed to resolve environment ${envName}:`, error.message);
            throw error;
        }
    }

    mergeConfigs(base, override) {
        const result = JSON.parse(JSON.stringify(base));
        
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        deepMerge(result, override);
        return result;
    }

    async createTenantConfig(tenantId, baseEnv, customConfig = {}) {
        this.logger.info(`🏢 Creating tenant configuration: ${tenantId}`);
        
        try {
            // Get base environment as template
            const baseConfig = this.envCache.get(baseEnv);
            if (!baseConfig) {
                throw new Error(`Base environment ${baseEnv} not found`);
            }
            
            // Create tenant-specific config
            const tenantConfig = {
                tenantId: tenantId,
                baseEnvironment: baseEnv,
                created: new Date().toISOString(),
                version: '3.0.0',
                
                // Tenant-specific overrides
                application: {
                    name: `SolarFactsNW-${tenantId}`,
                    ...customConfig.application
                },
                
                database: {
                    database: `solarfacts_${tenantId}`,
                    ...customConfig.database
                },
                
                // Merge other custom configurations
                ...customConfig
            };
            
            // Save tenant config
            const tenantFile = path.join(
                this.config.envDir, 
                'tenants', 
                `${this.config.tenantEnvPrefix}${tenantId}.json`
            );
            
            await fs.writeFile(tenantFile, JSON.stringify(tenantConfig, null, 2));
            
            // Cache the config
            this.tenantConfigs.set(tenantId, {
                config: tenantConfig,
                loadedAt: new Date(),
                path: tenantFile
            });
            
            this.logger.info(`✅ Created tenant configuration: ${tenantId}`);
            return tenantConfig;
        } catch (error) {
            this.logger.error(`❌ Failed to create tenant config ${tenantId}:`, error.message);
            throw error;
        }
    }

    async getCurrentEnvironment() {
        const envName = process.env.NODE_ENV || this.config.defaultEnv;
        const tenantId = process.env.TENANT_ID || null;
        
        return await this.resolveEnvironment(envName, tenantId);
    }

    getAvailableEnvironments() {
        return Array.from(this.envCache.keys());
    }

    getAvailableTenants() {
        return Array.from(this.tenantConfigs.keys());
    }

    async reloadEnvironment(envName) {
        this.logger.info(`🔄 Reloading environment: ${envName}`);
        
        const envPath = path.join(this.config.envDir, 'base', `${envName}.json`);
        
        try {
            const content = await fs.readFile(envPath, 'utf8');
            const envConfig = JSON.parse(content);
            
            this.envCache.set(envName, {
                config: envConfig,
                loadedAt: new Date(),
                source: 'base',
                path: envPath
            });
            
            this.logger.info(`✅ Reloaded environment: ${envName}`);
        } catch (error) {
            this.logger.error(`❌ Failed to reload environment ${envName}:`, error.message);
            throw error;
        }
    }

    clearCache() {
        this.envCache.clear();
        this.tenantConfigs.clear();
        this.logger.info('🗑️ Environment cache cleared');
    }

    getStats() {
        return {
            baseEnvironments: this.envCache.size,
            tenantConfigs: this.tenantConfigs.size,
            cacheTimeout: this.config.cacheTimeout,
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = EnvironmentResolver;

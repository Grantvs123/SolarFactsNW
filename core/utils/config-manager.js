
/**
 * SolarFactsNW Configuration Manager
 * Centralized configuration management with environment support
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor(configPath = null) {
        this.configPath = configPath || path.join(__dirname, '..', '..', '.env.local');
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        try {
            // Load environment variables
            if (fs.existsSync(this.configPath)) {
                require('dotenv').config({ path: this.configPath });
            }

            // Build configuration object
            this.config = {
                // Application
                app: {
                    name: 'SolarFactsNW',
                    version: '3.0.0',
                    env: process.env.APP_ENV || 'development',
                    port: parseInt(process.env.APP_PORT) || 1880,
                    host: process.env.APP_HOST || '127.0.0.1'
                },

                // Security
                security: {
                    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
                    sessionSecret: process.env.SESSION_SECRET,
                    jwtSecret: process.env.JWT_SECRET
                },

                // APIs
                apis: {
                    openai: {
                        key: process.env.OPENAI_API_KEY,
                        baseUrl: 'https://api.openai.com/v1'
                    },
                    telnyx: {
                        key: process.env.TELNYX_API_KEY,
                        baseUrl: 'https://api.telnyx.com/v2'
                    },
                    retell: {
                        key: process.env.RETELL_API_KEY,
                        baseUrl: 'https://api.retellai.com'
                    }
                },

                // Database
                database: {
                    host: process.env.MYSQL_HOST || 'localhost',
                    port: parseInt(process.env.MYSQL_PORT) || 3306,
                    database: process.env.MYSQL_DATABASE || 'solarfacts_db',
                    user: process.env.MYSQL_USER || 'root',
                    password: process.env.MYSQL_PASSWORD || ''
                },

                // Features
                features: {
                    healthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true',
                    autoHealing: process.env.ENABLE_AUTO_HEALING === 'true',
                    monitoring: process.env.ENABLE_MONITORING === 'true'
                },

                // URLs
                urls: {
                    webhook: process.env.WEBHOOK_BASE_URL || 'http://localhost:1880',
                    callback: process.env.CALLBACK_BASE_URL || 'http://localhost:1880/callback'
                }
            };

        } catch (error) {
            console.error('Failed to load configuration:', error.message);
            throw error;
        }
    }

    get(path) {
        return this.getNestedValue(this.config, path);
    }

    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    validate() {
        const errors = [];

        // Validate required configuration
        const required = [
            'security.credentialSecret',
            'apis.openai.key',
            'apis.telnyx.key',
            'apis.retell.key'
        ];

        required.forEach(path => {
            const value = this.get(path);
            if (!value || value.includes('your_') || value.includes('_here')) {
                errors.push(`Missing or invalid configuration: ${path}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    getAll() {
        return { ...this.config };
    }

    reload() {
        this.loadConfig();
    }
}

module.exports = ConfigManager;

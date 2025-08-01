
/**
 * SolarFactsNW Shared Module Index
 * Common utilities and middleware for AI PatchBay SaaS
 */

module.exports = {
    // Utilities
    ConfigManager: require('../core/utils/config-manager'),
    Logger: require('../core/utils/logger'),
    
    // Middleware (to be added)
    // Authentication: require('./middleware/auth'),
    // RateLimit: require('./middleware/rate-limit'),
    
    version: '3.0.0',
    name: 'SolarFactsNW Shared'
};

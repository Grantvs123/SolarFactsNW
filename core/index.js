
/**
 * SolarFactsNW Core Module Index
 * Exports all core functionality for AI PatchBay SaaS Production Powerhouse v3.0
 */

const HealthChecker = require('./health/health-checker');
const StartupMonitor = require('./health/startup-monitor');
const HealthDashboard = require('./health/health-dashboard');
const ConfigManager = require('./utils/config-manager');
const Logger = require('./utils/logger');
const PatchManager = require('./patch-manager');
const EnvironmentResolver = require('./environment-resolver');
const AutoHealSystem = require('./auto-heal');

module.exports = {
    // Health System
    HealthChecker,
    StartupMonitor,
    HealthDashboard,
    
    // Core Utilities
    ConfigManager,
    Logger,
    
    // AI PatchBay SaaS Components
    PatchManager,
    EnvironmentResolver,
    AutoHealSystem,
    
    // Metadata
    version: '3.0.0',
    name: 'SolarFactsNW Production Powerhouse Core',
    transferabilityScore: 9.5,
    
    // Initialization helper
    async initialize(config = {}) {
        Logger.startup('Initializing SolarFactsNW Production Powerhouse v3.0...');
        
        try {
            // Initialize patch management
            const patchManager = new PatchManager(config.patchManager);
            await patchManager.initialize();
            
            // Initialize environment resolution
            const envResolver = new EnvironmentResolver(config.environmentResolver);
            await envResolver.initialize();
            
            // Initialize auto-healing
            const autoHeal = new AutoHealSystem(config.autoHeal);
            await autoHeal.initialize();
            
            Logger.startup('✅ All core systems initialized successfully');
            
            return {
                patchManager,
                envResolver,
                autoHeal,
                success: true
            };
        } catch (error) {
            Logger.error('❌ Core system initialization failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

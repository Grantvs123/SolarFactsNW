
/**
 * SolarFactsNW UI Enhancements
 * Custom JavaScript for enhanced user interface
 */

(function() {
    'use strict';

    // Wait for Node-RED to load
    function waitForNodeRED(callback) {
        if (typeof RED !== 'undefined' && RED.events) {
            callback();
        } else {
            setTimeout(() => waitForNodeRED(callback), 100);
        }
    }

    // Initialize SolarFactsNW UI enhancements
    function initSolarFactsNW() {
        console.log('🌞 Initializing SolarFactsNW UI v3.0');

        // Add custom branding footer
        addBrandingFooter();

        // Add production mode indicator
        addProductionIndicator();

        // Add health status indicator
        addHealthIndicator();

        // Enhance workspace
        enhanceWorkspace();

        // Add keyboard shortcuts
        addKeyboardShortcuts();

        // Initialize health monitoring
        initHealthMonitoring();

        console.log('✅ SolarFactsNW UI enhancements loaded');
    }

    function addBrandingFooter() {
        const footer = document.createElement('div');
        footer.className = 'solarfactsnw-footer';
        footer.innerHTML = '🌞 SolarFactsNW Production Powerhouse v3.0';
        footer.title = 'Click to view system dashboard';
        footer.style.cursor = 'pointer';
        
        footer.addEventListener('click', () => {
            window.open('/dashboard', '_blank');
        });
        
        document.body.appendChild(footer);
    }

    function addProductionIndicator() {
        // Check if running in production mode
        const isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        if (isProduction) {
            const indicator = document.createElement('div');
            indicator.className = 'production-indicator';
            indicator.innerHTML = '🔒 PRODUCTION MODE';
            indicator.title = 'System is running in production mode';
            document.body.appendChild(indicator);
        }
    }

    function addHealthIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'health-indicator healthy';
        indicator.innerHTML = '💚 System Healthy';
        indicator.title = 'Click to view health dashboard';
        indicator.style.cursor = 'pointer';
        
        indicator.addEventListener('click', () => {
            window.open('/health/dashboard', '_blank');
        });
        
        document.body.appendChild(indicator);
        
        // Store reference for updates
        window.solarFactsNW = window.solarFactsNW || {};
        window.solarFactsNW.healthIndicator = indicator;
    }

    function enhanceWorkspace() {
        // Add custom context menu items
        if (typeof RED !== 'undefined' && RED.events) {
            RED.events.on('editor:open', function() {
                // Add SolarFactsNW specific menu items
                console.log('📝 Editor opened - SolarFactsNW enhancements active');
            });
        }
    }

    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+Shift+H - Open health dashboard
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                window.open('/health/dashboard', '_blank');
            }
            
            // Ctrl+Shift+D - Open system dashboard
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                window.open('/dashboard', '_blank');
            }
            
            // Ctrl+Shift+S - Quick save and deploy
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (typeof RED !== 'undefined' && RED.deploy) {
                    RED.deploy.setDeploymentType('full');
                    RED.deploy.deployChanges();
                    showNotification('🚀 Deploying changes...', 'success');
                }
            }
        });
    }

    function initHealthMonitoring() {
        // Check health status every 30 seconds
        setInterval(updateHealthStatus, 30000);
        
        // Initial health check
        setTimeout(updateHealthStatus, 2000);
    }

    async function updateHealthStatus() {
        try {
            const response = await fetch('/health');
            const healthData = await response.json();
            
            const indicator = window.solarFactsNW?.healthIndicator;
            if (!indicator) return;
            
            // Update indicator based on health status
            indicator.className = `health-indicator ${healthData.status}`;
            
            switch (healthData.status) {
                case 'healthy':
                    indicator.innerHTML = '💚 System Healthy';
                    indicator.title = `All services operational (${healthData.summary.healthy}/${healthData.summary.total})`;
                    break;
                case 'degraded':
                    indicator.innerHTML = '💛 System Degraded';
                    indicator.title = `Some services down (${healthData.summary.healthy}/${healthData.summary.total})`;
                    break;
                case 'unhealthy':
                    indicator.innerHTML = '❤️ System Unhealthy';
                    indicator.title = `Multiple services down (${healthData.summary.healthy}/${healthData.summary.total})`;
                    break;
                default:
                    indicator.innerHTML = '❓ Status Unknown';
                    indicator.title = 'Health status unknown';
            }
            
        } catch (error) {
            console.warn('Failed to update health status:', error.message);
            
            const indicator = window.solarFactsNW?.healthIndicator;
            if (indicator) {
                indicator.className = 'health-indicator unhealthy';
                indicator.innerHTML = '⚠️ Health Check Failed';
                indicator.title = 'Unable to check system health';
            }
        }
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#06d6a0' : type === 'error' ? '#e63946' : '#004e89'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            waitForNodeRED(initSolarFactsNW);
        });
    } else {
        waitForNodeRED(initSolarFactsNW);
    }

    // Expose utilities globally
    window.solarFactsNW = window.solarFactsNW || {};
    window.solarFactsNW.showNotification = showNotification;
    window.solarFactsNW.updateHealthStatus = updateHealthStatus;

})();

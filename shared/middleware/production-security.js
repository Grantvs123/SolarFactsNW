
/**
 * SolarFactsNW Production Security Middleware
 * Enhanced security for production deployment
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const AuthMiddleware = require('./auth');

class ProductionSecurity {
    constructor(config = {}) {
        this.config = {
            enableHelmet: config.enableHelmet !== false,
            enableRateLimit: config.enableRateLimit !== false,
            enableAdminProtection: config.enableAdminProtection !== false,
            adminPaths: config.adminPaths || ['/admin', '/settings', '/flows'],
            rateLimitWindow: config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
            rateLimitMax: config.rateLimitMax || 100,
            ...config
        };
        
        this.authMiddleware = new AuthMiddleware();
    }

    // Helmet security headers
    getHelmetConfig() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    connectSrc: ["'self'", "wss:", "ws:"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: false, // Disable for Node-RED compatibility
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        };
    }

    // Rate limiting configuration
    getRateLimitConfig() {
        return {
            windowMs: this.config.rateLimitWindow,
            max: this.config.rateLimitMax,
            message: {
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Skip rate limiting for health checks
                return req.path.startsWith('/health');
            }
        };
    }

    // Admin path protection
    protectAdminPaths() {
        return (req, res, next) => {
            const isAdminPath = this.config.adminPaths.some(path => 
                req.path.startsWith(path)
            );
            
            if (isAdminPath && process.env.NODE_ENV === 'production') {
                // In production, require authentication for admin paths
                return this.authMiddleware.authenticate(req, res, () => {
                    this.authMiddleware.requireAdmin(req, res, next);
                });
            }
            
            next();
        };
    }

    // IP whitelist middleware
    ipWhitelist(allowedIPs = []) {
        return (req, res, next) => {
            if (allowedIPs.length === 0) {
                return next();
            }
            
            const clientIP = req.ip || 
                           req.connection.remoteAddress || 
                           req.socket.remoteAddress ||
                           (req.connection.socket ? req.connection.socket.remoteAddress : null);
            
            if (allowedIPs.includes(clientIP) || allowedIPs.includes('127.0.0.1')) {
                return next();
            }
            
            res.status(403).json({
                error: 'Access denied',
                message: 'Your IP address is not authorized to access this resource'
            });
        };
    }

    // Request logging middleware
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const logData = {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                };
                
                // Log suspicious activity
                if (res.statusCode >= 400) {
                    console.warn('🚨 Suspicious request:', JSON.stringify(logData));
                }
                
                // Log slow requests
                if (duration > 5000) {
                    console.warn('🐌 Slow request:', JSON.stringify(logData));
                }
            });
            
            next();
        };
    }

    // Security headers middleware
    securityHeaders() {
        return (req, res, next) => {
            // Remove server information
            res.removeHeader('X-Powered-By');
            
            // Add custom security headers
            res.setHeader('X-Application', 'SolarFactsNW-v3.0');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            
            // Add CORS headers for API endpoints
            if (req.path.startsWith('/api/')) {
                res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            }
            
            next();
        };
    }

    // Get all security middleware
    getMiddleware(app) {
        const middleware = [];
        
        // Security headers
        middleware.push(this.securityHeaders());
        
        // Helmet security
        if (this.config.enableHelmet) {
            middleware.push(helmet(this.getHelmetConfig()));
        }
        
        // Rate limiting
        if (this.config.enableRateLimit) {
            middleware.push(rateLimit(this.getRateLimitConfig()));
        }
        
        // Request logging
        middleware.push(this.requestLogger());
        
        // Admin path protection
        if (this.config.enableAdminProtection) {
            middleware.push(this.protectAdminPaths());
        }
        
        return middleware;
    }

    // Apply all security middleware to Express app
    applyToApp(app) {
        const middleware = this.getMiddleware(app);
        middleware.forEach(mw => app.use(mw));
        
        console.log('🔒 Production security middleware applied');
        return app;
    }
}

module.exports = ProductionSecurity;


/**
 * SolarFactsNW Authentication Middleware
 * Role-based access control and security
 */

const jwt = require('jsonwebtoken');
const ConfigManager = require('../../core/utils/config-manager');

class AuthMiddleware {
    constructor(config = {}) {
        this.configManager = new ConfigManager();
        this.config = {
            jwtSecret: this.configManager.get('security.jwtSecret'),
            sessionSecret: this.configManager.get('security.sessionSecret'),
            adminPaths: config.adminPaths || ['/admin', '/settings', '/flows'],
            publicPaths: config.publicPaths || ['/health', '/api/health', '/login'],
            ...config
        };
    }

    // JWT token verification
    verifyToken(token) {
        try {
            return jwt.verify(token, this.config.jwtSecret);
        } catch (error) {
            return null;
        }
    }

    // Generate JWT token
    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, this.config.jwtSecret, { expiresIn });
    }

    // Express middleware for authentication
    authenticate(req, res, next) {
        // Skip authentication for public paths
        if (this.isPublicPath(req.path)) {
            return next();
        }

        // Check for token in header or query
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.query.token || 
                     req.session?.token;

        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
        }

        const decoded = this.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token verification failed'
            });
        }

        req.user = decoded;
        next();
    }

    // Admin access control
    requireAdmin(req, res, next) {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required',
                message: 'Insufficient permissions'
            });
        }
        next();
    }

    // Production endpoint protection
    protectProduction(req, res, next) {
        const isProduction = process.env.NODE_ENV === 'production';
        const isAdminPath = this.isAdminPath(req.path);

        if (isProduction && isAdminPath) {
            // In production, admin paths require authentication
            return this.authenticate(req, res, () => {
                this.requireAdmin(req, res, next);
            });
        }

        next();
    }

    // Check if path is public
    isPublicPath(path) {
        return this.config.publicPaths.some(publicPath => 
            path.startsWith(publicPath)
        );
    }

    // Check if path is admin-only
    isAdminPath(path) {
        return this.config.adminPaths.some(adminPath => 
            path.startsWith(adminPath)
        );
    }

    // Session-based authentication for Node-RED editor
    nodeRedAuth(username, password, done) {
        // In production, use environment variables for admin credentials
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'solarfacts2025';

        if (username === adminUser && password === adminPass) {
            done(null, {
                username: adminUser,
                role: 'admin',
                permissions: ['read', 'write']
            });
        } else {
            done(null, false);
        }
    }

    // Generate Node-RED admin auth configuration
    getNodeRedAuthConfig() {
        return {
            type: 'credentials',
            users: [{
                username: process.env.ADMIN_USERNAME || 'admin',
                password: require('bcryptjs').hashSync(
                    process.env.ADMIN_PASSWORD || 'solarfacts2025', 8
                ),
                permissions: '*'
            }],
            default: {
                permissions: 'read'
            }
        };
    }
}

module.exports = AuthMiddleware;

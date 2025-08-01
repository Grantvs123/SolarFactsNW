
/**
 * SolarFactsNW Rate Limiting Middleware
 * API rate limiting and abuse prevention
 */

class RateLimitMiddleware {
    constructor(config = {}) {
        this.config = {
            windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
            maxRequests: config.maxRequests || 100,
            skipSuccessfulRequests: config.skipSuccessfulRequests || false,
            skipFailedRequests: config.skipFailedRequests || false,
            ...config
        };

        this.clients = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), this.config.windowMs);
    }

    // Get client identifier
    getClientId(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               'unknown';
    }

    // Check if request should be rate limited
    shouldLimit(req) {
        const clientId = this.getClientId(req);
        const now = Date.now();
        
        if (!this.clients.has(clientId)) {
            this.clients.set(clientId, {
                requests: 1,
                firstRequest: now,
                lastRequest: now
            });
            return false;
        }

        const client = this.clients.get(clientId);
        
        // Reset if window has passed
        if (now - client.firstRequest > this.config.windowMs) {
            client.requests = 1;
            client.firstRequest = now;
            client.lastRequest = now;
            return false;
        }

        client.requests++;
        client.lastRequest = now;

        return client.requests > this.config.maxRequests;
    }

    // Express middleware
    middleware() {
        return (req, res, next) => {
            if (this.shouldLimit(req)) {
                const clientId = this.getClientId(req);
                const client = this.clients.get(clientId);
                
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Try again in ${Math.ceil(this.config.windowMs / 1000)} seconds.`,
                    retryAfter: Math.ceil((client.firstRequest + this.config.windowMs - Date.now()) / 1000)
                });
                
                return;
            }

            next();
        };
    }

    // Cleanup old entries
    cleanup() {
        const now = Date.now();
        for (const [clientId, client] of this.clients.entries()) {
            if (now - client.lastRequest > this.config.windowMs) {
                this.clients.delete(clientId);
            }
        }
    }

    // Get current stats
    getStats() {
        return {
            totalClients: this.clients.size,
            windowMs: this.config.windowMs,
            maxRequests: this.config.maxRequests
        };
    }

    // Destroy rate limiter
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clients.clear();
    }
}

module.exports = RateLimitMiddleware;

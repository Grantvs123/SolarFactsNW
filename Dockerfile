
# SolarFactsNW Production Powerhouse v3.0
# Multi-stage Docker build for optimized production deployment

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S solarfacts -u 1001

WORKDIR /app

# Copy application files
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=solarfacts:nodejs . .

# Create necessary directories
RUN mkdir -p \
    /app/data \
    /app/logs \
    /app/patches \
    /app/environments \
    && chown -R solarfacts:nodejs /app

# Set environment variables
ENV NODE_ENV=production
ENV APP_PORT=1880
ENV APP_HOST=0.0.0.0

# Expose port
EXPOSE 1880

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:1880/health || exit 1

# Switch to non-root user
USER solarfacts

# Start application with health check
CMD ["node", "scripts/startup-health-check.js", "&&", "npm", "start"]

#!/bin/bash
# SolarFactsNW Health-Aware Startup Script

echo "🚀 Starting SolarFactsNW with Health Monitoring..."

# Run startup health check
node scripts/startup-health-check.js

if [ $? -eq 0 ]; then
    echo "✅ Health check passed - starting Node-RED..."
    npm start
else
    echo "❌ Health check failed - startup aborted"
    exit 1
fi

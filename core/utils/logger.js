
/**
 * SolarFactsNW Enhanced Logger
 * Centralized logging with multiple outputs and levels
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.options = {
            level: options.level || process.env.LOG_LEVEL || 'info',
            enableConsole: options.enableConsole !== false,
            enableFile: options.enableFile !== false,
            logDir: options.logDir || path.join(__dirname, '..', '..', 'logs'),
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            maxFiles: options.maxFiles || 5,
            ...options
        };

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        this.currentLevel = this.levels[this.options.level] || 2;

        // Ensure log directory exists
        if (this.options.enableFile) {
            this.ensureLogDir();
        }
    }

    ensureLogDir() {
        if (!fs.existsSync(this.options.logDir)) {
            fs.mkdirSync(this.options.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    writeToFile(level, formattedMessage) {
        if (!this.options.enableFile) return;

        const logFile = path.join(this.options.logDir, `${level}.log`);
        
        try {
            fs.appendFileSync(logFile, formattedMessage + '\n');
            
            // Check file size and rotate if necessary
            const stats = fs.statSync(logFile);
            if (stats.size > this.options.maxFileSize) {
                this.rotateLogFile(logFile);
            }
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    rotateLogFile(logFile) {
        try {
            const ext = path.extname(logFile);
            const base = path.basename(logFile, ext);
            const dir = path.dirname(logFile);

            // Rotate existing files
            for (let i = this.options.maxFiles - 1; i > 0; i--) {
                const oldFile = path.join(dir, `${base}.${i}${ext}`);
                const newFile = path.join(dir, `${base}.${i + 1}${ext}`);
                
                if (fs.existsSync(oldFile)) {
                    if (i === this.options.maxFiles - 1) {
                        fs.unlinkSync(oldFile); // Delete oldest
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }

            // Move current log to .1
            const rotatedFile = path.join(dir, `${base}.1${ext}`);
            fs.renameSync(logFile, rotatedFile);
        } catch (error) {
            console.error('Failed to rotate log file:', error.message);
        }
    }

    log(level, message, meta = {}) {
        if (this.levels[level] > this.currentLevel) return;

        const formattedMessage = this.formatMessage(level, message, meta);

        // Console output
        if (this.options.enableConsole) {
            const consoleMethod = level === 'error' ? 'error' : 
                                 level === 'warn' ? 'warn' : 'log';
            console[consoleMethod](formattedMessage);
        }

        // File output
        this.writeToFile(level, formattedMessage);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    trace(message, meta = {}) {
        this.log('trace', message, meta);
    }

    // Health check specific logging
    healthCheck(serviceName, status, details = {}) {
        const icon = status === 'healthy' ? '✅' : '❌';
        this.info(`${icon} Health Check - ${serviceName}: ${status}`, details);
    }

    // Startup logging
    startup(message, meta = {}) {
        this.info(`🚀 STARTUP: ${message}`, meta);
    }

    // API logging
    apiCall(service, endpoint, status, responseTime = null) {
        const meta = { service, endpoint, status };
        if (responseTime) meta.responseTime = responseTime;
        
        this.info(`📡 API Call - ${service}${endpoint}: ${status}`, meta);
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
module.exports.Logger = Logger;

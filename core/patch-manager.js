
/**
 * SolarFactsNW Patch Management System
 * Auto-detection and loading of AI PatchBay configurations
 */

const fs = require('fs').promises;
const path = require('path');
const ConfigManager = require('./utils/config-manager');
const Logger = require('./utils/logger');

class PatchManager {
    constructor(config = {}) {
        this.config = {
            patchDir: config.patchDir || path.join(__dirname, '..', 'patches'),
            autoLoad: config.autoLoad !== false,
            watchForChanges: config.watchForChanges !== false,
            backupPatches: config.backupPatches !== false,
            ...config
        };
        
        this.configManager = new ConfigManager();
        this.logger = Logger;
        this.loadedPatches = new Map();
        this.patchWatchers = new Map();
    }

    async initialize() {
        this.logger.info('🔧 Initializing Patch Management System...');
        
        try {
            // Ensure patch directory exists
            await this.ensurePatchDirectory();
            
            // Load existing patches
            if (this.config.autoLoad) {
                await this.loadAllPatches();
            }
            
            // Start watching for changes
            if (this.config.watchForChanges) {
                await this.startWatching();
            }
            
            this.logger.info('✅ Patch Management System initialized');
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize Patch Management System:', error.message);
            return false;
        }
    }

    async ensurePatchDirectory() {
        try {
            await fs.mkdir(this.config.patchDir, { recursive: true });
            
            // Create subdirectories for different patch types
            const subDirs = ['flows', 'nodes', 'configs', 'templates', 'backups'];
            for (const subDir of subDirs) {
                await fs.mkdir(path.join(this.config.patchDir, subDir), { recursive: true });
            }
            
            this.logger.debug('📁 Patch directories ensured');
        } catch (error) {
            throw new Error(`Failed to create patch directories: ${error.message}`);
        }
    }

    async detectPatches() {
        this.logger.info('🔍 Detecting available patches...');
        
        try {
            const patches = [];
            const patchTypes = ['flows', 'nodes', 'configs', 'templates'];
            
            for (const type of patchTypes) {
                const typeDir = path.join(this.config.patchDir, type);
                
                try {
                    const files = await fs.readdir(typeDir);
                    
                    for (const file of files) {
                        if (file.endsWith('.json') || file.endsWith('.js')) {
                            const filePath = path.join(typeDir, file);
                            const stats = await fs.stat(filePath);
                            
                            patches.push({
                                name: path.basename(file, path.extname(file)),
                                type: type,
                                file: file,
                                path: filePath,
                                size: stats.size,
                                modified: stats.mtime,
                                extension: path.extname(file)
                            });
                        }
                    }
                } catch (error) {
                    // Directory might not exist, skip
                    continue;
                }
            }
            
            this.logger.info(`📦 Detected ${patches.length} patches`);
            return patches;
        } catch (error) {
            this.logger.error('❌ Failed to detect patches:', error.message);
            return [];
        }
    }

    async loadPatch(patchInfo) {
        this.logger.info(`📥 Loading patch: ${patchInfo.name} (${patchInfo.type})`);
        
        try {
            const content = await fs.readFile(patchInfo.path, 'utf8');
            
            let patchData;
            if (patchInfo.extension === '.json') {
                patchData = JSON.parse(content);
            } else if (patchInfo.extension === '.js') {
                // For JavaScript patches, require them
                delete require.cache[require.resolve(patchInfo.path)];
                patchData = require(patchInfo.path);
            }
            
            // Validate patch structure
            const validation = this.validatePatch(patchData, patchInfo.type);
            if (!validation.valid) {
                throw new Error(`Invalid patch structure: ${validation.errors.join(', ')}`);
            }
            
            // Store loaded patch
            this.loadedPatches.set(patchInfo.name, {
                ...patchInfo,
                data: patchData,
                loadedAt: new Date(),
                status: 'loaded'
            });
            
            this.logger.info(`✅ Successfully loaded patch: ${patchInfo.name}`);
            return patchData;
        } catch (error) {
            this.logger.error(`❌ Failed to load patch ${patchInfo.name}:`, error.message);
            
            // Store failed patch info
            this.loadedPatches.set(patchInfo.name, {
                ...patchInfo,
                error: error.message,
                loadedAt: new Date(),
                status: 'failed'
            });
            
            throw error;
        }
    }

    async loadAllPatches() {
        this.logger.info('📦 Loading all available patches...');
        
        const patches = await this.detectPatches();
        const results = {
            loaded: 0,
            failed: 0,
            total: patches.length
        };
        
        for (const patch of patches) {
            try {
                await this.loadPatch(patch);
                results.loaded++;
            } catch (error) {
                results.failed++;
            }
        }
        
        this.logger.info(`📊 Patch loading complete: ${results.loaded}/${results.total} loaded, ${results.failed} failed`);
        return results;
    }

    validatePatch(patchData, type) {
        const errors = [];
        
        // Common validation
        if (!patchData || typeof patchData !== 'object') {
            errors.push('Patch data must be an object');
            return { valid: false, errors };
        }
        
        // Type-specific validation
        switch (type) {
            case 'flows':
                if (!Array.isArray(patchData) && !patchData.flows) {
                    errors.push('Flow patches must contain flows array');
                }
                break;
                
            case 'nodes':
                if (!patchData.nodes && !patchData.module) {
                    errors.push('Node patches must contain nodes or module definition');
                }
                break;
                
            case 'configs':
                if (!patchData.config && !patchData.settings) {
                    errors.push('Config patches must contain config or settings');
                }
                break;
                
            case 'templates':
                if (!patchData.template && !patchData.components) {
                    errors.push('Template patches must contain template or components');
                }
                break;
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    async backupPatch(patchName) {
        if (!this.config.backupPatches) return;
        
        const patch = this.loadedPatches.get(patchName);
        if (!patch) {
            throw new Error(`Patch ${patchName} not found`);
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.config.patchDir, 'backups');
        const backupFile = path.join(backupDir, `${patchName}_${timestamp}${patch.extension}`);
        
        try {
            const originalContent = await fs.readFile(patch.path, 'utf8');
            await fs.writeFile(backupFile, originalContent);
            
            this.logger.info(`💾 Backed up patch ${patchName} to ${backupFile}`);
        } catch (error) {
            this.logger.error(`❌ Failed to backup patch ${patchName}:`, error.message);
        }
    }

    async startWatching() {
        this.logger.info('👀 Starting patch file watching...');
        
        const chokidar = require('chokidar');
        const watcher = chokidar.watch(this.config.patchDir, {
            ignored: /backups/,
            persistent: true,
            ignoreInitial: true
        });
        
        watcher.on('add', async (filePath) => {
            this.logger.info(`📁 New patch file detected: ${filePath}`);
            await this.handleFileChange(filePath, 'add');
        });
        
        watcher.on('change', async (filePath) => {
            this.logger.info(`📝 Patch file changed: ${filePath}`);
            await this.handleFileChange(filePath, 'change');
        });
        
        watcher.on('unlink', async (filePath) => {
            this.logger.info(`🗑️ Patch file removed: ${filePath}`);
            await this.handleFileChange(filePath, 'remove');
        });
        
        this.patchWatcher = watcher;
    }

    async handleFileChange(filePath, changeType) {
        try {
            const relativePath = path.relative(this.config.patchDir, filePath);
            const pathParts = relativePath.split(path.sep);
            
            if (pathParts.length < 2) return;
            
            const type = pathParts[0];
            const fileName = pathParts[pathParts.length - 1];
            const patchName = path.basename(fileName, path.extname(fileName));
            
            switch (changeType) {
                case 'add':
                case 'change':
                    // Backup existing patch if it exists
                    if (this.loadedPatches.has(patchName)) {
                        await this.backupPatch(patchName);
                    }
                    
                    // Reload the patch
                    const patchInfo = {
                        name: patchName,
                        type: type,
                        file: fileName,
                        path: filePath,
                        extension: path.extname(fileName)
                    };
                    
                    await this.loadPatch(patchInfo);
                    break;
                    
                case 'remove':
                    this.loadedPatches.delete(patchName);
                    this.logger.info(`🗑️ Removed patch from memory: ${patchName}`);
                    break;
            }
        } catch (error) {
            this.logger.error(`❌ Failed to handle file change for ${filePath}:`, error.message);
        }
    }

    getLoadedPatches() {
        return Array.from(this.loadedPatches.values());
    }

    getPatchByName(name) {
        return this.loadedPatches.get(name);
    }

    async reloadPatch(name) {
        const patch = this.loadedPatches.get(name);
        if (!patch) {
            throw new Error(`Patch ${name} not found`);
        }
        
        await this.backupPatch(name);
        return await this.loadPatch(patch);
    }

    async unloadPatch(name) {
        const patch = this.loadedPatches.get(name);
        if (!patch) {
            throw new Error(`Patch ${name} not found`);
        }
        
        this.loadedPatches.delete(name);
        this.logger.info(`🗑️ Unloaded patch: ${name}`);
    }

    getStats() {
        const patches = this.getLoadedPatches();
        const stats = {
            total: patches.length,
            byType: {},
            byStatus: {},
            totalSize: 0
        };
        
        patches.forEach(patch => {
            // Count by type
            stats.byType[patch.type] = (stats.byType[patch.type] || 0) + 1;
            
            // Count by status
            stats.byStatus[patch.status] = (stats.byStatus[patch.status] || 0) + 1;
            
            // Sum total size
            stats.totalSize += patch.size || 0;
        });
        
        return stats;
    }

    async destroy() {
        if (this.patchWatcher) {
            await this.patchWatcher.close();
        }
        
        this.loadedPatches.clear();
        this.logger.info('🔧 Patch Management System destroyed');
    }
}

module.exports = PatchManager;

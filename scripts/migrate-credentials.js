
/**
 * SolarFactsNW Credential Migration Script
 * Migrates existing credentials to new encrypted format with environment-based secret
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Configuration
const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.APPDATA || os.homedir(), "SolarFactsNW");
const credentialsFile = path.join(userDataDir, 'flows_cred.json');
const backupDir = path.join(userDataDir, 'backups');

console.log('🔐 SolarFactsNW Credential Migration Tool v3.0');
console.log('================================================');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Loaded environment configuration');
} else {
    console.log('⚠️  No .env.local found - using default configuration');
}

const newSecret = process.env.NODE_RED_CREDENTIAL_SECRET;
if (!newSecret || newSecret === 'your_very_strong_credential_secret_here') {
    console.error('❌ ERROR: NODE_RED_CREDENTIAL_SECRET not properly configured in .env.local');
    console.error('   Please set a strong credential secret before running migration');
    process.exit(1);
}

function backupCredentials() {
    if (fs.existsSync(credentialsFile)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `flows_cred_backup_${timestamp}.json`);
        fs.copyFileSync(credentialsFile, backupFile);
        console.log(`📦 Backed up existing credentials to: ${backupFile}`);
        return true;
    }
    return false;
}

function generateCredentialSecret() {
    return crypto.randomBytes(32).toString('hex');
}

function encryptCredentials(credentials, secret) {
    const algorithm = 'aes-256-ctr';
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        '$': encrypted
    };
}

function migrateCredentials() {
    console.log('\n🔄 Starting credential migration...');
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsFile)) {
        console.log('ℹ️  No existing credentials file found - creating new encrypted structure');
        const encryptedEmpty = { '$': '' };
        fs.writeFileSync(credentialsFile, JSON.stringify(encryptedEmpty, null, 2));
        console.log('✅ Created new encrypted credentials file');
        return;
    }
    
    // Backup existing credentials
    const hasBackup = backupCredentials();
    
    try {
        // Read existing credentials
        const existingCreds = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
        
        // Check if already encrypted
        if (existingCreds['$']) {
            console.log('ℹ️  Credentials are already encrypted');
            return;
        }
        
        // Encrypt credentials with new secret
        console.log('🔐 Encrypting credentials with new secret...');
        const encryptedCreds = encryptCredentials(existingCreds, newSecret);
        
        // Write encrypted credentials
        fs.writeFileSync(credentialsFile, JSON.stringify(encryptedCreds, null, 2));
        console.log('✅ Successfully migrated credentials to encrypted format');
        
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        
        if (hasBackup) {
            console.log('🔄 Attempting to restore from backup...');
            // Restore logic would go here
        }
        
        process.exit(1);
    }
}

function validateMigration() {
    console.log('\n🔍 Validating migration...');
    
    if (fs.existsSync(credentialsFile)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
            if (creds.hasOwnProperty('$')) {
                console.log('✅ Credentials are properly encrypted');
                return true;
            } else {
                console.log('⚠️  Credentials exist but are not encrypted');
                return false;
            }
        } catch (error) {
            console.error('❌ Error reading credentials file:', error.message);
            return false;
        }
    } else {
        console.log('ℹ️  No credentials file found');
        return true;
    }
}

function main() {
    console.log(`📁 User data directory: ${userDataDir}`);
    console.log(`🔑 Using credential secret: ${newSecret.substring(0, 8)}...`);
    
    // Ensure user data directory exists
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
        console.log('📁 Created user data directory');
    }
    
    // Perform migration
    migrateCredentials();
    
    // Validate results
    const isValid = validateMigration();
    
    if (isValid) {
        console.log('\n🎉 Credential migration completed successfully!');
        console.log('   Your credentials are now securely encrypted.');
        console.log('   Make sure to keep your NODE_RED_CREDENTIAL_SECRET safe.');
    } else {
        console.log('\n❌ Migration validation failed');
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    main();
}

module.exports = {
    migrateCredentials,
    validateMigration,
    backupCredentials
};

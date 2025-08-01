
/**
 * SolarFactsNW Secret Generation Utility
 * Generates secure secrets for production deployment
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 SolarFactsNW Secret Generator v3.0');
console.log('=====================================');

function generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateJWT() {
    return crypto.randomBytes(64).toString('base64');
}

function generateSessionSecret() {
    return crypto.randomBytes(32).toString('base64');
}

function updateEnvFile() {
    const envPath = path.join(__dirname, '..', '.env.local');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local file not found. Please create it first.');
        return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Generate new secrets
    const credentialSecret = generateSecret(32);
    const sessionSecret = generateSessionSecret();
    const jwtSecret = generateJWT();
    
    // Replace placeholder values
    envContent = envContent.replace(
        /NODE_RED_CREDENTIAL_SECRET=.*/,
        `NODE_RED_CREDENTIAL_SECRET=${credentialSecret}`
    );
    
    envContent = envContent.replace(
        /SESSION_SECRET=.*/,
        `SESSION_SECRET=${sessionSecret}`
    );
    
    envContent = envContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET=${jwtSecret}`
    );
    
    // Write updated content
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Generated and updated secrets in .env.local:');
    console.log(`   🔑 Credential Secret: ${credentialSecret.substring(0, 16)}...`);
    console.log(`   🎫 Session Secret: ${sessionSecret.substring(0, 16)}...`);
    console.log(`   🔐 JWT Secret: ${jwtSecret.substring(0, 16)}...`);
    console.log('\n⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!');
}

function main() {
    updateEnvFile();
}

if (require.main === module) {
    main();
}

module.exports = {
    generateSecret,
    generateJWT,
    generateSessionSecret,
    updateEnvFile
};

const path = require('path');
const fs = require('fs');

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${env}`);

// Load environment-specific .env file if it exists
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
  console.log(`✅ Loaded environment variables from .env.${env}`);
} else {
  // Fallback to default .env file
  require('dotenv').config();
  if (fs.existsSync(path.join(__dirname, '../../', '.env'))) {
    console.log('✅ Loaded environment variables from .env');
  } else {
    console.warn(`⚠️  No .env.${env} or .env file found`);
  }
}

const { getEnvironmentConfig } = require('../../config/environments');
const envConfig = getEnvironmentConfig();

console.log(`\n🚀 Backend Environment: ${envConfig.name.toUpperCase()}`);
console.log(`   Port: ${envConfig.port}`);
console.log(`   Firebase Project: ${envConfig.firebase.projectId}\n`);

module.exports = {
  PORT: envConfig.port,
  allowedOrigins: envConfig.allowedOrigins,
  environment: envConfig.name,
};


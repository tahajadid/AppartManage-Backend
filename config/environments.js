/**
 * Environment Configuration
 * Defines environment-specific settings for development, preproduction, and production
 */

const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  if (['development', 'preproduction', 'production'].includes(env)) {
    return env;
  }
  return 'development';
};

const getEnvironmentConfig = () => {
  const env = getCurrentEnvironment();
  
  const configs = {
    development: {
      name: 'development',
      port: process.env.PORT || 4000,
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,exp://localhost:8081,exp://192.168.*')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      firebase: {
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/appartmanage-dev-firebase-adminsdk.json',
        serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        projectId: process.env.FIREBASE_PROJECT_ID || 'appartmanage-dev',
      },
    },
    preproduction: {
      name: 'preproduction',
      port: process.env.PORT || 4001,
      allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      firebase: {
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/appartmanage-preprod-firebase-adminsdk.json',
        serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        projectId: process.env.FIREBASE_PROJECT_ID || 'appartmanage-preprod',
      },
    },
    production: {
      name: 'production',
      port: process.env.PORT || 4000,
      allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      firebase: {
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/appartmanage-firebase-adminsdk.json',
        serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        projectId: process.env.FIREBASE_PROJECT_ID || 'appartmanage',
      },
    },
  };

  return configs[env] || configs.development;
};

module.exports = {
  getCurrentEnvironment,
  getEnvironmentConfig,
};


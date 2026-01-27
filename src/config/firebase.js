const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getEnvironmentConfig } = require('../../config/environments');

let appInitialized = false;

const loadServiceAccount = () => {
  const envConfig = getEnvironmentConfig();
  
  // Priority: 1. Environment variable JSON, 2. Environment variable path, 3. Config file path
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const configPath = envConfig.firebase.serviceAccountPath;

  if (json) {
    console.log('📦 Loading Firebase service account from FIREBASE_SERVICE_ACCOUNT_JSON');
    return JSON.parse(json);
  }

  // Try environment variable path first, then config path
  const serviceAccountPath = envPath || configPath;
  const fullPath = path.isAbsolute(serviceAccountPath) 
    ? serviceAccountPath 
    : path.join(__dirname, '../../', serviceAccountPath);

  if (fs.existsSync(fullPath)) {
    console.log(`📦 Loading Firebase service account from: ${serviceAccountPath}`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  }

  throw new Error(
    `Missing Firebase service account for environment: ${envConfig.name}. ` +
    `Expected file: ${serviceAccountPath} ` +
    `(resolved to: ${fullPath}). ` +
    `Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.`
  );
};

const initFirebaseApp = () => {
  if (appInitialized && admin.apps.length) {
    return admin.app();
  }

  const envConfig = getEnvironmentConfig();
  const serviceAccount = loadServiceAccount();

  console.log(`🔥 Initializing Firebase Admin SDK for: ${envConfig.firebase.projectId}`);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  appInitialized = true;
  console.log(`✅ Firebase Admin SDK initialized successfully\n`);
  return admin.app();
};

const getMessaging = () => {
  const app = initFirebaseApp();
  return admin.messaging(app);
};

const getFirestore = () => {
  const app = initFirebaseApp();
  return admin.firestore(app);
};

module.exports = {
  admin,
  getMessaging,
  getFirestore,
};


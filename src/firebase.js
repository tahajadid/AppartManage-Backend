const fs = require('fs');
const admin = require('firebase-admin');

let appInitialized = false;

const loadServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (json) {
    return JSON.parse(json);
  }

  if (path) {
    const fileContents = fs.readFileSync(path, 'utf8');
    return JSON.parse(fileContents);
  }

  throw new Error(
    'Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.'
  );
};

const initFirebaseApp = () => {
  if (appInitialized && admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  appInitialized = true;
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


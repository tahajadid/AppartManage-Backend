const { getMessaging } = require('../config/firebase');
const { getUserToken, clearUserToken } = require('../models/userModel');

const buildNotificationPayload = ({ title, body, data }) => {
  const notification =
    title || body
      ? {
          title,
          body,
        }
      : undefined;

  const stringifiedData = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] =
        typeof value === 'string' ? value : JSON.stringify(value ?? '');
    }
  }

  return {
    notification,
    data: stringifiedData,
    android: { priority: 'high' },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default' } },
    },
  };
};

async function sendToToken(token, payload) {
  const operation = 'sendToToken';
  console.log(`\n🔧 [SERVICE] ${operation}`);
  console.log(`   Token: ${token ? `${token.substring(0, 30)}...` : 'null'}`);
  console.log(`   Payload:`, {
    title: payload.title,
    body: payload.body,
    data: JSON.stringify(payload.data || {}),
  });
  
  try {
    const messaging = getMessaging();
    const messageId = await messaging.send({
      token,
      ...buildNotificationPayload(payload),
    });
    console.log(`✅ [SERVICE] ${operation} - Success. MessageId: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error(`❌ [SERVICE] ${operation} - Error:`, {
      error: error.message || error,
      code: error.code,
    });
    throw error;
  }
}

async function sendToUser(userId, payload) {
  const { getEnvironmentConfig } = require('../config/environments');
  const envConfig = getEnvironmentConfig();
  
  console.log(`🔍 [NotificationService] Looking up token for user: ${userId}`);
  console.log(`   Backend Firebase Project: ${envConfig.firebase.projectId}`);
  
  const token = await getUserToken(userId);
  if (!token) {
    console.error(`❌ [NotificationService] No token found for user: ${userId}`);
    const err = new Error('No token registered for user');
    err.code = 'no-token';
    throw err;
  }
  
  console.log(`✅ [NotificationService] Token found for user: ${userId}`);
  console.log(`   Token length: ${token.length}, starts with: ${token.substring(0, 20)}...`);
  console.log(`📤 [NotificationService] Sending notification:`, {
    title: payload.title,
    body: payload.body,
    data: JSON.stringify(payload.data || {}),
  });
  console.log(`   Using Firebase project: ${envConfig.firebase.projectId}`);
  
  try {
    const messaging = getMessaging();
    const messageId = await messaging.send({
      token,
      ...buildNotificationPayload(payload),
    });
    console.log(`✅ [NotificationService] Notification sent successfully. MessageId: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error(`❌ [NotificationService] Firebase messaging error:`, {
      code: error.code,
      message: error.message,
      userId,
      backendProjectId: envConfig.firebase.projectId,
    });
    
    if (error.code === 'messaging/mismatched-credential') {
      console.error(`❌ [NotificationService] SENDER ID MISMATCH DETECTED!`);
      console.error(`   This means the FCM token was registered with a different Firebase project.`);
      console.error(`   Backend is using project: ${envConfig.firebase.projectId}`);
      console.error(`   The mobile app must be using the SAME Firebase project.`);
      console.error(`   SOLUTION:`);
      console.error(`   1. Check your frontend .env.production file:`);
      console.error(`      EXPO_PUBLIC_FIREBASE_PROD_PROJECT_ID should match: ${envConfig.firebase.projectId}`);
      console.error(`   2. Check your Render environment variables:`);
      console.error(`      FIREBASE_PROJECT_ID should be: ${envConfig.firebase.projectId}`);
      console.error(`   3. Make sure the FIREBASE_SERVICE_ACCOUNT_JSON in Render is from the SAME Firebase project`);
    }
    
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      console.warn(`⚠️ [NotificationService] Invalid token, clearing for user: ${userId}`);
      await clearUserToken(userId);
    }
    throw error;
  }
}

async function sendToTopic(topic, payload) {
  const operation = 'sendToTopic';
  console.log(`\n🔧 [SERVICE] ${operation}`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Payload:`, {
    title: payload.title,
    body: payload.body,
    data: JSON.stringify(payload.data || {}),
  });
  
  try {
    const messaging = getMessaging();
    const messageId = await messaging.send({
      topic,
      ...buildNotificationPayload(payload),
    });
    console.log(`✅ [SERVICE] ${operation} - Success. MessageId: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error(`❌ [SERVICE] ${operation} - Error:`, {
      error: error.message || error,
      code: error.code,
    });
    throw error;
  }
}

module.exports = {
  buildNotificationPayload,
  sendToToken,
  sendToUser,
  sendToTopic,
};


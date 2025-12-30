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
  const messaging = getMessaging();
  return messaging.send({
    token,
    ...buildNotificationPayload(payload),
  });
}

async function sendToUser(userId, payload) {
  const token = await getUserToken(userId);
  if (!token) {
    const err = new Error('No token registered for user');
    err.code = 'no-token';
    throw err;
  }
  try {
    const messaging = getMessaging();
    return await messaging.send({
      token,
      ...buildNotificationPayload(payload),
    });
  } catch (error) {
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      await clearUserToken(userId);
    }
    throw error;
  }
}

async function sendToTopic(topic, payload) {
  const messaging = getMessaging();
  return messaging.send({
    topic,
    ...buildNotificationPayload(payload),
  });
}

module.exports = {
  buildNotificationPayload,
  sendToToken,
  sendToUser,
  sendToTopic,
};


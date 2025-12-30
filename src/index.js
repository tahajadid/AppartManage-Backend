require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { getMessaging, getFirestore } = require('./firebase');

const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const firestore = getFirestore();
const app = express();
app.use(express.json());
app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: allowedOrigins,
        }
      : undefined
  )
);

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

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'notifications-backend' });
});

app.post('/api/devices', async (req, res) => {
  const { userId, token, platform } = req.body || {};
  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' });
  }
  try {
    const userRef = firestore.collection('users').doc(String(userId));
    await userRef.set(
      {
        fcmToken: String(token),
        fcmTokenUpdatedAt: new Date().toISOString(),
        platform: platform || 'unknown',
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error saving token to user doc', error);
    return res.status(500).json({ error: 'Failed to save token' });
  }
});

app.post('/api/notify/token', async (req, res) => {
  const { token, title, body, data } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    const messaging = getMessaging();
    const response = await messaging.send({
      token,
      ...buildNotificationPayload({ title, body, data }),
    });
    res.json({ ok: true, messageId: response });
  } catch (error) {
    console.error('Error sending to token', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify/user', async (req, res) => {
  const { userId, title, body, data } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const userRef = firestore.collection('users').doc(String(userId));
    const snap = await userRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = snap.data() || {};
    const token = userData.fcmToken;
    if (!token) {
      return res.status(404).json({ error: 'No token registered for user' });
    }

    const messaging = getMessaging();
    const response = await messaging.send({
      token,
      ...buildNotificationPayload({ title, body, data }),
    });
    return res.json({ ok: true, messageId: response });
  } catch (error) {
    console.error('Error sending to user token', error);
    // Handle invalid/expired tokens: clear so client re-registers on next app foreground
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      try {
        const userRef = firestore.collection('users').doc(String(req.body.userId));
        await userRef.update({ fcmToken: admin.firestore.FieldValue.delete() });
      } catch (cleanupErr) {
        console.error('Failed to clear invalid token', cleanupErr);
      }
    }
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify/topic', async (req, res) => {
  const { topic, title, body, data } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: 'topic is required' });
  }

  try {
    const messaging = getMessaging();
    const messageId = await messaging.send({
      topic,
      ...buildNotificationPayload({ title, body, data }),
    });
    res.json({ ok: true, messageId });
  } catch (error) {
    console.error('Error sending to topic', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Notification backend running on port ${PORT}`);
});


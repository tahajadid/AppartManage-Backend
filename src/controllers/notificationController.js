const { sendToToken, sendToUser, sendToTopic } = require('../services/notificationService');

async function notifyToken(req, res) {
  const { token, title, body, data } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }
  try {
    const messageId = await sendToToken(token, { title, body, data });
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error('Error sending to token', error);
    return res.status(500).json({ error: error.message });
  }
}

async function notifyUser(req, res) {
  const { userId, title, body, data } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  try {
    const messageId = await sendToUser(userId, { title, body, data });
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error('Error sending to user token', error);
    if (error.code === 'no-token') {
      return res.status(404).json({ error: 'No token registered for user' });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function notifyTopic(req, res) {
  const { topic, title, body, data } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: 'topic is required' });
  }
  try {
    const messageId = await sendToTopic(topic, { title, body, data });
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error('Error sending to topic', error);
    return res.status(500).json({ error: error.message });
  }
}

function health(_req, res) {
  res.json({ ok: true, service: 'notifications-backend' });
}

module.exports = {
  notifyToken,
  notifyUser,
  notifyTopic,
  health,
};


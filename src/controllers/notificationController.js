const { sendToToken, sendToUser, sendToTopic } = require('../services/notificationService');

async function notifyToken(req, res) {
  const operation = 'notifyToken';
  const { token, title, body, data } = req.body || {};
  
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   Payload:`, {
    token: token ? `${token.substring(0, 20)}...` : null,
    title,
    body,
    data: JSON.stringify(data || {}),
  });
  
  if (!token) {
    console.error(`❌ [${operation}] Validation failed: token is required`);
    return res.status(400).json({ error: 'token is required' });
  }
  
  try {
    console.log(`📤 [${operation}] Calling sendToToken service...`);
    const messageId = await sendToToken(token, { title, body, data });
    console.log(`✅ [${operation}] Success. MessageId: ${messageId}`);
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error(`❌ [${operation}] Error:`, {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: error.message });
  }
}

async function notifyUser(req, res) {
  const { userId, title, body, data } = req.body || {};
  
  console.log('📨 [Backend] Received notification request:', {
    userId,
    title,
    body,
    data: JSON.stringify(data || {}),
    timestamp: new Date().toISOString(),
  });
  
  if (!userId) {
    console.error('❌ [Backend] Missing userId in request');
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    console.log(`📤 [Backend] Attempting to send notification to user: ${userId}`);
    const messageId = await sendToUser(userId, { title, body, data });
    console.log(`✅ [Backend] Notification sent successfully. MessageId: ${messageId}`);
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error('❌ [Backend] Error sending notification:', {
      error: error.message || error,
      code: error.code,
      userId,
      stack: error.stack,
    });
    
    if (error.code === 'no-token') {
      console.warn(`⚠️ [Backend] No token registered for user: ${userId}`);
      return res.status(404).json({ error: 'No token registered for user' });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function notifyTopic(req, res) {
  const operation = 'notifyTopic';
  const { topic, title, body, data } = req.body || {};
  
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   Payload:`, {
    topic,
    title,
    body,
    data: JSON.stringify(data || {}),
  });
  
  if (!topic) {
    console.error(`❌ [${operation}] Validation failed: topic is required`);
    return res.status(400).json({ error: 'topic is required' });
  }
  
  try {
    console.log(`📤 [${operation}] Calling sendToTopic service...`);
    const messageId = await sendToTopic(topic, { title, body, data });
    console.log(`✅ [${operation}] Success. MessageId: ${messageId}`);
    return res.json({ ok: true, messageId });
  } catch (error) {
    console.error(`❌ [${operation}] Error:`, {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: error.message });
  }
}

function health(req, res) {
  const operation = 'health';
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   No payload required`);
  const response = { ok: true, service: 'notifications-backend' };
  console.log(`✅ [${operation}] Success`);
  return res.json(response);
}

module.exports = {
  notifyToken,
  notifyUser,
  notifyTopic,
  health,
};


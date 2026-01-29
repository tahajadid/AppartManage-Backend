const { saveUserToken } = require('../models/userModel');

async function registerDevice(req, res) {
  const operation = 'registerDevice';
  const { userId, token, platform } = req.body || {};
  
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   Payload:`, {
    userId,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? `${token.substring(0, 30)}...` : null,
    platform: platform || 'unknown',
  });
  
  if (!userId || !token) {
    console.error(`❌ [${operation}] Validation failed:`, {
      userId: !!userId,
      token: !!token,
      missingFields: [!userId && 'userId', !token && 'token'].filter(Boolean),
    });
    return res.status(400).json({ error: 'userId and token are required' });
  }
  
  try {
    console.log(`📤 [${operation}] Calling saveUserToken service...`);
    await saveUserToken(userId, token, platform || 'unknown');
    console.log(`✅ [${operation}] Token saved successfully for user: ${userId}`);
    return res.json({ ok: true });
  } catch (error) {
    console.error(`❌ [${operation}] Error:`, {
      error: error.message || error,
      userId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to save token' });
  }
}

module.exports = {
  registerDevice,
};


const { saveUserToken } = require('../models/userModel');

async function registerDevice(req, res) {
  const { userId, token, platform } = req.body || {};
  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' });
  }
  try {
    await saveUserToken(userId, token, platform || 'unknown');
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error saving token to user doc', error);
    return res.status(500).json({ error: 'Failed to save token' });
  }
}

module.exports = {
  registerDevice,
};


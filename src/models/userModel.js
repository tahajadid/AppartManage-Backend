const { getFirestore, admin } = require('../config/firebase');

const firestore = getFirestore();
const userRef = (userId) => firestore.collection('users').doc(String(userId));

async function saveUserToken(userId, token, platform) {
  console.log(`💾 [UserModel] Saving token for user: ${userId}`, {
    tokenLength: token ? String(token).length : 0,
    platform: platform || 'unknown',
  });
  
  await userRef(userId).set(
    {
      fcmToken: String(token),
      fcmTokenUpdatedAt: new Date().toISOString(),
      platform: platform || 'unknown',
    },
    { merge: true }
  );
  
  console.log(`✅ [UserModel] Token saved successfully for user: ${userId}`);
}

async function getUserToken(userId) {
  console.log(`🔍 [UserModel] Fetching token for user: ${userId}`);
  const snap = await userRef(userId).get();
  if (!snap.exists) {
    console.warn(`⚠️ [UserModel] User document not found: ${userId}`);
    return null;
  }
  const data = snap.data() || {};
  const token = data.fcmToken || null;
  if (token) {
    console.log(`✅ [UserModel] Token found for user: ${userId} (length: ${token.length})`);
  } else {
    console.warn(`⚠️ [UserModel] No FCM token in user document: ${userId}`);
  }
  return token;
}

async function clearUserToken(userId) {
  try {
    await userRef(userId).update({
      fcmToken: admin.firestore.FieldValue.delete(),
    });
  } catch (e) {
    // ignore if doc doesn't exist
  }
}

module.exports = {
  saveUserToken,
  getUserToken,
  clearUserToken,
};


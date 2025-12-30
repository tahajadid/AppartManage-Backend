const { getFirestore, admin } = require('../config/firebase');

const firestore = getFirestore();
const userRef = (userId) => firestore.collection('users').doc(String(userId));

async function saveUserToken(userId, token, platform) {
  await userRef(userId).set(
    {
      fcmToken: String(token),
      fcmTokenUpdatedAt: new Date().toISOString(),
      platform: platform || 'unknown',
    },
    { merge: true }
  );
}

async function getUserToken(userId) {
  const snap = await userRef(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return data.fcmToken || null;
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


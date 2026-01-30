const { getFirestore, admin } = require('../config/firebase');

const firestore = getFirestore();
const userRef = (userId) => firestore.collection('users').doc(String(userId));

async function saveUserToken(userId, token, platform) {
  console.log(`💾 [UserModel] Saving token for user: ${userId}`, {
    tokenLength: token ? String(token).length : 0,
    platform: platform || 'unknown',
  });
  
  // Check if user document exists and get existing data to preserve all fields
  const userDoc = await userRef(userId).get();
  const userExists = userDoc.exists;
  const existingData = userExists ? userDoc.data() : {};
  
  if (!userExists) {
    console.log(`⚠️ [UserModel] User document does not exist, creating it for: ${userId}`);
  } else {
    console.log(`📋 [UserModel] Preserving existing user fields:`, Object.keys(existingData).filter(k => !['fcmToken', 'fcmTokenUpdatedAt', 'platform'].includes(k)));
  }
  
  // Use set with merge: true to preserve all existing fields and update token-related fields
  await userRef(userId).set(
    {
      uid: String(userId),
      fcmToken: String(token),
      fcmTokenUpdatedAt: new Date().toISOString(),
      platform: platform || 'unknown',
      // Preserve all other existing fields (role, apartmentId, email, name, etc.)
      ...(existingData.role ? { role: existingData.role } : {}),
      ...(existingData.apartmentId ? { apartmentId: existingData.apartmentId } : {}),
      ...(existingData.email ? { email: existingData.email } : {}),
      ...(existingData.name ? { name: existingData.name } : {}),
      ...(existingData.fullName ? { fullName: existingData.fullName } : {}),
      ...(existingData.phoneNumber ? { phoneNumber: existingData.phoneNumber } : {}),
      ...(existingData.monthlyFee !== undefined ? { monthlyFee: existingData.monthlyFee } : {}),
      ...(existingData.onboardingCompleted !== undefined ? { onboardingCompleted: existingData.onboardingCompleted } : {}),
      ...(userExists ? {} : {
        createdAt: existingData.createdAt || new Date().toISOString(),
      }),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  
  console.log(`✅ [UserModel] Token saved successfully for user: ${userId}${!userExists ? ' (document created)' : ' (document updated)'}`);
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


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

async function testNotificationToSyndic(req, res) {
  const operation = 'testNotificationToSyndic';
  const { userId, apartmentId } = req.body || {};
  
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   Payload:`, {
    userId,
    apartmentId,
  });
  
  if (!userId || !apartmentId) {
    console.error(`❌ [${operation}] Validation failed:`, {
      userId: !!userId,
      apartmentId: !!apartmentId,
      missingFields: [!userId && 'userId', !apartmentId && 'apartmentId'].filter(Boolean),
    });
    return res.status(400).json({ error: 'userId and apartmentId are required' });
  }

  try {
    const { getFirestore } = require('../config/firebase');
    const firestore = getFirestore();
    
    // Get apartment data
    console.log(`📤 [${operation}] Fetching apartment data...`);
    const apartmentDocRef = firestore.collection('apartments').doc(apartmentId);
    const apartmentDoc = await apartmentDocRef.get();

    if (!apartmentDoc.exists) {
      console.error(`❌ [${operation}] Apartment not found: ${apartmentId}`);
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const apartmentData = apartmentDoc.data();
    
    // Find syndic user ID
    let syndicUserId = apartmentData.syndicUserId;
    
    // If no main syndic, try to find from residents
    if (!syndicUserId) {
      console.log(`🔍 [${operation}] No main syndic, checking residents...`);
      const residentIds = apartmentData.residents || [];
      
      if (residentIds.length > 0) {
        // Fetch resident documents to find syndic
        const residentsPromises = residentIds.map(residentId => 
          firestore.collection('residents').doc(residentId).get()
        );
        const residentsDocs = await Promise.all(residentsPromises);
        const syndicResident = residentsDocs
          .filter(doc => doc.exists)
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .find(r => r.isSyndic && (r.linkedUserId || r.userId));
        
        if (syndicResident) {
          syndicUserId = syndicResident.linkedUserId || syndicResident.userId;
          console.log(`✅ [${operation}] Found syndic from residents: ${syndicUserId}`);
        }
      }
    } else {
      console.log(`✅ [${operation}] Found main syndic: ${syndicUserId}`);
    }

    if (!syndicUserId) {
      console.error(`❌ [${operation}] No syndic found for apartment: ${apartmentId}`);
      return res.status(404).json({ error: 'No syndic found for this apartment' });
    }

    // Get resident user data for the message
    const residentUserDoc = await firestore.collection('users').doc(userId).get();
    const residentName = residentUserDoc.exists 
      ? (residentUserDoc.data().fullName || residentUserDoc.data().name || 'A resident')
      : 'A resident';

    // Send test notification to syndic
    console.log(`📤 [${operation}] Sending test notification to syndic: ${syndicUserId}`);
    const { sendToUser } = require('../services/notificationService');
    const messageId = await sendToUser(syndicUserId, {
      title: 'Test Notification',
      body: `${residentName} sent a test notification from the app`,
      data: {
        type: 'TEST_NOTIFICATION',
        apartmentId,
        fromUserId: userId,
        fromUserName: residentName,
      },
    });

    console.log(`✅ [${operation}] Test notification sent successfully. MessageId: ${messageId}`);
    return res.json({ 
      ok: true, 
      messageId,
      syndicUserId,
      message: 'Test notification sent to syndic successfully'
    });
  } catch (error) {
    console.error(`❌ [${operation}] Error:`, {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: error.message || 'Failed to send test notification' });
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
  testNotificationToSyndic,
  health,
};


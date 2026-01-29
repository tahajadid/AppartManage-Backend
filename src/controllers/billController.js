const { getFirestore } = require('../config/firebase');

const firestore = getFirestore();

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}-${year}`;
}

function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

async function createMonthlyBills(req, res) {
  const operation = 'createMonthlyBills';
  const { apartmentId, userId } = req.body || {};
  
  console.log(`\n🔧 [OPERATION] ${operation}`);
  console.log(`   Payload:`, {
    apartmentId,
    userId,
  });
  
  if (!apartmentId || !userId) {
    console.error(`❌ [${operation}] Validation failed:`, {
      apartmentId: !!apartmentId,
      userId: !!userId,
      missingFields: [!apartmentId && 'apartmentId', !userId && 'userId'].filter(Boolean),
    });
    return res.status(400).json({ error: 'apartmentId and userId are required' });
  }

  try {
    console.log(`📤 [${operation}] Fetching apartment data...`);
    // Get apartment data
    const apartmentDocRef = firestore.collection('apartments').doc(apartmentId);
    const apartmentDoc = await apartmentDocRef.get();

    if (!apartmentDoc.exists) {
      console.error(`❌ [${operation}] Apartment not found: ${apartmentId}`);
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const apartmentData = apartmentDoc.data();
    const residentIds = apartmentData.residents || [];
    
    console.log(`✅ [${operation}] Apartment found. Residents count: ${residentIds.length}`);

    if (residentIds.length === 0) {
      console.error(`❌ [${operation}] No residents found in apartment`);
      return res.status(400).json({ error: 'No residents found in apartment' });
    }

    // Fetch full resident documents to check for syndic
    const residentsPromises = residentIds.map(residentId => 
      firestore.collection('residents').doc(residentId).get()
    );
    const residentsDocs = await Promise.all(residentsPromises);
    const residents = residentsDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }));

    if (residents.length === 0) {
      return res.status(400).json({ error: 'No valid residents found in apartment' });
    }

    // Verify user is syndic
    // Check 1: User is the main syndic (syndicUserId matches)
    // Check 2: User is a syndic-resident (has isSyndic=true and linkedUserId matches)
    console.log(`🔍 [${operation}] Verifying syndic permissions...`);
    const isSyndic = apartmentData.syndicUserId === userId || 
                     residents.some(r => r.isSyndic && (r.linkedUserId === userId || r.userId === userId));

    if (!isSyndic) {
      console.error(`❌ [${operation}] Syndic check failed:`, {
        userId,
        syndicUserId: apartmentData.syndicUserId,
        isMainSyndic: apartmentData.syndicUserId === userId,
        residents: residents.map(r => ({
          id: r.id,
          isSyndic: r.isSyndic,
          linkedUserId: r.linkedUserId,
          userId: r.userId
        }))
      });
      return res.status(403).json({ error: 'Only syndic can create monthly bills' });
    }
    
    console.log(`✅ [${operation}] Syndic verified`);

    const currentMonth = getCurrentMonth();
    const currentDate = getCurrentDate();
    
    console.log(`📅 [${operation}] Current month: ${currentMonth}, Current date: ${currentDate}`);

    // Get or create payments document
    console.log(`📤 [${operation}] Fetching payments document...`);
    const paymentsDocRef = firestore.collection('payments').doc(apartmentId);
    const paymentsDoc = await paymentsDocRef.get();

    let existingBills = [];
    if (paymentsDoc.exists) {
      const data = paymentsDoc.data();
      existingBills = data.bills || [];
      console.log(`✅ [${operation}] Found ${existingBills.length} existing bills`);
    } else {
      console.log(`ℹ️ [${operation}] No existing payments document, will create new one`);
    }

    // Check if bills for current month already exist
    const billsForCurrentMonth = existingBills.filter(
      (bill) => bill.date === currentMonth
    );

    if (billsForCurrentMonth.length > 0) {
      console.error(`❌ [${operation}] Bills for current month already exist:`, {
        currentMonth,
        existingBillsCount: billsForCurrentMonth.length,
      });
      return res.status(400).json({ 
        error: 'Bills for this month already exist',
        billsCount: billsForCurrentMonth.length
      });
    }

    // Find syndic resident ID (for responsible field)
    const syndicResident = residents.find(r => r.isSyndic);
    const syndicId = syndicResident?.id || userId;

    // Create bills for all residents
    console.log(`📝 [${operation}] Creating bills for ${residents.length} residents...`);
    const newBills = residents.map((resident) => {
      const initialOperation = {
        date: currentDate,
        operation: 'creation',
      };

      return {
        ownerOfBill: resident.id,
        responsible: syndicId,
        status: 'unpaid',
        amount: resident.monthlyFee || 0,
        date: currentMonth,
        listOfOperation: [initialOperation],
      };
    });
    
    console.log(`✅ [${operation}] Created ${newBills.length} bills:`, {
      bills: newBills.map(b => ({
        ownerOfBill: b.ownerOfBill,
        amount: b.amount,
        status: b.status,
      })),
    });

    // Merge with existing bills
    const allBills = [...existingBills, ...newBills];
    console.log(`📊 [${operation}] Total bills after merge: ${allBills.length}`);

    // Save to Firestore
    console.log(`💾 [${operation}] Saving to Firestore...`);
    if (paymentsDoc.exists) {
      await paymentsDocRef.update({
        bills: allBills,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ [${operation}] Updated payments document`);
    } else {
      await paymentsDocRef.set({
        bills: allBills,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ [${operation}] Created new payments document`);
    }

    const response = { 
      ok: true, 
      billsCreated: newBills.length,
      month: currentMonth
    };
    console.log(`✅ [${operation}] Success. Response:`, response);
    return res.json(response);
  } catch (error) {
    console.error(`❌ [${operation}] Error:`, {
      error: error.message || error,
      stack: error.stack,
      apartmentId,
      userId,
    });
    return res.status(500).json({ error: 'Failed to create monthly bills' });
  }
}

module.exports = {
  createMonthlyBills,
};


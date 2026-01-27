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
  const { apartmentId, userId } = req.body || {};
  
  if (!apartmentId || !userId) {
    return res.status(400).json({ error: 'apartmentId and userId are required' });
  }

  try {
    // Get apartment data
    const apartmentDocRef = firestore.collection('apartments').doc(apartmentId);
    const apartmentDoc = await apartmentDocRef.get();

    if (!apartmentDoc.exists) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const apartmentData = apartmentDoc.data();
    const residentIds = apartmentData.residents || [];

    if (residentIds.length === 0) {
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
    const isSyndic = apartmentData.syndicUserId === userId || 
                     residents.some(r => r.isSyndic && (r.linkedUserId === userId || r.userId === userId));

    if (!isSyndic) {
      console.log('Syndic check failed:', {
        userId,
        syndicUserId: apartmentData.syndicUserId,
        residents: residents.map(r => ({
          id: r.id,
          isSyndic: r.isSyndic,
          linkedUserId: r.linkedUserId,
          userId: r.userId
        }))
      });
      return res.status(403).json({ error: 'Only syndic can create monthly bills' });
    }

    const currentMonth = getCurrentMonth();
    const currentDate = getCurrentDate();

    // Get or create payments document
    const paymentsDocRef = firestore.collection('payments').doc(apartmentId);
    const paymentsDoc = await paymentsDocRef.get();

    let existingBills = [];
    if (paymentsDoc.exists) {
      const data = paymentsDoc.data();
      existingBills = data.bills || [];
    }

    // Check if bills for current month already exist
    const billsForCurrentMonth = existingBills.filter(
      (bill) => bill.date === currentMonth
    );

    if (billsForCurrentMonth.length > 0) {
      return res.status(400).json({ 
        error: 'Bills for this month already exist',
        billsCount: billsForCurrentMonth.length
      });
    }

    // Find syndic resident ID (for responsible field)
    const syndicResident = residents.find(r => r.isSyndic);
    const syndicId = syndicResident?.id || userId;

    // Create bills for all residents
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

    // Merge with existing bills
    const allBills = [...existingBills, ...newBills];

    // Save to Firestore
    if (paymentsDoc.exists) {
      await paymentsDocRef.update({
        bills: allBills,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await paymentsDocRef.set({
        bills: allBills,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.json({ 
      ok: true, 
      billsCreated: newBills.length,
      month: currentMonth
    });
  } catch (error) {
    console.error('Error creating monthly bills:', error);
    return res.status(500).json({ error: 'Failed to create monthly bills' });
  }
}

module.exports = {
  createMonthlyBills,
};


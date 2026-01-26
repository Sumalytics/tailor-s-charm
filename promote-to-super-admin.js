// Run this in Firebase Console → Firestore → Functions → Run
// Or save as a Cloud Function and deploy

const admin = require('firebase-admin');
admin.initializeApp();

async function promoteToSuperAdmin(email) {
  try {
    // Get user by email from Authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('Found user:', userRecord.uid);
    
    // Update user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      role: 'SUPER_ADMIN',
      shopId: null,
      isActive: true,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Successfully promoted ${email} to SUPER_ADMIN`);
    return true;
  } catch (error) {
    console.error('Error promoting user:', error);
    return false;
  }
}

// Replace with your email
promoteToSuperAdmin('mawuwebs@gmail.com');

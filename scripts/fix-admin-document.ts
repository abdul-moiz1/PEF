import { initializeFirebaseAdmin, getAdminDb, FieldValue } from '../server/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_EMAIL = 'admin@pef.world';

async function fixAdminDocument() {
  console.log('Fixing admin user document...');
  
  const app = initializeFirebaseAdmin();
  if (!app) {
    console.error('Failed to initialize Firebase Admin SDK');
    process.exit(1);
  }

  const db = getAdminDb();
  const auth = getAuth(app);
  
  try {
    const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    const uid = userRecord.uid;
    console.log(`Found Firebase Auth user with UID: ${uid}`);
    
    const userRef = db.collection('users').doc(uid);
    
    await userRef.set({
      email: ADMIN_EMAIL,
      firstName: 'Admin',
      lastName: 'PEF',
      status: 'approved',
      roles: {
        isAdmin: true,
        isProfessional: false,
        isJobSeeker: false,
        isEmployer: false,
        isBusinessOwner: false,
        isInvestor: false,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('Admin document updated successfully!');
    console.log(`\nDocument structure now includes:`);
    console.log(`- status: 'approved'`);
    console.log(`- roles.isAdmin: true`);
    console.log(`- All required fields`);
    
  } catch (error) {
    console.error('Error fixing admin document:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixAdminDocument();

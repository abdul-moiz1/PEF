import { initializeFirebaseAdmin, getAdminDb, FieldValue } from '../server/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_EMAIL = 'admin@pef.world';

async function setupAdmin() {
  console.log('Setting up admin user...');
  
  const app = initializeFirebaseAdmin();
  if (!app) {
    console.error('Failed to initialize Firebase Admin SDK');
    console.error('Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set');
    process.exit(1);
  }

  const db = getAdminDb();
  const auth = getAuth(app);
  
  try {
    let uid: string;
    
    try {
      const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      uid = userRecord.uid;
      console.log(`Found Firebase Auth user with UID: ${uid}`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`No Firebase Auth user found with email: ${ADMIN_EMAIL}`);
        console.log('Creating Firebase Auth user...');
        
        const newUser = await auth.createUser({
          email: ADMIN_EMAIL,
          emailVerified: true,
        });
        uid = newUser.uid;
        console.log(`Created Firebase Auth user with UID: ${uid}`);
      } else {
        throw authError;
      }
    }
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('Updating existing Firestore document with admin privileges...');
      await userRef.update({
        'roles.isAdmin': true,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      console.log('Creating Firestore document with admin privileges...');
      await userRef.set({
        email: ADMIN_EMAIL,
        roles: {
          isAdmin: true
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    
    console.log(`\nAdmin setup complete for: ${ADMIN_EMAIL}`);
    console.log(`Firestore document ID: ${uid}`);
    console.log('The user now has admin access.');
    console.log('\nNote: The admin user should set a password via "Forgot Password" on the login page.');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setupAdmin();

import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;

export function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  // Support individual secrets (preferred) or legacy JSON format
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  
  // Try individual secrets first
  if (projectId && clientEmail && privateKey) {
    try {
      // Replace escaped newlines with actual newlines in private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        } as admin.ServiceAccount),
        projectId,
      });
      
      adminDb = admin.firestore();
      console.log('✓ Firebase Admin SDK initialized successfully (using individual secrets)');
      return adminApp;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK with individual secrets:', error);
      return null;
    }
  }
  
  // Fallback to JSON format
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
      });
      
      adminDb = admin.firestore();
      console.log('✓ Firebase Admin SDK initialized successfully (using JSON)');
      return adminApp;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK with JSON:', error);
      return null;
    }
  }

  console.warn('⚠️ WARNING: Firebase Admin SDK not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY secrets.');
  return null;
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not configured - cannot access Firestore');
  }
  return adminDb;
}

export const db = {
  get instance() {
    return getAdminDb();
  }
};

export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
  const app = initializeFirebaseAdmin();
  
  if (!app) {
    throw new Error('Firebase Admin SDK not configured');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

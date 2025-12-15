import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;

export function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  
  if (!serviceAccountJson) {
    console.warn('⚠️ WARNING: Firebase Admin SDK not configured. Token verification is DISABLED. This is INSECURE for production!');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    });
    
    adminDb = admin.firestore();

    console.log('✓ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
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

import { initializeApp, cert, getApps, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

export function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
    return adminApp;
  }

  // Support individual secrets (preferred) or legacy JSON format
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  
  // Get storage bucket from env
  const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  
  // Try individual secrets first
  if (projectId && clientEmail && privateKey) {
    try {
      // Replace escaped newlines with actual newlines in private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        } as ServiceAccount),
        projectId,
        storageBucket: storageBucket,
      });
      
      adminDb = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);
      console.log('✓ Firebase Admin SDK initialized successfully (using individual secrets)');
      if (storageBucket) {
        console.log('✓ Firebase Storage configured with bucket:', storageBucket);
      }
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
      
      adminApp = initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: storageBucket,
      });
      
      adminDb = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);
      console.log('✓ Firebase Admin SDK initialized successfully (using JSON)');
      if (storageBucket) {
        console.log('✓ Firebase Storage configured with bucket:', storageBucket);
      }
      return adminApp;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK with JSON:', error);
      return null;
    }
  }

  console.warn('⚠️ WARNING: Firebase Admin SDK not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY secrets.');
  return null;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not configured - cannot access Firestore');
  }
  return adminDb;
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    initializeFirebaseAdmin();
  }
  if (!adminStorage) {
    throw new Error('Firebase Admin SDK not configured - cannot access Storage');
  }
  return adminStorage;
}

export const db = {
  get instance() {
    return getAdminDb();
  }
};

export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  const app = initializeFirebaseAdmin();
  
  if (!app) {
    throw new Error('Firebase Admin SDK not configured');
  }

  try {
    const decodedToken = await getAuth(app).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export { Timestamp, FieldValue };

import * as admin from 'firebase-admin';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration is missing. Please set VITE_FIREBASE_* and FIREBASE_ADMIN_SERVICE_ACCOUNT environment variables.");
}

const app = initializeApp(firebaseConfig, "admin");
export const db = getFirestore(app);

let adminApp: admin.app.App | null = null;

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

    console.log('✓ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

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

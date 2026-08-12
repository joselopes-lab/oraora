
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

/**
 * Initializes the Firebase Admin SDK on the server using service-account.json or ADC.
 */
function initializeAdmin(): App {
  if (!getApps().length) {
    try {
      const saPath = path.join(process.cwd(), 'service-account.json');
      if (fs.existsSync(saPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        return initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId || serviceAccount.project_id,
        });
      }
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin with service-account.json:", e);
    }

    try {
      return initializeApp({
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin with applicationDefault():", e);
      return initializeApp({
        projectId: firebaseConfig.projectId || 'studio-5937631195-8ebfd',
      }, 'fallback-app');
    }
  } else {
    return getApp();
  }
}

let _adminDb: Firestore | null = null;
function getAdminDb(): Firestore {
  if (!_adminDb) {
    const app = initializeAdmin();
    _adminDb = getFirestore(app);
  }
  return _adminDb;
}

let _adminAuth: Auth | null = null;
function getAdminAuth(): Auth {
  if (!_adminAuth) {
    const app = initializeAdmin();
    _adminAuth = getAuth(app);
  }
  return _adminAuth;
}

export const adminDb = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    const db = getAdminDb();
    const value = Reflect.get(db, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    const auth = getAdminAuth();
    const value = Reflect.get(auth, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});

/**
 * Generates an OAuth2 access token for calling Google Cloud APIs (like App Hosting)
 * using the configured service account or ADC.
 */
export async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  if (!token.token) {
    throw new Error('Falha ao obter token de acesso do Google.');
  }
  
  return token.token;
}

/**
 * Returns the initialized Firebase instances for server operations.
 */
export function initializeFirebase() {
  return {
    adminDb,
    adminAuth,
  };
}


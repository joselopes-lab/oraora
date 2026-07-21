
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { GoogleAuth } from 'google-auth-library';

/**
 * Initializes the Firebase Admin SDK on the server using ADC (Application Default Credentials).
 * Bypasses client-side security rules for sensitive backend operations.
 */
function initializeAdmin(): App {
  if (!getApps().length) {
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentialPath) {
      const resolvedCredentialPath = resolve(process.cwd(), credentialPath);
      const serviceAccount = JSON.parse(readFileSync(resolvedCredentialPath, 'utf8'));

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    }

    return initializeApp({
      credential: applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  } else {
    return getApp();
  }
}

const adminApp = initializeAdmin();
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

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

export { adminDb, adminAuth };

/**
 * Returns the initialized Firebase instances for server operations.
 */
export function initializeFirebase() {
  return {
    adminDb,
    adminAuth,
  };
}

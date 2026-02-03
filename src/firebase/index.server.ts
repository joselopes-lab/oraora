
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Initializes the Firebase app on the server.
 * It checks if an app is already initialized; if not, it creates a new one
 * using the configuration from firebase/config.ts. This is safe for server-side execution.
 */
function initializeFirebaseServer(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const firebaseApp = initializeFirebaseServer();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export { firebaseApp, auth, firestore };

/**
 * Returns the initialized Firebase instances.
 */
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
  };
}

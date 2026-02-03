'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';


let firebaseApp: FirebaseApp;
// This check prevents re-initializing the app on every render.
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

/*
let appCheck: AppCheck | undefined;
if (typeof window !== 'undefined') {
  // ATENÇÃO: O App Check foi desativado temporariamente para permitir o upload de arquivos
  // sem a configuração completa no console do Firebase.
  // Para produção, é altamente recomendável ativar o App Check no console do Firebase
  // e descomentar este bloco de código para maior segurança.
  if (!appCheck) {
    appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider('6Ld-iB8pAAAAAH3x9p6D0lF9P8bF8d2F9jG5e3cR'),
      isTokenAutoRefreshEnabled: true,
    });
  }
}
*/

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

/**
 * Initializes and returns the Firebase app and its services.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} {
  return {
    firebaseApp,
    auth,
    firestore,
    storage,
  };
}

export * from './provider';
export * from './client-provider';
export * from './auth-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

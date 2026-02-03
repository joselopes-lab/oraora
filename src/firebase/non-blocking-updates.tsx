
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  if (!docRef) {
    console.error("setDocumentNonBlocking was called with a null or undefined docRef.");
    return;
  }
  setDoc(docRef, data, options).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: options && 'merge' in options ? 'update' : 'create',
        requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  if (!colRef) {
    console.error("addDocumentNonBlocking was called with a null or undefined colRef.");
    return Promise.resolve(undefined);
  }
  const promise = addDoc(colRef, data)
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  if (!docRef) {
    console.error("updateDocumentNonBlocking was called with a null or undefined docRef.");
    return;
  }
  updateDoc(docRef, data)
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  if (!docRef) {
    console.error("deleteDocumentNonBlocking was called with a null or undefined docRef.");
    return;
  }
  deleteDoc(docRef)
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}


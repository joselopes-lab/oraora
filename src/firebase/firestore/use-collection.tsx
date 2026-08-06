'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuthContext } from '@/firebase/auth-provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const authContext = useAuthContext();
  const user = authContext?.user;
  const isReady = authContext?.isReady;
  const isUserLoading = authContext?.isUserLoading;

  useEffect(() => {
    const errPath = memoizedTargetRefOrQuery ? ((memoizedTargetRefOrQuery as any).path || (memoizedTargetRefOrQuery as any)._query?.path?.segments?.join('/') || 'unknown_path') : '';

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        snapshot.forEach(doc => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (firestoreError: FirestoreError) => {
        // ONLY emit permission error if it is actually a permission issue
        if (firestoreError.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: errPath,
          });
          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
        } else {
          // Log other errors to console for debugging without showing the permission toast
          console.error("[Firestore Query Error]", firestoreError);
          setError(firestoreError);
        }
        
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid, isReady, isUserLoading]);

  return { data, isLoading, error };
}
// src/lib/firestoreUtils.ts
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, documentId, type CollectionReference, type DocumentData, type QueryFieldFilterConstraint } from 'firebase/firestore';
import { type Property } from '@/app/dashboard/properties/page';

/**
 * Executes a Firestore query with an 'in' clause in batches to overcome the 30-item limit.
 *
 * @param collectionName - The name of the Firestore collection to query.
 * @param field - The field to use for the 'in' comparison (e.g., documentId() or a field path).
 * @param ids - The array of IDs or values to query for. Can be larger than 30.
 * @param additionalConstraints - An optional array of additional 'where' clauses to apply to the query.
 * @returns A promise that resolves to an array of documents of type T.
 *
 * @example
 * // Basic usage with document IDs
 * const properties = await queryInBatches<Property>('properties', documentId(), propertyIds);
 *
 * @example
 * // Usage with a specific field and an additional constraint
 * const visibleProperties = await queryInBatches<Property>(
 *   'properties',
 *   documentId(),
 *   propertyIds,
 *   [where('isVisibleOnSite', '==', true)]
 * );
 */
export async function queryInBatches<T>(
  collectionName: string,
  field: string | ReturnType<typeof documentId>,
  ids: string[],
  additionalConstraints: QueryFieldFilterConstraint[] = []
): Promise<T[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const chunks: string[][] = [];
  const BATCH_SIZE = 30; // Firestore 'in' query limit

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    chunks.push(ids.slice(i, i + BATCH_SIZE));
  }

  const promises = chunks.map(async (chunk) => {
    const q = query(
      collection(db, collectionName) as CollectionReference<DocumentData>,
      where(field, 'in', chunk),
      ...additionalConstraints
    );
    return getDocs(q);
  });

  const querySnapshots = await Promise.all(promises);
  
  const results: T[] = [];
  querySnapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as T);
    });
  });

  return results;
}

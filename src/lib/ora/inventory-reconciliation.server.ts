import { adminDb } from '@/firebase/index.server';
import { buildSearchDocument } from './indexer';
import { syncPublicInventoryDocument, removePublicInventoryDocument } from './inventory-persistence.server';
import { FieldPath } from 'firebase-admin/firestore';

export interface ReconciliationOptions {
  batchSize?: number;
  dryRun?: boolean;
}

export interface ReconciliationStats {
  scanned: number;
  upserted: number;
  removed: number;
  failed: number;
  propertiesScanned: number;
  brokerPropertiesScanned: number;
  wouldUpsert?: number;
  wouldRemove?: number;
  errors: { sourceCollection: string; sourceId: string; error: string }[];
}

const DEFAULT_BATCH_SIZE = 100;
const ORA_PUBLIC_INVENTORY_COLLECTION = 'oraPublicInventory';

export async function reconcilePublicInventory(
  options?: ReconciliationOptions
): Promise<ReconciliationStats> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const dryRun = options?.dryRun ?? true;

  const stats: ReconciliationStats = {
    scanned: 0,
    upserted: 0,
    removed: 0,
    failed: 0,
    propertiesScanned: 0,
    brokerPropertiesScanned: 0,
    wouldUpsert: dryRun ? 0 : undefined,
    wouldRemove: dryRun ? 0 : undefined,
    errors: [],
  };

  const collections = ['properties', 'brokerProperties'] as const;

  for (const colName of collections) {
    let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      let query: FirebaseFirestore.Query = adminDb
        .collection(colName)
        .orderBy(FieldPath.documentId())
        .limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      let snapshot: FirebaseFirestore.QuerySnapshot;
      try {
        snapshot = await query.get();
      } catch (err: any) {
        console.error(`[ORA Reconciliation] Error querying ${colName}:`, err?.message);
        break;
      }

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      for (const doc of snapshot.docs) {
        stats.scanned++;
        if (colName === 'properties') stats.propertiesScanned++;
        if (colName === 'brokerProperties') stats.brokerPropertiesScanned++;

        const sourceId = doc.id;
        const data = doc.data();

        try {
          const searchDoc = buildSearchDocument(colName, sourceId, data);

          if (dryRun) {
            if (searchDoc) {
              stats.wouldUpsert = (stats.wouldUpsert ?? 0) + 1;
            } else {
              stats.wouldRemove = (stats.wouldRemove ?? 0) + 1;
            }
          } else {
            if (searchDoc) {
              await syncPublicInventoryDocument(colName, sourceId, data);
              stats.upserted++;
            } else {
              await removePublicInventoryDocument(colName, sourceId);
              stats.removed++;
            }
          }
        } catch (err: any) {
          stats.failed++;
          stats.errors.push({
            sourceCollection: colName,
            sourceId,
            error: err?.message || 'Unknown reconciliation error',
          });
        }
      }

      if (snapshot.docs.length < batchSize) {
        hasMore = false;
      }
    }
  }

  return stats;
}

export async function reconcileOrphanedInventory(
  options?: ReconciliationOptions
): Promise<{ scannedIndex: number; removedOrphans: number; errors: any[] }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const dryRun = options?.dryRun ?? true;

  let scannedIndex = 0;
  let removedOrphans = 0;
  const errors: any[] = [];

  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    let query: FirebaseFirestore.Query = adminDb
      .collection(ORA_PUBLIC_INVENTORY_COLLECTION)
      .orderBy(FieldPath.documentId())
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await query.get();
    } catch (err: any) {
      console.error('[ORA Orphan Reconciliation] Error querying index:', err?.message);
      break;
    }

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    for (const doc of snapshot.docs) {
      scannedIndex++;
      const data = doc.data();
      const { sourceCollection, sourceId, searchId } = data;

      if (!sourceCollection || !sourceId) {
        errors.push({ searchId: doc.id, error: 'Missing sourceCollection or sourceId' });
        continue;
      }

      try {
        const sourceRef = adminDb.collection(sourceCollection).doc(sourceId);
        const sourceSnap = await sourceRef.get();

        if (!sourceSnap.exists) {
          if (!dryRun) {
            await removePublicInventoryDocument(sourceCollection, sourceId);
          }
          removedOrphans++;
        }
      } catch (err: any) {
        errors.push({ searchId: doc.id, error: err?.message || 'Error checking orphan' });
      }
    }

    if (snapshot.docs.length < batchSize) {
      hasMore = false;
    }
  }

  return { scannedIndex, removedOrphans, errors };
}

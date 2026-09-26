import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { buildSearchDocument, createSearchId } from './indexer';
import { SearchDocument } from './types';

export const ORA_PUBLIC_INVENTORY_COLLECTION = 'oraPublicInventory';

export interface PersistedSearchDocument extends Omit<SearchDocument, 'indexedAt'> {
  indexedAt: FieldValue | FirebaseFirestore.Timestamp;
}

export type SyncPublicInventoryResult =
  | {
      action: 'upserted';
      searchId: string;
    }
  | {
      action: 'removed';
      searchId: string;
    };

/**
 * Remove propriedades com valor undefined para evitar erros no Firestore Admin SDK.
 */
function sanitizePayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof FieldValue)) {
        sanitized[key] = sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

/**
 * Sincroniza um documento de origem (properties ou brokerProperties) com o índice oraPublicInventory.
 * Se o documento for elegível (SearchDocument válido), executa UPSERT integral (sem merge).
 * Se for inelegível/null, executa DELETE.
 * Lança erro em caso de falha no Firestore para garantir robustez de retry e reconciliação.
 */
export async function syncPublicInventoryDocument(
  sourceCollection: 'properties' | 'brokerProperties',
  sourceId: string,
  data: unknown
): Promise<SyncPublicInventoryResult> {
  const searchId = createSearchId(sourceCollection, sourceId);
  const docRef = adminDb.collection(ORA_PUBLIC_INVENTORY_COLLECTION).doc(searchId);

  const searchDoc = buildSearchDocument(sourceCollection, sourceId, data);

  if (!searchDoc) {
    // Inelegível ou inválido -> Remover do inventário público se existir
    await docRef.delete();
    return {
      action: 'removed',
      searchId,
    };
  }

  // Preparar payload persistido com serverTimestamp e sanitização de undefined
  const rawPayload: PersistedSearchDocument = {
    ...searchDoc,
    indexedAt: FieldValue.serverTimestamp(),
  };

  const payload = sanitizePayload(rawPayload);

  // Upsert com substituição integral (sem merge)
  await docRef.set(payload);

  return {
    action: 'upserted',
    searchId,
  };
}

/**
 * Remove explicitamente um documento do índice oraPublicInventory com base na origem.
 * É idempotente e lança erro em caso de falha no Firestore.
 */
export async function removePublicInventoryDocument(
  sourceCollection: 'properties' | 'brokerProperties',
  sourceId: string
): Promise<SyncPublicInventoryResult> {
  const searchId = createSearchId(sourceCollection, sourceId);
  const docRef = adminDb.collection(ORA_PUBLIC_INVENTORY_COLLECTION).doc(searchId);

  await docRef.delete();

  return {
    action: 'removed',
    searchId,
  };
}

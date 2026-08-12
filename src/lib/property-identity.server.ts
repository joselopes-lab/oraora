'use server';

import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateIdentityFingerprint, generatePhysicalPropertyId } from './property-identity';

/**
 * Resolve a identidade física de forma atômica utilizando transação no Firestore
 * na coleção auxiliar `physicalIdentities/{identityFingerprint}`.
 */
export async function resolvePhysicalIdentityServer(
  propertyData: any
): Promise<{ physicalPropertyId?: string | null; identityFingerprint?: string | null }> {
  let physicalPropertyId = propertyData?.physicalPropertyId;
  const fingerprint = calculateIdentityFingerprint(propertyData);

  if (!fingerprint) {
    return {
      physicalPropertyId: null,
      identityFingerprint: null
    };
  }

  const identityRef = adminDb.collection('physicalIdentities').doc(fingerprint);

  await adminDb.runTransaction(async (transaction) => {
    const identityDoc = await transaction.get(identityRef);
    if (identityDoc.exists) {
      const data = identityDoc.data();
      if (data?.physicalPropertyId) {
        physicalPropertyId = data.physicalPropertyId;
      }
    }

    if (!physicalPropertyId) {
      physicalPropertyId = generatePhysicalPropertyId();
      transaction.set(identityRef, {
        physicalPropertyId,
        identityFingerprint: fingerprint,
        createdAt: FieldValue.serverTimestamp()
      });
    }
  });

  return {
    physicalPropertyId,
    identityFingerprint: fingerprint
  };
}

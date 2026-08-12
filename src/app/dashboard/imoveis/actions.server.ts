
'use server';

import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolvePhysicalIdentityServer } from '@/lib/property-identity.server';

/**
 * @fileOverview Ações de servidor para persistência de imóveis com revalidação de cache.
 * Garante que sitemaps e páginas públicas sejam atualizados sem novo deploy.
 */

export async function savePropertyServer(
  collectionName: 'properties' | 'brokerProperties',
  propertyId: string | null,
  data: any,
  userId: string
) {
  try {
    const isNew = !propertyId;
    const finalId = propertyId || adminDb.collection(collectionName).doc().id;
    const docRef = adminDb.collection(collectionName).doc(finalId);

    // Resolve atomic physical identity
    const { physicalPropertyId, identityFingerprint } = await resolvePhysicalIdentityServer(data);

    const now = FieldValue.serverTimestamp();
    
    const seoData = {
      ...data.seo,
      lastModifiedAt: now,
      isIndexable: data.isVisibleOnSite !== false,
      ...(isNew ? { lastPublishedAt: now } : {})
    };

    const finalData = {
      ...data,
      id: finalId,
      physicalPropertyId,
      identityFingerprint,
      updatedAt: now,
      createdAt: isNew ? now : data.createdAt || now,
      seo: seoData,
      // Metadata for traceability
      lastEditorId: userId
    };

    // Remove undefined fields for Firestore compatibility without breaking FieldValue
    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj !== null && typeof obj === 'object' && obj.constructor?.name !== 'FieldValue' && !(obj instanceof FieldValue)) {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, sanitize(v)])
        );
      }
      return obj;
    };

    const sanitizedData = sanitize(finalData);

    await docRef.set(sanitizedData, { merge: true });

    // Invalidação de Cache Inteligente
    // Revalida o sitemap e as páginas de listagem e detalhes
    revalidatePath('/sitemap.xml');
    revalidatePath('/imoveis');
    revalidateTag('sitemap');
    
    if (data.informacoesbasicas?.slug) {
        revalidatePath(`/imoveis/${data.informacoesbasicas.slug}`);
    }

    return { success: true, id: finalId };
  } catch (error: any) {
    console.error('Error saving property on server:', error);
    return { success: false, message: error.message };
  }
}

export async function deletePropertyServer(
    collectionName: 'properties' | 'brokerProperties',
    propertyId: string
) {
    try {
        await adminDb.collection(collectionName).doc(propertyId).delete();
        
        revalidatePath('/sitemap.xml');
        revalidatePath('/imoveis');
        revalidateTag('sitemap');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting property:', error);
        return { success: false, message: error.message };
    }
}

export async function getPhysicalIdentityDiagnosticAction(fingerprint: string, currentId?: string, physicalPropId?: string) {
    try {
        if (!fingerprint) return { exists: false, physicalPropertyId: null, fingerprint: null, relatedRecords: [] };
        
        let physicalPropertyId = physicalPropId;
        const docSnap = await adminDb.collection('physicalIdentities').doc(fingerprint).get();
        let exists = docSnap.exists;
        if (exists) {
            const data = docSnap.data();
            if (!physicalPropertyId) {
                physicalPropertyId = data?.physicalPropertyId || null;
            }
        }

        const relatedRecords: Array<{ id: string; collection: string; physicalPropertyId: string }> = [];

        return {
            exists,
            physicalPropertyId: physicalPropertyId || null,
            fingerprint,
            relatedRecords
        };
    } catch (error: any) {
        console.error('Error fetching physical identity diagnostic:', error);
        return { exists: false, physicalPropertyId: null, fingerprint, relatedRecords: [], error: error.message };
    }
}

export async function getPropertiesBrokerLinkCheckAction() {
    try {
        const propertiesSnap = await adminDb.collection('properties').get();
        const results = [];

        for (const propDoc of propertiesSnap.docs) {
            const propData = propDoc.data();
            const physicalPropertyId = propData.physicalPropertyId || null;
            const propertyName = propData.informacoesbasicas?.nome || 'Imóvel sem nome';
            const propertyId = propDoc.id;

            // Check portfolios for this property
            const portfoliosSnap = await adminDb.collectionGroup('portfolios')
                .where('propertyId', '==', propertyId)
                .get();

            const brokerIds = new Set<string>();
            portfoliosSnap.forEach(pDoc => {
                const pathSegments = pDoc.ref.path.split('/');
                if (pathSegments.length >= 2 && pathSegments[0] === 'portfolios') {
                    brokerIds.add(pathSegments[1]);
                }
            });

            const brokerMatches: Array<{ id: string; name: string }> = [];

            if (physicalPropertyId) {
                const brokerSnap = await adminDb.collection('brokerProperties')
                    .where('physicalPropertyId', '==', physicalPropertyId)
                    .get();

                brokerSnap.forEach(bDoc => {
                    const bData = bDoc.data();
                    brokerMatches.push({
                        id: bDoc.id,
                        name: bData.informacoesbasicas?.nome || 'Imóvel Corretor'
                    });
                });
            }

            let status = 'PROPERTIES — IMÓVEL DE CONSTRUTORA';
            if (!physicalPropertyId) {
                status = 'IDENTIDADE AUSENTE';
            } else {
                status = 'PROPERTIES — IMÓVEL DE CONSTRUTORA';
            }

            results.push({
                propertyId,
                propertyName,
                physicalPropertyId,
                brokerMatches,
                portfolioCount: brokerIds.size,
                status,
                isConstructorProperty: true
            });
        }

        return { success: true, results };
    } catch (error: any) {
        console.error('Error in property broker link check:', error);
        return { success: false, results: [], error: error.message };
    }
}

export async function importBrokerPropertiesServer(
  propertiesArray: any[],
  userId: string,
  transactionMode: 'sale' | 'rent' | 'both' = 'sale'
) {
  try {
    let importedCount = 0;
    for (const prop of propertiesArray) {
      const finalId = adminDb.collection('brokerProperties').doc().id;
      const docRef = adminDb.collection('brokerProperties').doc(finalId);

      const { physicalPropertyId, identityFingerprint } = await resolvePhysicalIdentityServer(prop);

      const now = FieldValue.serverTimestamp();
      const seoData = {
        ...prop.seo,
        lastModifiedAt: now,
        isIndexable: prop.isVisibleOnSite !== false,
        lastPublishedAt: now
      };

      const finalData = {
        ...prop,
        id: finalId,
        brokerId: userId,
        builderId: userId,
        inPortfolio: false,
        isVisibleOnSite: true,
        physicalPropertyId,
        identityFingerprint,
        updatedAt: now,
        createdAt: now,
        seo: seoData,
        lastEditorId: userId
      };

      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj !== null && typeof obj === 'object' && obj.constructor?.name !== 'FieldValue' && !(obj instanceof FieldValue)) {
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([_, v]) => v !== undefined)
              .map(([k, v]) => [k, sanitize(v)])
          );
        }
        return obj;
      };

      await docRef.set(sanitize(finalData), { merge: true });
      importedCount++;
    }

    revalidatePath('/sitemap.xml');
    revalidatePath('/imoveis');
    revalidateTag('sitemap');

    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error('Error importing broker properties on server:', error);
    return { success: false, message: error.message };
  }
}



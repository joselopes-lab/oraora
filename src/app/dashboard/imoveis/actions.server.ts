
'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolvePhysicalIdentityServer } from '@/lib/property-identity.server';
import { cookies, headers } from 'next/headers';
import { syncPublicInventoryDocument, removePublicInventoryDocument } from '@/lib/ora/inventory-persistence.server';

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

    // Server-side tenantId and user resolution
    let resolvedTenantId = data.tenantId;
    let requesterUid = userId;
    if (!requesterUid) {
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value || 
                              cookieStore.get('firebase-auth-token')?.value ||
                              cookieStore.get('token')?.value ||
                              cookieStore.get('auth-token')?.value;
        if (sessionCookie) {
          try {
            const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
            requesterUid = decoded.uid;
          } catch {
            const decoded = await adminAuth.verifyIdToken(sessionCookie);
            requesterUid = decoded.uid;
          }
        }
      } catch {}
    }

    let requesterUserType = '';
    if (requesterUid) {
      try {
        const userDoc = await adminDb.collection('users').doc(requesterUid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          requesterUserType = userData?.userType;
          if (requesterUserType === 'constructor') {
            resolvedTenantId = userData?.tenantId || requesterUid;
          }
        }
      } catch (err) {
        console.warn('Could not resolve user for property save:', err);
      }
    }

    if (!isNew) {
      const existingDoc = await docRef.get();
      if (existingDoc.exists) {
        resolvedTenantId = existingDoc.data()?.tenantId;
      }
    }

    if (collectionName === 'properties') {
      if (requesterUserType !== 'admin' && requesterUserType !== 'constructor') {
        throw new Error('Permissão negada. Apenas administradores ou construtoras podem gerenciar imóveis de construtoras.');
      }
    } else if (collectionName === 'brokerProperties') {
      if (requesterUserType !== 'admin') {
        if (!requesterUid) {
          throw new Error('Usuário não autenticado.');
        }
        if (!isNew) {
          const existingDoc = await docRef.get();
          if (existingDoc.exists) {
            const existingData = existingDoc.data();
            if (existingData?.brokerId && existingData.brokerId !== requesterUid) {
              throw new Error('Permissão negada. Este imóvel avulso pertence a outro corretor.');
            }
          }
        }
        data.brokerId = requesterUid;
      } else {
        if (isNew && !data.brokerId && requesterUid) {
          data.brokerId = requesterUid;
        }
      }
    } else {
      if (requesterUserType !== 'admin') {
        throw new Error('Permissão negada.');
      }
    }

    // Validate projectId
    if (data.projectId && collectionName === 'properties') {
      const projectDoc = await adminDb.collection('projects').doc(data.projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Empreendimento não encontrado.');
      }
      const projectData = projectDoc.data();

      if (requesterUserType === 'admin') {
        if (isNew && !resolvedTenantId && projectData?.builderId) {
          resolvedTenantId = projectData.builderId;
        }
      } else if (requesterUserType === 'constructor') {
        if (projectData?.builderId !== resolvedTenantId) {
          throw new Error('Empreendimento não pertence à construtora logada.');
        }
      }
    }

    // Validate property type for public properties
    const isVisibleOnSite = data.isVisibleOnSite === true;
    if (isVisibleOnSite) {
      const VALID_PROPERTY_TYPES = [
        'Apartamento', 'Apart Hotel', 'Bangalô', 'Casa', 'Casa de Campo', 'Casa de Praia', 'Casa de Vila', 'Casa Geminada', 'Chácara', 'Cobertura', 'Cobertura Duplex', 'Cobertura Triplex', 'Comercial', 'Duplex', 'Flat', 'Kitnet', 'Loft', 'Lote', 'Lote em Condomínio', 'Sítio', 'Sobrado', 'Studio', 'Terreno', 'Terreno Residencial', 'Triplex'
      ];
      
      const isTypeProvidedInPayload = data.informacoesbasicas && 'tipo' in data.informacoesbasicas;
      let tipo = data.informacoesbasicas?.tipo;

      if (!isTypeProvidedInPayload && !tipo && !isNew) {
        const existingDoc = await docRef.get();
        if (existingDoc.exists) {
          tipo = existingDoc.data()?.informacoesbasicas?.tipo;
        }
      }

      if (!tipo || typeof tipo !== 'string' || !VALID_PROPERTY_TYPES.includes(tipo.trim())) {
        throw new Error('Selecione um tipo de imóvel válido antes de publicá-lo.');
      }
    }

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
      ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
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

    try {
      const updatedDoc = await docRef.get();
      if (updatedDoc.exists) {
        await syncPublicInventoryDocument(collectionName, finalId, updatedDoc.data());
      }
    } catch (syncErr: any) {
      console.error('[ORA Inventory Sync Error]', { collection: collectionName, id: finalId, error: syncErr?.message });
    }

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
    propertyId: string,
    userId?: string
) {
    try {
        let requesterUid: string | null = userId || null;

        if (!requesterUid) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('session')?.value || 
                                  cookieStore.get('firebase-auth-token')?.value ||
                                  cookieStore.get('token')?.value ||
                                  cookieStore.get('auth-token')?.value;

            if (sessionCookie) {
                try {
                    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
                    requesterUid = decoded.uid;
                } catch {
                    try {
                        const decoded = await adminAuth.verifyIdToken(sessionCookie);
                        requesterUid = decoded.uid;
                    } catch {}
                }
            }
        }

        if (!requesterUid) {
            const headersList = await headers();
            const authHeader = headersList.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
                    requesterUid = decoded.uid;
                } catch {}
            }
        }

        if (!requesterUid) {
            return { success: false, message: 'Usuário não autenticado no servidor.' };
        }

        const userDoc = await adminDb.collection('users').doc(requesterUid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const docRef = adminDb.collection(collectionName).doc(propertyId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return { success: false, message: 'Unidade não encontrada.' };
        }
        const propData = docSnap.data();

        if (collectionName === 'properties') {
            if (userData?.userType === 'constructor') {
                const tenantId = userData.tenantId || requesterUid;
                if (propData?.tenantId && propData.tenantId !== tenantId) {
                    return { success: false, message: 'Acesso negado: unidade pertence a outra construtora.' };
                }
            } else if (userData?.userType !== 'admin') {
                return { success: false, message: 'Acesso negado.' };
            }
        } else if (collectionName === 'brokerProperties') {
            if (userData?.userType !== 'admin') {
                if (propData?.brokerId && propData.brokerId !== requesterUid) {
                    return { success: false, message: 'Acesso negado: este imóvel avulso pertence a outro corretor.' };
                }
            }
        }

        const projectId = propData?.projectId;

        await docRef.delete();

        try {
            await removePublicInventoryDocument(collectionName, propertyId);
        } catch (syncErr: any) {
            console.error('[ORA Inventory Remove Error]', { collection: collectionName, id: propertyId, error: syncErr?.message });
        }
        
        revalidatePath('/sitemap.xml');
        revalidatePath('/imoveis');
        revalidateTag('sitemap');
        if (projectId) {
            revalidatePath(`/dashboard/construtoras/empreendimentos/${projectId}`);
            revalidatePath('/dashboard/construtoras/empreendimentos');
        }
        
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



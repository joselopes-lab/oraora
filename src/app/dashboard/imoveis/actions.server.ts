
'use server';

import { adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath, revalidateTag } from 'next/cache';

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
      updatedAt: now,
      createdAt: isNew ? now : data.createdAt || now,
      seo: seoData,
      // Metadata for traceability
      lastEditorId: userId
    };

    // Remove undefined fields for Firestore compatibility
    const sanitizedData = JSON.parse(JSON.stringify(finalData));

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

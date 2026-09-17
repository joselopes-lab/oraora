'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function updatePropertyCanalProServer(propertyId: string, publish: boolean, idToken?: string) {
  try {
    // 1. Validate Auth
    let brokerId: string;

    if (idToken) {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      brokerId = decodedToken.uid;
    } else {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
      if (!sessionCookie) {
          return { success: false, error: 'Usuário não autenticado.' };
      }

      let decodedToken;
      try {
          decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      } catch {
          decodedToken = await adminAuth.verifyIdToken(sessionCookie);
      }
      brokerId = decodedToken.uid;
    }

    if (!brokerId) {
        return { success: false, error: 'ID de usuário inválido.' };
    }

    // 2. Find Property in brokerProperties collection ONLY
    const propRef = adminDb.collection('brokerProperties').doc(propertyId);
    const brokerSnap = await propRef.get();

    if (!brokerSnap.exists) {
        const globalPropRef = adminDb.collection('properties').doc(propertyId);
        const globalSnap = await globalPropRef.get();
        if (globalSnap.exists) {
            return { success: false, error: 'Imóveis de construtoras não podem ser publicados no Canal Pro.' };
        }
        return { success: false, error: 'Imóvel não encontrado.' };
    }

    const propData = brokerSnap.data();
    if (!propData) return { success: false, error: 'Dados do imóvel inválidos.' };

    // Strict validation: Only allow if property belongs to broker
    if (propData.brokerId !== brokerId) {
        return { success: false, error: 'Permissão negada. Este imóvel não pertence à sua carteira.' };
    }

    // 4. Validate Elegibility
    const info = propData.informacoesbasicas || {};
    const priceVal = info.salePrice ?? info.precoVenda ?? info.valor ?? propData.salePrice ?? propData.precoVenda ?? propData.valor ?? propData.price;
    const numericPrice = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal || '').replace(/[R$\s]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.'));
    const hasValidPrice = !isNaN(numericPrice) && numericPrice > 0;

    const mediaList = propData.midia || propData.media || propData.imagens || propData.images || propData.fotos || propData.galeria || [];
    const validMedia = Array.isArray(mediaList) 
      ? mediaList.map((m: any) => (typeof m === 'string' ? m : m?.url)).filter((url: string) => typeof url === 'string' && url.trim().length > 0 && url.startsWith('http'))
      : [];

    if (publish && (!hasValidPrice || validMedia.length === 0)) {
        return { success: false, error: 'Este imóvel não possui os dados necessários para publicação (preço ou imagens válidas).' };
    }

    // 5. Update
    await propRef!.update({ publishToCanalPro: publish, updatedAt: FieldValue.serverTimestamp() });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar Canal Pro:', error);
    return { success: false, error: 'Erro inesperado.' };
  }
}

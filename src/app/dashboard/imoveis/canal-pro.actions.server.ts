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

    // 2. Find Property in both collections & Validate Ownership
    const propRefs = [
        adminDb.collection('properties').doc(propertyId),
        adminDb.collection('brokerProperties').doc(propertyId)
    ];

    let propSnap;
    let propRef;
    for (const ref of propRefs) {
        const snap = await ref.get();
        if (snap.exists) {
            propSnap = snap;
            propRef = ref;
            break;
        }
    }
    
    if (!propSnap) {
        return { success: false, error: 'Imóvel não encontrado.' };
    }

    const propData = propSnap.data();
    if (!propData) return { success: false, error: 'Dados do imóvel inválidos.' };

    // Strict validation: Only allow if property belongs to broker or is in portfolio
    if (propData.brokerId !== brokerId) {
        const portfolioSnap = await adminDb.collection('portfolios').doc(brokerId).get();
        const portfolioData = portfolioSnap.data();
        if (!portfolioData?.propertyIds?.includes(propertyId)) {
            return { success: false, error: 'Permissão negada. Este imóvel não pertence à sua carteira.' };
        }
    }

    // 3. Prevent Construtora Properties
    if (propData.builderId && propData.builderId !== brokerId) {
         return { success: false, error: 'Este imóvel não pode ser publicado no Canal Pro.' };
    }

    // 4. Validate Elegibility
    if (publish && (!propData.informacoesbasicas?.valor || !propData.midia || propData.midia.length === 0)) {
        return { success: false, error: 'Este imóvel não possui os dados necessários para publicação (preço ou imagens).' };
    }

    // 5. Plan Limit Check (Only if publishing)
    if (publish) {
        let planId: string | undefined;
        let planBrokerId = brokerId;

        const userSnap = await adminDb.collection('users').doc(brokerId).get();
        if (userSnap.exists) {
            const userData = userSnap.data();
            planId = userData?.planId;
        }

        if (!planId && propData.brokerId) {
            const ownerSnap = await adminDb.collection('users').doc(propData.brokerId).get();
            if (ownerSnap.exists) {
                const ownerData = ownerSnap.data();
                if (ownerData?.planId) {
                    planId = ownerData.planId;
                    planBrokerId = propData.brokerId;
                }
            }
        }

        if (!planId && propData.builderId) {
            const builderSnap = await adminDb.collection('users').doc(propData.builderId).get();
            if (builderSnap.exists) {
                const builderData = builderSnap.data();
                if (builderData?.planId) {
                    planId = builderData.planId;
                    planBrokerId = propData.builderId;
                }
            }
        }

        if (!planId) {
             console.error('[CanalPro] Plan not found. brokerId:', brokerId, 'propBrokerId:', propData.brokerId);
             return { success: false, error: 'Plano não encontrado.' };
        }
        
        let planSnap = await adminDb.collection('plans').doc(planId).get();
        let planData = planSnap.exists ? planSnap.data() : null;

        if (!planData) {
            const q1 = await adminDb.collection('plans').where('id', '==', planId).limit(1).get();
            if (!q1.empty) {
                planSnap = q1.docs[0];
                planData = planSnap.data();
            }
        }

        if (!planData) {
            const q2 = await adminDb.collection('plans').where('name', '==', planId).limit(1).get();
            if (!q2.empty) {
                planSnap = q2.docs[0];
                planData = planSnap.data();
            }
        }

        if (!planData) {
             console.error('[CanalPro] Plan doc not exists in plans collection for planId:', planId);
             return { success: false, error: 'Plano não encontrado.' };
        }

        const limit = planData?.propertyLimit || 0;

        // Count current published properties in both collections for planBrokerId
        const publishedCountSnap = await adminDb.collection('properties')
            .where('brokerId', '==', planBrokerId)
            .where('publishToCanalPro', '==', true)
            .get();
            
        const publishedBrokerCountSnap = await adminDb.collection('brokerProperties')
            .where('brokerId', '==', planBrokerId)
            .where('publishToCanalPro', '==', true)
            .get();

        const totalPublished = publishedCountSnap.size + publishedBrokerCountSnap.size;

        if (totalPublished >= limit) {
             return { success: false, error: 'Seu plano atingiu o limite de imóveis no Canal Pro.' };
        }
    }

    // 6. Update
    await propRef!.update({ publishToCanalPro: publish, updatedAt: FieldValue.serverTimestamp() });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar Canal Pro:', error);
    return { success: false, error: 'Erro inesperado.' };
  }
}

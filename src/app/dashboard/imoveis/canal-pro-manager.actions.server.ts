'use server';

import { adminDb } from '@/firebase/index.server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/firebase/index.server';
import { generateSecureToken } from '@/lib/security/token-generator';

export async function generateCanalProTokenAction(idToken?: string) {
  try {
    let brokerId: string;

    if (idToken) {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      brokerId = decodedToken.uid;
    } else {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
      if (!sessionCookie) {
        console.warn('CanalProTokenAction: Nenhum token ou session cookie fornecido.');
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

    const userDocRef = adminDb.collection('users').doc(brokerId);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      console.warn(`CanalProTokenAction: Usuário ${brokerId} não encontrado no Firestore.`);
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const userData = userSnap.data();
    if (userData?.userType !== 'broker') {
      console.warn(`CanalProTokenAction: Acesso negado para usuário ${brokerId} com tipo ${userData?.userType}`);
      return { success: false, error: 'Apenas corretores podem gerar tokens do Canal Pro.' };
    }

    const token = generateSecureToken();
    
    await userDocRef.set({
        canalProToken: token
    }, { merge: true });

    return { success: true, token };
  } catch (error: any) {
    console.error('Erro ao gerar token Canal Pro:', error?.message || error);
    return { success: false, error: 'Erro ao gerar conexão.' };
  }
}

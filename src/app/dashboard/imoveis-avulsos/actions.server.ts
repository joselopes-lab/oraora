'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { brokerSelectedPropertyRepository } from '@/repositories/broker-selected-property.repository';
import { headers, cookies } from 'next/headers';
import { serializeFirestoreData, classificarProperty } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getAuthenticatedBrokerContext(idToken?: string) {
  let token = idToken;
  if (!token) {
    const headersList = await headers();
    const cookieStore = await cookies();
    
    const authHeader = headersList.get('authorization');
    token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      token = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value || null;
    }
  }

  if (!token) {
    throw new Error('Usuário não autenticado no servidor.');
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    try {
      decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
      throw new Error('Token inválido.');
    }
  }

  const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userDoc.exists) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const userData = userDoc.data();
  if (userData?.userType !== 'broker') {
    throw new Error('Acesso restrito a corretores.');
  }

  return {
    uid: decoded.uid,
    userType: userData?.userType,
  };
}

export async function getNetworkPropertiesServer(data?: { idToken?: string }) {
  const ctx = await getAuthenticatedBrokerContext(data?.idToken);

  // Buscar imóveis na collection properties disponíveis para a rede
  // Regra: availableToNetwork === true AND (projectId ausente/null/vazio)
  const snap = await adminDb.collection('properties')
    .where('availableToNetwork', '==', true)
    .get();

  const properties = snap.docs
    .map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data };
    })
    .filter(data => classificarProperty(data) === 'avulso')
    .map(data => {
      // PRIVACIDADE DA CONSTRUTORA: Garantir remoção de quaisquer dados sensíveis da construtora se existirem
      delete data.builderId;
      delete data.tenantId;
      delete data.constructorId;
      delete data.ownerId;
      
      return data;
    });

  const selectedLinks = await brokerSelectedPropertyRepository.listByBrokerId(ctx.uid);
  const selectedPropertyIds = selectedLinks.map(link => link.propertyId);

  return serializeFirestoreData({
    properties,
    selectedPropertyIds,
  });
}

export async function getMySelectedNetworkPropertiesServer(data?: { idToken?: string }) {
  const ctx = await getAuthenticatedBrokerContext(data?.idToken);
  const selectedLinks = await brokerSelectedPropertyRepository.listByBrokerId(ctx.uid);
  
  const properties = [];
  for (const link of selectedLinks) {
    const propDoc = await adminDb.collection('properties').doc(link.propertyId).get();
    if (propDoc.exists) {
      const data = propDoc.data() || {};
      // Sanitização rigorosa da construtora
      delete data.builderId;
      delete data.tenantId;
      delete data.constructorId;
      delete data.ownerId;

      properties.push({
        id: propDoc.id,
        existsInOriginal: true,
        ...data,
      });
    } else {
      // Vínculo órfão (imóvel original removido)
      properties.push({
        id: link.propertyId,
        existsInOriginal: false,
        informacoesbasicas: { nome: 'Imóvel indisponível ou removido do catálogo original' }
      });
    }
  }

  return serializeFirestoreData({
    properties,
  });
}

export async function addPropertyToOperationServer(propertyId: string, idToken?: string) {
  const ctx = await getAuthenticatedBrokerContext(idToken);
  await brokerSelectedPropertyRepository.create(ctx.uid, propertyId);
  revalidatePath('/dashboard/imoveis-avulsos');
  return { success: true };
}

export async function removePropertyFromOperationServer(propertyId: string, idToken?: string) {
  const ctx = await getAuthenticatedBrokerContext(idToken);
  await brokerSelectedPropertyRepository.remove(ctx.uid, propertyId);
  revalidatePath('/dashboard/imoveis-avulsos');
  return { success: true };
}

'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { leadRepository } from '@/repositories/lead.repository';
import { cookies, headers } from 'next/headers';

async function getRequesterUid(): Promise<string> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  }
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      return decodedClaims.uid;
    } catch {
      const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
      return decodedToken.uid;
    }
  }
  
  throw new Error('Usuário não autenticado.');
}

async function getRequesterData(uid: string) {
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new Error('Perfil não encontrado.');
  return userDoc.data();
}

export async function listLeadsAction() {
  const uid = await getRequesterUid();
  const userData = await getRequesterData(uid);
  
  if (userData?.userType === 'constructor') {
    // REQUIRES LEAD REPOSITORY ALTERATION: listByTenant(tenantId: string)
    throw new Error('Listagem por construtora não implementada no repository.');
  }
  
  if (!userData?.brokerId) throw new Error('Corretor não possui brokerId.');
  return await leadRepository.listByBroker(userData.brokerId);
}

export async function getLeadByIdAction(leadId: string) {
  const uid = await getRequesterUid();
  const userData = await getRequesterData(uid);
  const lead = await leadRepository.getById(leadId);

  if (!lead) return null;

  if (userData?.userType === 'constructor') {
    if (lead.tenantId !== userData.tenantId) throw new Error('Permissão negada.');
  } else {
    if (lead.brokerId !== userData.brokerId) throw new Error('Permissão negada.');
  }

  return lead;
}

export async function updateLeadAction(leadId: string, data: any) {
  const uid = await getRequesterUid();
  const userData = await getRequesterData(uid);
  const lead = await leadRepository.getById(leadId);

  if (!lead) throw new Error('Lead não encontrado.');

  if (userData?.userType === 'constructor') {
    if (lead.tenantId !== userData.tenantId) throw new Error('Permissão negada.');
  } else {
    if (lead.brokerId !== userData.brokerId) throw new Error('Permissão negada.');
  }

  return await leadRepository.update(leadId, data);
}

export async function deleteLeadAction(leadId: string) {
  const uid = await getRequesterUid();
  const userData = await getRequesterData(uid);
  const lead = await leadRepository.getById(leadId);

  if (!lead) throw new Error('Lead não encontrado.');

  if (userData?.userType === 'constructor') {
    if (lead.tenantId !== userData.tenantId) throw new Error('Permissão negada.');
  } else {
    if (lead.brokerId !== userData.brokerId) throw new Error('Permissão negada.');
  }

  return await leadRepository.delete(leadId);
}

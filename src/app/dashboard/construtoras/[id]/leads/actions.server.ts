'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { leadRepository } from '@/repositories/lead.repository';
import { cookies, headers } from 'next/headers';

async function getRequesterUid(idToken?: string): Promise<string> {
  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return decoded.uid;
    } catch (e: any) {
      throw new Error(`Token inválido: ${e.message}`);
    }
  }

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

function serializeFirestoreData(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (data._seconds !== undefined && data._nanoseconds !== undefined) {
    return new Date(data._seconds * 1000 + data._nanoseconds / 1000000).toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  
  const serialized: any = {};
  for (const key in data) {
    serialized[key] = serializeFirestoreData(data[key]);
  }
  return serialized;
}

export async function listConstructorLeadsAction(constructorId: string, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);
  
  // Authorization check: Is user an admin or a member of this constructor?
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
       throw new Error('Permissão negada. Usuário não pertence a esta construtora.');
    }
    
    // Verify member role in constructor
    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    if (!constructorDoc.exists) throw new Error('Construtora não encontrada.');
    
    const constructorData = constructorDoc.data();
    const members = constructorData?.members || [];
    const requesterMember = members.find((m: any) => m.uid === uid);
    
    if (!requesterMember) {
        throw new Error('Permissão negada. Usuário não é membro desta construtora.');
    }
  }

  const leads = await leadRepository.listByTenant(constructorId);
  return serializeFirestoreData(leads);
}

export async function listConstructorPropertiesAction(constructorId: string, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);
  
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
       throw new Error('Permissão negada.');
    }
  }

  const snap1 = await adminDb.collection('properties').where('tenantId', '==', constructorId).get();
  const snap2 = await adminDb.collection('properties').where('builderId', '==', constructorId).get();
  
  const map = new Map();
  snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  
  return serializeFirestoreData(Array.from(map.values()));
}

export async function listConstructorProjectsAction(constructorId: string, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);
  
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
       throw new Error('Permissão negada.');
    }
  }

  const snap = await adminDb.collection('projects').where('builderId', '==', constructorId).get();
  const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return serializeFirestoreData(projects);
}

export async function createConstructorLeadAction(constructorId: string, data: any, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);
  
  // Authorization check
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
       throw new Error('Permissão negada.');
    }
    
    // Verify member role
    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    if (!constructorDoc.exists) throw new Error('Construtora não encontrada.');
    
    const constructorData = constructorDoc.data();
    const members = constructorData?.members || [];
    const requesterMember = members.find((m: any) => m.uid === uid);
    
    if (!requesterMember) {
        throw new Error('Permissão negada.');
    }
  }

  // Authorize data
  const leadData = {
    ...data,
    tenantId: constructorId, // Mandatory server-side
    status: data.status || 'new',
  };

  return await leadRepository.create(leadData);
}

export async function getConstructorLeadDetailAction(constructorId: string, leadId: string, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);
  
  // Authorization check: Is user an admin or a member of this constructor?
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
       throw new Error('Permissão negada. Usuário não pertence a esta construtora.');
    }
    
    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    if (!constructorDoc.exists) throw new Error('Construtora não encontrada.');
    
    const constructorData = constructorDoc.data();
    const members = constructorData?.members || [];
    const requesterMember = members.find((m: any) => m.uid === uid);
    
    if (!requesterMember) {
        throw new Error('Permissão negada. Usuário não é membro desta construtora.');
    }
  }

  const lead = await leadRepository.getById(leadId);
  if (!lead) {
    throw new Error('Cliente não encontrado.');
  }

  // Verify lead belongs to constructor tenant
  if (lead.tenantId && lead.tenantId !== constructorId) {
    throw new Error('Acesso negado. Este cliente pertence a outra construtora.');
  }

  // Fetch statusHistory subcollection if any
  let statusHistory: any[] = [];
  try {
    const historySnap = await adminDb.collection('leads').doc(leadId).collection('statusHistory').get();
    if (!historySnap.empty) {
      statusHistory = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (Array.isArray(lead.statusHistory)) {
      statusHistory = lead.statusHistory;
    }
  } catch (e) {
    if (Array.isArray(lead.statusHistory)) {
      statusHistory = lead.statusHistory;
    }
  }

  // Fetch properties of interest belonging to this constructor
  let properties: any[] = [];
  const propertyIds = lead.propertyIds || [];
  if (Array.isArray(propertyIds) && propertyIds.length > 0) {
    for (const propId of propertyIds) {
      try {
        const propDoc = await adminDb.collection('properties').doc(propId).get();
        if (propDoc.exists) {
          const propData = propDoc.data();
          // Validate property belongs to constructor (tenantId or builderId)
          if (propData?.tenantId === constructorId || propData?.builderId === constructorId) {
            properties.push({ id: propDoc.id, ...propData });
          }
        }
      } catch (err) {
        // ignore individual fetch errors
      }
    }
  }

  return serializeFirestoreData({
    lead,
    statusHistory,
    properties,
  });
}

export async function updateConstructorLeadStatusAction(
  constructorId: string,
  leadId: string,
  newStatus: string,
  idToken?: string
) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);

  // Authorization check: Is user an admin or a member of this constructor?
  if (userData?.userType !== 'admin') {
    if (userData?.tenantId !== constructorId) {
      throw new Error('Permissão negada. Usuário não pertence a esta construtora.');
    }

    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    if (!constructorDoc.exists) throw new Error('Construtora não encontrada.');

    const constructorData = constructorDoc.data();
    const members = constructorData?.members || [];
    const requesterMember = members.find((m: any) => m.uid === uid);

    if (!requesterMember) {
      throw new Error('Permissão negada. Usuário não é membro desta construtora.');
    }
  }

  const lead = await leadRepository.getById(leadId);
  if (!lead) {
    throw new Error('Cliente não encontrado.');
  }

  if (lead.tenantId && lead.tenantId !== constructorId) {
    throw new Error('Acesso negado. Este cliente pertence a outra construtora.');
  }

  const oldStatus = lead.status || 'new';
  if (oldStatus === newStatus) {
    return { success: true };
  }

  // Update lead status
  await leadRepository.update(leadId, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });

  // Add entry to statusHistory subcollection
  try {
    await adminDb.collection('leads').doc(leadId).collection('statusHistory').add({
      oldStatus,
      newStatus,
      changedBy: uid,
      changedAt: new Date().toISOString(),
    });
  } catch (e) {
    // Fallback if subcollection fails, update array field or ignore
  }

  return { success: true };
}


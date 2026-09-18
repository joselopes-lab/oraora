'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { leadRepository } from '@/repositories/lead.repository';
import { cookies, headers } from 'next/headers';

async function getRequesterUid(idToken?: string): Promise<string> {
  let requesterUid: string | null = null;
  let decoded: any = null;

  if (idToken) {
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
      requesterUid = decoded.uid;
    } catch (e: any) {
      console.warn('Falha ao verificar ID token fornecido:', e);
    }
  }

  if (!requesterUid) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        decoded = await adminAuth.verifyIdToken(token);
        requesterUid = decoded.uid;
      } catch (e) {
        console.warn('Falha ao verificar ID token do header:', e);
      }
    }
  }

  if (!requesterUid) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value || 
                          cookieStore.get('firebase-auth-token')?.value ||
                          cookieStore.get('token')?.value ||
                          cookieStore.get('auth-token')?.value;

    if (sessionCookie) {
      try {
        decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        requesterUid = decoded.uid;
      } catch {
        try {
          decoded = await adminAuth.verifyIdToken(sessionCookie);
          requesterUid = decoded.uid;
        } catch (e) {
          console.warn('Falha ao verificar token de sessão ou ID token:', e);
        }
      }
    }

    if (!requesterUid) {
      const allCookies = cookieStore.getAll();
      for (const cookie of allCookies) {
        if (cookie.name.includes('firebase') || cookie.name.includes('auth') || cookie.name.includes('session')) {
          try {
            decoded = await adminAuth.verifyIdToken(cookie.value);
            requesterUid = decoded.uid;
            if (requesterUid) break;
          } catch {}
        }
      }
    }
  }

  if (!requesterUid) {
    throw new Error('Usuário não autenticado.');
  }

  return requesterUid;
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

async function authorizeConstructorAccess(constructorId: string, idToken?: string) {
  const uid = await getRequesterUid(idToken);
  const userData = await getRequesterData(uid);

  const userType = userData?.userType;
  const tenantId = userData?.tenantId;

  console.log(`[AuthCheck Diagnostics] constructorId received: "${constructorId}" | uid: "${uid}" | userType: "${userType}" | tenantId: "${tenantId || 'none'}" | collection: "constructors"`);

  if (userType !== 'admin' && userType !== 'constructor') {
    console.warn(`[AuthCheck] Access denied for userType: ${userType}`);
    throw new Error('Permissão negada. Acesso restrito.');
  }

  // 1. Try fetching doc directly by ID
  let constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
  let lookupQueryType = 'doc(constructorId)';

  // 2. Fallback query if document does not exist by doc ID
  if (!constructorDoc.exists) {
    console.log(`[AuthCheck] Document constructors/${constructorId} not found directly. Trying fallback queries by id, tenantId, userId...`);
    
    const qId = await adminDb.collection('constructors').where('id', '==', constructorId).limit(1).get();
    if (!qId.empty) {
      constructorDoc = qId.docs[0];
      lookupQueryType = 'field "id"';
    } else {
      const qTenant = await adminDb.collection('constructors').where('tenantId', '==', constructorId).limit(1).get();
      if (!qTenant.empty) {
        constructorDoc = qTenant.docs[0];
        lookupQueryType = 'field "tenantId"';
      } else {
        const qUser = await adminDb.collection('constructors').where('userId', '==', constructorId).limit(1).get();
        if (!qUser.empty) {
          constructorDoc = qUser.docs[0];
          lookupQueryType = 'field "userId"';
        }
      }
    }
  }

  console.log(`[AuthCheck Diagnostics] Lookup method: ${lookupQueryType} | Document exists: ${constructorDoc.exists} | Document ID: ${constructorDoc.exists ? constructorDoc.id : 'N/A'}`);

  if (!constructorDoc.exists) {
    console.warn(`[AuthCheck] Construtora "${constructorId}" não encontrada no Firestore após buscas exaustivas.`);
    throw new Error('Construtora não encontrada.');
  }

  const constructorData = constructorDoc.data();
  const actualTenantId = constructorData?.tenantId || constructorDoc.id;

  if (userType === 'constructor') {
    if (tenantId && tenantId !== constructorId && tenantId !== actualTenantId && constructorData?.ownerId !== uid) {
      console.warn(`[AuthCheck] Constructor tenantId mismatch: user tenantId (${tenantId}) vs constructorId (${constructorId})`);
      throw new Error('Permissão negada. Usuário não pertence a esta construtora.');
    }
    const members = constructorData?.members || [];
    const requesterMember = members.find((m: any) => m.uid === uid);
    if (!requesterMember && constructorData?.ownerId !== uid && tenantId !== actualTenantId) {
      console.warn(`[AuthCheck] Constructor user ${uid} is not a member or owner of constructor ${constructorId}`);
      throw new Error('Permissão negada. Usuário não é membro desta construtora.');
    }
  }

  return { uid, userData, constructorDoc };
}

export async function listConstructorLeadsAction(constructorId: string, idToken?: string) {
  await authorizeConstructorAccess(constructorId, idToken);
  const leads = await leadRepository.listByTenant(constructorId);
  return serializeFirestoreData(leads);
}

export async function listConstructorPropertiesAction(constructorId: string, idToken?: string) {
  await authorizeConstructorAccess(constructorId, idToken);

  const snap1 = await adminDb.collection('properties').where('tenantId', '==', constructorId).get();
  const snap2 = await adminDb.collection('properties').where('builderId', '==', constructorId).get();
  
  const map = new Map();
  snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  
  return serializeFirestoreData(Array.from(map.values()));
}

export async function listConstructorProjectsAction(constructorId: string, idToken?: string) {
  await authorizeConstructorAccess(constructorId, idToken);

  const snap = await adminDb.collection('projects').where('builderId', '==', constructorId).get();
  const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return serializeFirestoreData(projects);
}

export async function createConstructorLeadAction(constructorId: string, data: any, idToken?: string) {
  await authorizeConstructorAccess(constructorId, idToken);

  // Authorize data
  const leadData = {
    ...data,
    tenantId: constructorId, // Mandatory server-side
    status: data.status || 'new',
  };

  return await leadRepository.create(leadData);
}

export async function getConstructorLeadDetailAction(constructorId: string, leadId: string, idToken?: string) {
  await authorizeConstructorAccess(constructorId, idToken);

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
  const { uid } = await authorizeConstructorAccess(constructorId, idToken);

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

export async function getConstructorDashboardDataAction(constructorId: string, idToken?: string) {
  const { constructorDoc } = await authorizeConstructorAccess(constructorId, idToken);

  const constructorData = constructorDoc.exists ? { id: constructorDoc.id, ...constructorDoc.data() } : null;

  const propTenantSnap = await adminDb.collection('properties').where('tenantId', '==', constructorId).get();
  const propBuilderSnap = await adminDb.collection('properties').where('builderId', '==', constructorId).get();
  const propMap = new Map<string, any>();
  propTenantSnap.docs.forEach(d => propMap.set(d.id, { id: d.id, ...d.data() }));
  propBuilderSnap.docs.forEach(d => propMap.set(d.id, { id: d.id, ...d.data() }));
  const properties = Array.from(propMap.values());

  const projTenantSnap = await adminDb.collection('projects').where('tenantId', '==', constructorId).get();
  const projBuilderSnap = await adminDb.collection('projects').where('builderId', '==', constructorId).get();
  const projMap = new Map<string, any>();
  projTenantSnap.docs.forEach(d => projMap.set(d.id, { id: d.id, ...d.data() }));
  projBuilderSnap.docs.forEach(d => projMap.set(d.id, { id: d.id, ...d.data() }));
  const projects = Array.from(projMap.values());

  const priceSnap = await adminDb.collection('priceTables').where('tenantId', '==', constructorId).get();
  const priceTables = priceSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const usersSnap = await adminDb.collection('users').where('tenantId', '==', constructorId).get();
  const constructorUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const leads = await leadRepository.listByTenant(constructorId);

  return serializeFirestoreData({
    constructorData,
    properties,
    projects,
    priceTables,
    constructorUsers,
    leads,
  });
}



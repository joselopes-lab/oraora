'use server';

import { adminAuth, adminDb, FieldValue } from '@/firebase/index.server';
import { cookies, headers } from 'next/headers';
import { validatePasswordPolicy } from './validation';

/**
 * Autentica o usuário no servidor verificando token via idToken explícito,
 * header Authorization Bearer ou cookies de sessão.
 */
export async function getAuthenticatedUser(providedToken?: string | null) {
  let token = providedToken;

  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    } catch {}
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('session')?.value ||
              cookieStore.get('firebase-auth-token')?.value ||
              cookieStore.get('__session')?.value ||
              cookieStore.get('firebase-session-cookie')?.value;
    } catch {}
  }

  if (!token) {
    throw new Error('Não autorizado: Token de autenticação não fornecido.');
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (idTokenError) {
    try {
      const decoded = await adminAuth.verifySessionCookie(token, true);
      return decoded;
    } catch (sessionError) {
      throw new Error('Não autorizado: Falha na verificação da credencial de sessão.');
    }
  }
}

export async function requireAgencyAuth(requiredRole?: 'owner' | 'manager' | 'broker', providedToken?: string | null) {
  const decoded = await getAuthenticatedUser(providedToken);
  const uid = decoded.uid;

  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new Error('Usuário não encontrado.');
  }
  const userData = userDoc.data() || {};
  const agencyId = userData.agencyId;

  if (!agencyId) {
    throw new Error('Usuário não está vinculado a nenhuma imobiliária.');
  }

  // Buscar membership ativa
  const memberQuery = await adminDb
    .collection('imobiliaria_members')
    .where('agencyId', '==', agencyId)
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (memberQuery.empty) {
    throw new Error('Membership ativa não encontrada para este usuário na organização.');
  }

  const memberData = memberQuery.docs[0].data();
  const role = memberData.role;

  if (requiredRole) {
    if (requiredRole === 'owner' && role !== 'owner') {
      throw new Error('Acesso negado: Requer privilégio de Proprietário (Owner).');
    }
    if (requiredRole === 'manager' && role !== 'owner' && role !== 'manager') {
      throw new Error('Acesso negado: Requer privilégio de Gestor ou Proprietário.');
    }
  }

  return { uid, agencyId, role, userData };
}

/**
 * Cria convite de forma inequivocamente idempotente.
 * Utiliza um lock determinístico em `imobiliaria_active_invite_locks/${agencyId}_${targetUserId}`
 * dentro de uma transação Firestore para garantir que duas requisições simultâneas
 * não consigam criar convites pendentes duplicados, enquanto preserva todo o histórico em `imobiliaria_invites`.
 */
export async function inviteBrokerServer(
  targetEmail: string,
  roleOrToken?: 'broker' | 'manager' | string | null,
  providedToken?: string | null
) {
  let targetRole: 'broker' | 'manager' = 'broker';
  let token: string | null | undefined = providedToken;

  if (typeof roleOrToken === 'string') {
    if (roleOrToken === 'broker' || roleOrToken === 'manager') {
      targetRole = roleOrToken;
    } else if (!providedToken) {
      token = roleOrToken;
    }
  }

  if (targetRole !== 'broker' && targetRole !== 'manager') {
    throw new Error('Função inválida. Apenas Corretor ou Gestor são permitidos.');
  }

  // 1. Autorização: Apenas Gestor ou Proprietário com permissão pode adicionar membros
  const auth = await requireAgencyAuth('manager', token);
  const agencyId = auth.agencyId;
  const email = targetEmail.trim().toLowerCase();

  if (!email) {
    throw new Error('E-mail inválido.');
  }

  // 2. FLUXO 1: Verificar server-side se existe usuário
  const userQuery = await adminDb.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) {
    throw new Error('Nenhum usuário com perfil de corretor cadastrado com este e-mail no OraOra. O profissional precisa possuir uma conta de corretor na plataforma para ser convidado.');
  }

  const targetUserDoc = userQuery.docs[0];
  const targetUserData = targetUserDoc.data();
  const targetUserId = targetUserDoc.id;

  // 3. Confirmar que é um usuário compatível com vínculo de corretor (userType = broker)
  if (targetUserData.userType !== 'broker') {
    throw new Error('O usuário encontrado não possui o perfil de corretor (broker).');
  }

  // 4. Verificar trava determinística de membership ativa: imobiliaria_user_active_memberships/{uid}
  const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(targetUserId);
  const activeLockSnap = await userActiveMembershipLockRef.get();
  if (activeLockSnap.exists && activeLockSnap.data()?.status === 'active') {
    const activeAgencyId = activeLockSnap.data()?.agencyId;
    if (activeAgencyId === agencyId) {
      throw new Error('Este corretor já é membro ativo da sua equipe.');
    } else {
      throw new Error('Este corretor já possui um vínculo ativo com outra imobiliária.');
    }
  }

  // 5. Verificar se já possui membership ativa na collection imobiliaria_members
  const existingActiveMemberQuery = await adminDb.collection('imobiliaria_members')
    .where('userId', '==', targetUserId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!existingActiveMemberQuery.empty) {
    const activeAgencyId = existingActiveMemberQuery.docs[0].data()?.agencyId;
    if (activeAgencyId === agencyId) {
      throw new Error('Este corretor já é membro ativo da sua equipe.');
    } else {
      throw new Error('Este corretor já possui um vínculo ativo com outra imobiliária.');
    }
  }

  // 6. Verificar se o documento do usuário já possui agencyId vinculado
  if (targetUserData.agencyId) {
    if (targetUserData.agencyId === agencyId) {
      throw new Error('Este corretor já está vinculado à sua imobiliária.');
    } else {
      throw new Error('Este corretor já possui um vínculo ativo com outra imobiliária.');
    }
  }

  // 7. Se já existe convite pendente nesta imobiliária, impedir duplicidade
  const existingInviteQuery = await adminDb.collection('imobiliaria_invites')
    .where('agencyId', '==', agencyId)
    .where('targetUserId', '==', targetUserId)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingInviteQuery.empty) {
    throw new Error('Já existe um convite pendente para este corretor nesta imobiliária.');
  }

  const lockRef = adminDb.collection('imobiliaria_active_invite_locks').doc(`${agencyId}_${targetUserId}`);
  const inviteRef = adminDb.collection('imobiliaria_invites').doc();

  return await adminDb.runTransaction(async (transaction) => {
    const lockDoc = await transaction.get(lockRef);
    if (lockDoc.exists && lockDoc.data()?.status === 'pending') {
      throw new Error('Já existe um convite pendente para este corretor nesta imobiliária.');
    }

    const now = adminDb.firestore.FieldValue.serverTimestamp();

    // Criar convite histórico em imobiliaria_invites
    transaction.set(inviteRef, {
      agencyId,
      email,
      targetUserId,
      targetUserName: targetUserData.username || targetUserData.name || null,
      role: targetRole,
      status: 'pending',
      invitedBy: auth.uid,
      createdAt: now,
      updatedAt: now
    });

    // Definir trava determinística de convite ativo
    transaction.set(lockRef, {
      agencyId,
      targetUserId,
      inviteId: inviteRef.id,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    return { 
      success: true, 
      inviteId: inviteRef.id, 
      isExistingUser: true 
    };
  });
}

/**
 * Aceita um convite de imobiliária com atomicidade e garantia de vínculo ativo único.
 * Utiliza trava determinística em `imobiliaria_user_active_memberships/${uid}` para impedir
 * que o mesmo corretor possua múltiplos vínculos ativos por concorrência.
 */
export async function acceptInviteServer(inviteId: string, providedToken?: string | null) {
  const decoded = await getAuthenticatedUser(providedToken);
  const uid = decoded.uid;
  const userEmail = decoded.email?.toLowerCase();

  const inviteRef = adminDb.collection('imobiliaria_invites').doc(inviteId);
  const userRef = adminDb.collection('users').doc(uid);
  const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(uid);

  return await adminDb.runTransaction(async (transaction) => {
    // 1. Ler convite
    const inviteDoc = await transaction.get(inviteRef);
    if (!inviteDoc.exists) {
      throw new Error('Convite não encontrado.');
    }

    const inviteData = inviteDoc.data() || {};
    if (inviteData.status !== 'pending') {
      throw new Error('Este convite não está mais pendente.');
    }

    if (inviteData.targetUserId && inviteData.targetUserId !== uid) {
      throw new Error('Este convite foi destinado a outro usuário.');
    }

    if (inviteData.email && userEmail && inviteData.email !== userEmail) {
      throw new Error('O e-mail do convite não confere com sua conta.');
    }

    const agencyId = inviteData.agencyId;
    const inviteLockRef = adminDb.collection('imobiliaria_active_invite_locks').doc(`${agencyId}_${uid}`);

    // 2. Verificar trava determinística de vínculo ativo do usuário
    const activeMembershipLock = await transaction.get(userActiveMembershipLockRef);
    if (activeMembershipLock.exists && activeMembershipLock.data()?.status === 'active') {
      throw new Error('Você já possui um vínculo ativo com uma imobiliária.');
    }

    // 3. Ler documento do usuário
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('Usuário não encontrado.');
    }
    const userData = userDoc.data() || {};

    if (userData.userType !== 'broker') {
      throw new Error('Apenas corretores podem aceitar convites de imobiliária.');
    }

    if (userData.agencyId) {
      throw new Error('Você já possui vínculo ativo com uma imobiliária.');
    }

    const memberRef = adminDb.collection('imobiliaria_members').doc();
    const now = adminDb.firestore.FieldValue.serverTimestamp();

    // 4. Atualizar o convite histórico
    transaction.update(inviteRef, {
      status: 'accepted',
      acceptedAt: now,
      updatedAt: now
    });

    // 5. Atualizar a trava do convite pendente para inativa
    transaction.set(inviteLockRef, {
      agencyId,
      targetUserId: uid,
      inviteId: inviteRef.id,
      status: 'accepted',
      updatedAt: now
    }, { merge: true });

    // 6. Criar registro histórico de membership
    transaction.set(memberRef, {
      agencyId,
      userId: uid,
      role: inviteData.role || 'broker',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // 7. Definir trava determinística de membership ativa por usuário
    transaction.set(userActiveMembershipLockRef, {
      userId: uid,
      agencyId,
      memberId: memberRef.id,
      status: 'active',
      joinedAt: now,
      updatedAt: now
    });

    // 8. Atualizar o documento do usuário mantendo o userType = 'broker'
    transaction.update(userRef, {
      agencyId,
      role: inviteData.role || 'broker',
    });

    return { success: true, agencyId };
  });
}

/**
 * Recusa um convite de imobiliária de forma atômica e atualiza a trava do convite.
 */
export async function declineInviteServer(inviteId: string, providedToken?: string | null) {
  const decoded = await getAuthenticatedUser(providedToken);
  const uid = decoded.uid;

  const inviteRef = adminDb.collection('imobiliaria_invites').doc(inviteId);
  
  return await adminDb.runTransaction(async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);
    if (!inviteDoc.exists) {
      throw new Error('Convite não encontrado.');
    }

    const inviteData = inviteDoc.data() || {};
    if (inviteData.targetUserId && inviteData.targetUserId !== uid) {
      throw new Error('Não autorizado a recusar este convite.');
    }

    if (inviteData.status !== 'pending') {
      throw new Error('Este convite não está pendente.');
    }

    const now = adminDb.firestore.FieldValue.serverTimestamp();
    const agencyId = inviteData.agencyId;
    const inviteLockRef = adminDb.collection('imobiliaria_active_invite_locks').doc(`${agencyId}_${uid}`);

    transaction.update(inviteRef, {
      status: 'declined',
      declinedAt: now,
      updatedAt: now
    });

    transaction.set(inviteLockRef, {
      agencyId,
      targetUserId: uid,
      inviteId: inviteRef.id,
      status: 'declined',
      updatedAt: now
    }, { merge: true });

    return { success: true };
  });
}

export interface AgencyClientDTO {
  id: string;
  name: string;
  ownerUid: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgencyMemberClientDTO {
  id: string;
  agencyId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function serializeDate(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000).toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  return null;
}

function serializeAgency(id: string, data: any): AgencyClientDTO {
  return {
    id,
    name: data?.name || 'Minha Imobiliária',
    ownerUid: data?.ownerUid || '',
    status: data?.status || 'active',
    createdAt: serializeDate(data?.createdAt) || new Date().toISOString(),
    updatedAt: serializeDate(data?.updatedAt) || new Date().toISOString(),
  };
}

function serializeMember(id: string, data: any): AgencyMemberClientDTO {
  return {
    id,
    agencyId: data?.agencyId || '',
    userId: data?.userId || '',
    role: data?.role || 'broker',
    status: data?.status || 'active',
    joinedAt: serializeDate(data?.joinedAt),
    leftAt: serializeDate(data?.leftAt),
    createdAt: serializeDate(data?.createdAt),
    updatedAt: serializeDate(data?.updatedAt),
  };
}

/**
 * Garante que a imobiliária e a membership do usuário existam.
 * Idempotente: se já existe, apenas retorna os dados serializados.
 * Se o usuário foi criado pelo Admin e já tem agencyId, apenas vincula.
 */
export async function ensureAgencyServer(providedToken?: string | null): Promise<{
  success: boolean;
  agency: AgencyClientDTO;
  members: AgencyMemberClientDTO[];
}> {
  console.info('[AGENCY SERVER AUTH TRACE]', {
    hasProvidedToken: !!providedToken
  });
  const decoded = await getAuthenticatedUser(providedToken);
  const uid = decoded.uid;

  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error('Usuário não encontrado.');
  }

  const userData = userDoc.data() || {};
  let agencyId = userData.agencyId;
  let rawAgencyData: any = null;

  // 1. Se tem agencyId, buscar os dados
  if (agencyId) {
    const agencyDoc = await adminDb.collection('imobiliarias').doc(agencyId).get();
    if (agencyDoc.exists) {
      rawAgencyData = agencyDoc.data();
    }
  }

  // 2. Se não encontrou por agencyId, buscar por ownerUid (idempotência)
  if (!rawAgencyData) {
    const agencyQuery = await adminDb.collection('imobiliarias')
      .where('ownerUid', '==', uid)
      .limit(1)
      .get();
    
    if (!agencyQuery.empty) {
      const doc = agencyQuery.docs[0];
      rawAgencyData = doc.data();
      agencyId = doc.id;
    }
  }

  // 3. Se ainda não existe, criar nova (inicialização)
  if (!rawAgencyData) {
    const newAgencyRef = adminDb.collection('imobiliarias').doc();
    agencyId = newAgencyRef.id;
    const now = FieldValue.serverTimestamp();

    const agencyPayload = {
      name: `${userData.username || 'Minha'} Imobiliária`,
      ownerUid: uid,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const memberRef = adminDb.collection('imobiliaria_members').doc();
    const memberPayload = {
      agencyId: agencyId,
      userId: uid,
      role: 'owner',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now
    };

    const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(uid);

    await adminDb.runTransaction(async (transaction) => {
      transaction.set(newAgencyRef, agencyPayload);
      transaction.set(memberRef, memberPayload);
      transaction.update(userRef, { agencyId: agencyId, role: 'owner' });
      
      // Trava determinística de membership ativa
      transaction.set(userActiveMembershipLockRef, {
        userId: uid,
        agencyId,
        memberId: memberRef.id,
        status: 'active',
        joinedAt: now,
        updatedAt: now
      });
    });

    rawAgencyData = {
      ...agencyPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 4. Buscar membros ativos
  const membersSnap = await adminDb.collection('imobiliaria_members')
    .where('agencyId', '==', agencyId)
    .where('status', '==', 'active')
    .get();
  
  const serializedAgency = serializeAgency(agencyId, rawAgencyData);
  const serializedMembers = membersSnap.docs.map(m => serializeMember(m.id, m.data()));

  return { 
    success: true, 
    agency: serializedAgency, 
    members: serializedMembers 
  };
}

export interface AgencyTeamMemberDTO {
  id: string;
  userId: string;
  agencyId: string;
  role: 'owner' | 'manager' | 'broker';
  status: 'active' | 'suspended' | 'inactive';
  name: string;
  email: string;
  phone: string | null;
  creci: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  joinedAt: string | null;
  createdAt: string | null;
}

export interface AgencyInviteDTO {
  id: string;
  agencyId: string;
  email: string;
  targetUserId: string | null;
  targetUserName: string | null;
  role: 'broker' | 'manager';
  status: 'pending';
  createdAt: string | null;
}

export interface AgencyTeamDataDTO {
  agency: {
    id: string;
    name: string;
    ownerUid: string;
    status: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  currentMemberRole: 'owner' | 'manager' | 'broker';
  summary: {
    total: number;
    active: number;
    pendingInvites: number;
    suspended: number;
  };
  members: AgencyTeamMemberDTO[];
  invites: AgencyInviteDTO[];
}

/**
 * Lista todos os membros e convites pendentes da equipe da imobiliária autenticada.
 */
export async function listAgencyTeamServer(providedToken?: string | null): Promise<{
  success: boolean;
  teamData: AgencyTeamDataDTO;
}> {
  const auth = await requireAgencyAuth(undefined, providedToken);
  const agencyId = auth.agencyId;
  const currentMemberRole = auth.role as 'owner' | 'manager' | 'broker';

  // 1. Dados da imobiliária
  const agencyDoc = await adminDb.collection('imobiliarias').doc(agencyId).get();
  const agencyData = agencyDoc.data() || {};
  const agency = {
    id: agencyId,
    name: agencyData.name || 'Minha Imobiliária',
    ownerUid: agencyData.ownerUid || '',
    status: agencyData.status || 'active',
    createdAt: serializeDate(agencyData.createdAt),
    updatedAt: serializeDate(agencyData.updatedAt)
  };

  // 2. Membros da imobiliária
  const membersSnap = await adminDb.collection('imobiliaria_members')
    .where('agencyId', '==', agencyId)
    .get();

  const userIds = membersSnap.docs.map(d => d.data().userId).filter(Boolean);

  const usersMap = new Map<string, any>();
  const brokersMap = new Map<string, any>();

  if (userIds.length > 0) {
    const userDocs = await Promise.all(userIds.map(id => adminDb.collection('users').doc(id).get()));
    userDocs.forEach(snap => {
      if (snap.exists) usersMap.set(snap.id, snap.data());
    });

    const brokerDocs = await Promise.all(userIds.map(id => adminDb.collection('brokers').doc(id).get()));
    brokerDocs.forEach(snap => {
      if (snap.exists) brokersMap.set(snap.id, snap.data());
    });
  }

  const members: AgencyTeamMemberDTO[] = membersSnap.docs.map(doc => {
    const data = doc.data();
    const userId = data.userId;
    const userDocData = usersMap.get(userId) || {};
    const brokerDocData = brokersMap.get(userId) || {};

    return {
      id: doc.id,
      userId,
      agencyId,
      role: (data.role || 'broker') as 'owner' | 'manager' | 'broker',
      status: (data.status || 'active') as 'active' | 'suspended' | 'inactive',
      name: userDocData.username || userDocData.name || brokerDocData.name || 'Corretor',
      email: userDocData.email || '',
      phone: userDocData.phone || userDocData.whatsapp || brokerDocData.phone || brokerDocData.whatsapp || null,
      creci: brokerDocData.creci || userDocData.creci || null,
      avatarUrl: brokerDocData.avatarUrl || userDocData.avatarUrl || null,
      isOwner: data.role === 'owner' || userId === agency.ownerUid,
      joinedAt: serializeDate(data.joinedAt),
      createdAt: serializeDate(data.createdAt),
    };
  });

  // 3. Convites pendentes
  const invitesSnap = await adminDb.collection('imobiliaria_invites')
    .where('agencyId', '==', agencyId)
    .where('status', '==', 'pending')
    .get();

  const invites: AgencyInviteDTO[] = invitesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      agencyId,
      email: data.email || '',
      targetUserId: data.targetUserId || null,
      targetUserName: data.targetUserName || null,
      role: (data.role || 'broker') as 'broker' | 'manager',
      status: 'pending',
      createdAt: serializeDate(data.createdAt)
    };
  });

  // 4. Resumo métrico
  const activeCount = members.filter(m => m.status === 'active').length;
  const suspendedCount = members.filter(m => m.status === 'suspended' || m.status === 'inactive').length;
  const pendingInvitesCount = invites.length;
  const totalCount = members.length;

  return {
    success: true,
    teamData: {
      agency,
      currentMemberRole,
      summary: {
        total: totalCount,
        active: activeCount,
        pendingInvites: pendingInvitesCount,
        suspended: suspendedCount
      },
      members,
      invites
    }
  };
}

/**
 * Cancela um convite pendente da imobiliária.
 */
export async function cancelInviteServer(inviteId: string, providedToken?: string | null) {
  const auth = await requireAgencyAuth('manager', providedToken);
  const agencyId = auth.agencyId;

  const inviteRef = adminDb.collection('imobiliaria_invites').doc(inviteId);

  return await adminDb.runTransaction(async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);
    if (!inviteDoc.exists) {
      throw new Error('Convite não encontrado.');
    }

    const inviteData = inviteDoc.data() || {};
    if (inviteData.agencyId !== agencyId) {
      throw new Error('Não autorizado a cancelar convite de outra organização.');
    }

    if (inviteData.status !== 'pending') {
      throw new Error('Apenas convites pendentes podem ser cancelados.');
    }

    const now = FieldValue.serverTimestamp();

    transaction.update(inviteRef, {
      status: 'cancelled',
      cancelledAt: now,
      cancelledBy: auth.uid,
      updatedAt: now
    });

    if (inviteData.targetUserId) {
      const lockRef = adminDb.collection('imobiliaria_active_invite_locks').doc(`${agencyId}_${inviteData.targetUserId}`);
      transaction.set(lockRef, {
        agencyId,
        targetUserId: inviteData.targetUserId,
        inviteId: inviteRef.id,
        status: 'cancelled',
        updatedAt: now
      }, { merge: true });
    }

    return { success: true };
  });
}

/**
 * Atualiza o papel de um membro da equipe (Apenas Proprietário).
 */
export async function updateAgencyMemberRoleServer(
  memberId: string,
  newRole: 'broker' | 'manager',
  providedToken?: string | null
) {
  const auth = await requireAgencyAuth('owner', providedToken);
  const agencyId = auth.agencyId;

  if (newRole !== 'broker' && newRole !== 'manager') {
    throw new Error('Função inválida. Apenas Corretor ou Gestor são permitidos.');
  }

  const memberRef = adminDb.collection('imobiliaria_members').doc(memberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    throw new Error('Membro não encontrado.');
  }

  const memberData = memberDoc.data() || {};
  if (memberData.agencyId !== agencyId) {
    throw new Error('Não autorizado a alterar membros de outra organização.');
  }

  if (memberData.role === 'owner' || memberData.userId === auth.uid) {
    throw new Error('O proprietário da imobiliária não pode ter seu papel alterado.');
  }

  const now = FieldValue.serverTimestamp();

  await adminDb.runTransaction(async (transaction) => {
    transaction.update(memberRef, {
      role: newRole,
      updatedAt: now
    });

    const userRef = adminDb.collection('users').doc(memberData.userId);
    transaction.update(userRef, {
      role: newRole
    });
  });

  return { success: true };
}

/**
 * Suspende o vínculo de um membro da equipe (Apenas Proprietário).
 */
export async function suspendAgencyMemberServer(
  memberId: string,
  providedToken?: string | null
) {
  const auth = await requireAgencyAuth('owner', providedToken);
  const agencyId = auth.agencyId;

  const memberRef = adminDb.collection('imobiliaria_members').doc(memberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    throw new Error('Membro não encontrado.');
  }

  const memberData = memberDoc.data() || {};
  if (memberData.agencyId !== agencyId) {
    throw new Error('Não autorizado.');
  }

  if (memberData.role === 'owner' || memberData.userId === auth.uid) {
    throw new Error('O proprietário não pode ser suspenso da imobiliária.');
  }

  const now = FieldValue.serverTimestamp();
  const userId = memberData.userId;
  const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(userId);
  const userRef = adminDb.collection('users').doc(userId);

  await adminDb.runTransaction(async (transaction) => {
    transaction.update(memberRef, {
      status: 'suspended',
      leftAt: now,
      updatedAt: now
    });

    transaction.set(userActiveMembershipLockRef, {
      userId,
      agencyId,
      memberId,
      status: 'suspended',
      leftAt: now,
      updatedAt: now
    }, { merge: true });

    transaction.update(userRef, {
      agencyId: null,
      role: null
    });
  });

  return { success: true };
}

/**
 * Reativa um membro suspenso (Apenas Proprietário).
 */
export async function reactivateAgencyMemberServer(
  memberId: string,
  providedToken?: string | null
) {
  const auth = await requireAgencyAuth('owner', providedToken);
  const agencyId = auth.agencyId;

  const memberRef = adminDb.collection('imobiliaria_members').doc(memberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    throw new Error('Membro não encontrado.');
  }

  const memberData = memberDoc.data() || {};
  if (memberData.agencyId !== agencyId) {
    throw new Error('Não autorizado.');
  }

  const userId = memberData.userId;
  const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(userId);
  const userRef = adminDb.collection('users').doc(userId);

  // Verificar se o usuário já possui outro vínculo ativo com outra imobiliária
  const activeLockSnap = await userActiveMembershipLockRef.get();
  if (activeLockSnap.exists && activeLockSnap.data()?.status === 'active' && activeLockSnap.data()?.agencyId !== agencyId) {
    throw new Error('Este corretor já possui um vínculo ativo com outra imobiliária.');
  }

  const now = FieldValue.serverTimestamp();

  await adminDb.runTransaction(async (transaction) => {
    transaction.update(memberRef, {
      status: 'active',
      leftAt: null,
      updatedAt: now
    });

    transaction.set(userActiveMembershipLockRef, {
      userId,
      agencyId,
      memberId,
      status: 'active',
      joinedAt: now,
      updatedAt: now
    });

    transaction.update(userRef, {
      agencyId,
      role: memberData.role || 'broker'
    });
  });

  return { success: true };
}



export async function createBrokerWithAuthServer(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'broker' | 'manager';
}, providedToken?: string | null) {
  const auth = await requireAgencyAuth('manager', providedToken);
  const agencyId = auth.agencyId;

  const name = formData.name?.trim();
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password;
  const confirmPassword = formData.confirmPassword;
  const role = formData.role || 'broker';

  if (!name || !email || !password || !confirmPassword) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }

  if (role !== 'broker' && role !== 'manager') {
    throw new Error('Função inválida.');
  }

  if (password !== confirmPassword) {
    throw new Error('As senhas não conferem.');
  }

  const passwordCheck = validatePasswordPolicy(password);
  if (!passwordCheck.isValid) {
    throw new Error(`Senha fraca: ${passwordCheck.errors.join(' ')}`);
  }

  let novoUid: string;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });
    novoUid = userRecord.uid;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-exists' || err?.message?.includes('already exists')) {
      throw new Error('Já existe uma conta no OraOra com este e-mail.');
    }
    throw new Error(err?.message || 'Erro ao criar conta de acesso do corretor.');
  }

  const userRef = adminDb.collection('users').doc(novoUid);
  const memberRef = adminDb.collection('imobiliaria_members').doc();
  const userActiveMembershipLockRef = adminDb.collection('imobiliaria_user_active_memberships').doc(novoUid);

  try {
    const now = FieldValue.serverTimestamp();

    await adminDb.runTransaction(async (transaction) => {
      const existingUserDoc = await transaction.get(userRef);
      if (existingUserDoc.exists) {
        throw new Error('Usuário já cadastrado no banco de dados.');
      }

      transaction.set(userRef, {
        id: novoUid,
        username: name,
        email,
        userType: 'broker',
        agencyId,
        role,
        createdAt: now,
        updatedAt: now
      });

      transaction.set(memberRef, {
        agencyId,
        userId: novoUid,
        role,
        status: 'active',
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
        leftAt: null
      });

      transaction.set(userActiveMembershipLockRef, {
        userId: novoUid,
        agencyId,
        memberId: memberRef.id,
        status: 'active',
        joinedAt: now,
        updatedAt: now,
        leftAt: null
      });
    });

    return { success: true, userId: novoUid };
  } catch (firestoreError: any) {
    try {
      await adminAuth.deleteUser(novoUid);
    } catch (cleanupErr) {
      console.error('Failed to cleanup orphaned Firebase Auth user during rollback:', cleanupErr);
    }
    throw new Error(firestoreError.message || 'Erro ao persistir dados do corretor. Operação cancelada.');
  }
}


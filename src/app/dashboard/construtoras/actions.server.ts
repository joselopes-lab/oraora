'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { projectRepository } from '@/repositories/project.repository';

const createMemberSchema = z.object({
  constructorId: z.string().min(1, 'ID da construtora obrigatório'),
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'gerente', 'vendas', 'marketing']),
  idToken: z.string().optional(),
});

export async function createConstructorMemberServer(formData: {
  constructorId: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'gerente' | 'vendas' | 'marketing';
  idToken?: string;
}) {
  try {
    // 1. Validate input data with Zod
    const validationResult = createMemberSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      throw new Error(`Dados inválidos: ${errorMessage}`);
    }

    const { constructorId, name, email, password, role, idToken } = validationResult.data;

    let requesterUid: string | null = null;

    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        requesterUid = decodedToken.uid;
      } catch (e) {
        console.warn('Falha ao verificar ID token fornecido:', e);
      }
    }

    // 2. Extract authorization header or session cookie as fallback
    if (!requesterUid) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        requesterUid = decodedToken.uid;
      } else {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
        if (sessionCookie) {
          try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
            requesterUid = decodedClaims.uid;
          } catch {
            // If session cookie verification fails, try as ID token
            try {
              const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
              requesterUid = decodedToken.uid;
            } catch (e) {
              console.warn('Falha ao verificar token de sessão:', e);
            }
          }
        }
      }
    }

    if (!requesterUid) {
      throw new Error('Usuário não autenticado no servidor.');
    }

    // 3. Verify requester user document in Firestore
    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists) {
      throw new Error('Perfil do usuário solicitante não encontrado.');
    }

    const requesterData = requesterDoc.data();
    const requesterUserType = requesterData?.userType;
    const requesterTenantId = requesterData?.tenantId;

    // Check if requester has userType: constructor or admin
    if (requesterUserType !== 'admin' && requesterUserType !== 'constructor') {
      throw new Error('Permissão negada. Apenas administradores ou construtoras podem gerenciar membros.');
    }

    // If not global admin, verify tenantId matches constructorId and user is admin in constructor members
    if (requesterUserType !== 'admin') {
      if (!requesterTenantId || requesterTenantId !== constructorId) {
        throw new Error('Permissão negada. O usuário solicitante não pertence a esta construtora.');
      }

      // Verify constructor document and member role
      const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
      if (!constructorDoc.exists) {
        throw new Error('Construtora não encontrada.');
      }

      const constructorData = constructorDoc.data();
      const members = constructorData?.members || [];
      const requesterMember = members.find((m: any) => m.uid === requesterUid);

      if (!requesterMember || requesterMember.role !== 'admin') {
        throw new Error('Permissão negada. Apenas administradores da construtora podem cadastrar novos membros.');
      }
    }

    // 4. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const newUid = userRecord.uid;

    // 5. Create users/{uid} document
    const userDocRef = adminDb.collection('users').doc(newUid);
    await userDocRef.set({
      id: newUid,
      username: name,
      email: email,
      userType: 'constructor',
      tenantId: constructorId,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 6. Add user to constructors/{constructorId}.members
    const constructorDocRef = adminDb.collection('constructors').doc(constructorId);
    await constructorDocRef.update({
      members: FieldValue.arrayUnion({ uid: newUid, role }),
    });

    revalidatePath(`/dashboard/construtoras/${constructorId}`);
    return { success: true, uid: newUid };
  } catch (error: any) {
    console.error('Erro ao criar membro da construtora:', error);
    return { success: false, error: error.message || 'Erro ao criar usuário.' };
  }
}

export async function checkConstructorDuplicateServer(cnpj?: string, email?: string, excludeId?: string) {
  try {
    let cnpjExists = false;
    let emailExists = false;

    if (cnpj) {
      const cnpjQuery = await adminDb.collection('constructors').where('cnpj', '==', cnpj).get();
      if (!cnpjQuery.empty) {
        if (!excludeId || cnpjQuery.docs.some(doc => doc.id !== excludeId)) {
          cnpjExists = true;
        }
      }
    }

    if (email) {
      const emailQuery = await adminDb.collection('constructors').where('publicEmail', '==', email).get();
      if (!emailQuery.empty) {
        if (!excludeId || emailQuery.docs.some(doc => doc.id !== excludeId)) {
          emailExists = true;
        }
      }
      // Also check users collection if email is used for access
      const userEmailQuery = await adminDb.collection('users').where('email', '==', email).get();
      if (!userEmailQuery.empty) {
        emailExists = true;
      }
    }

    return { success: true, cnpjExists, emailExists };
  } catch (error: any) {
    console.error('Erro ao verificar duplicidade:', error);
    return { success: false, error: error.message };
  }
}

export async function getConstructorProjectsServer(constructorId: string, idToken?: string) {
  try {
    let requesterUid: string | null = null;

    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        requesterUid = decodedToken.uid;
      } catch (e) {
        console.warn('Falha ao verificar ID token fornecido:', e);
      }
    }

    if (!requesterUid) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        requesterUid = decodedToken.uid;
      } else {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value || 
                              cookieStore.get('firebase-auth-token')?.value ||
                              cookieStore.get('token')?.value ||
                              cookieStore.get('auth-token')?.value;
        if (sessionCookie) {
          try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
            requesterUid = decodedClaims.uid;
          } catch {
            try {
              const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
              requesterUid = decodedToken.uid;
            } catch (e) {
              console.warn('Falha ao verificar token de sessão:', e);
            }
          }
        }

        if (!requesterUid) {
          const allCookies = cookieStore.getAll();
          for (const cookie of allCookies) {
            if (cookie.name.includes('firebase') || cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.includes('token')) {
              try {
                const decodedToken = await adminAuth.verifyIdToken(cookie.value);
                requesterUid = decodedToken.uid;
                if (requesterUid) break;
              } catch {}
            }
          }
        }
      }
    }

    if (!requesterUid) {
      throw new Error('Usuário não autenticado no servidor.');
    }

    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists) {
      throw new Error('Perfil do usuário solicitante não encontrado.');
    }

    const requesterData = requesterDoc.data();
    const requesterUserType = requesterData?.userType;
    const requesterTenantId = requesterData?.tenantId;

    if (requesterUserType !== 'admin' && requesterUserType !== 'constructor' && requesterUserType !== 'broker') {
      throw new Error('Permissão negada.');
    }

    if (requesterUserType === 'constructor' && requesterTenantId !== constructorId) {
      const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
      const constructorData = constructorDoc.data();
      const members = constructorData?.members || [];
      const isMember = members.some((m: any) => m.uid === requesterUid);
      if (!isMember) {
        throw new Error('Permissão negada. O usuário solicitante não pertence a esta construtora.');
      }
    }

    const projects = await projectRepository.listByBuilderId(constructorId);
    return {
      success: true,
      projects: (projects || []).map(p => ({
        id: String(p.id || ''),
        name: String(p.name || p.tituloComercial || 'Empreendimento'),
        tituloComercial: String(p.tituloComercial || ''),
        midia: Array.isArray(p.midia) ? p.midia : [],
        localizacao: p.localizacao && typeof p.localizacao === 'object' ? p.localizacao : {},
        builderId: String(p.builderId || ''),
        isPublished: p.isPublished === true,
      }))
    };
  } catch (error: any) {
    console.error('Erro ao buscar projetos da construtora:', error);
    return { success: false, projects: [], error: error.message || 'Erro ao carregar projetos.' };
  }
}

export async function updateProjectVisibilityServer(projectId: string, isPublished: boolean, constructorId: string, idToken?: string) {
  try {
    let requesterUid: string | null = null;

    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        requesterUid = decodedToken.uid;
      } catch (e) {
        console.warn('Falha ao verificar ID token fornecido:', e);
      }
    }

    if (!requesterUid) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        requesterUid = decodedToken.uid;
      } else {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value || 
                              cookieStore.get('firebase-auth-token')?.value ||
                              cookieStore.get('token')?.value ||
                              cookieStore.get('auth-token')?.value;
        if (sessionCookie) {
          try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
            requesterUid = decodedClaims.uid;
          } catch {
            try {
              const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
              requesterUid = decodedToken.uid;
            } catch (e) {
              console.warn('Falha ao verificar token de sessão:', e);
            }
          }
        }

        if (!requesterUid) {
          const allCookies = cookieStore.getAll();
          for (const cookie of allCookies) {
            if (cookie.name.includes('firebase') || cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.includes('token')) {
              try {
                const decodedToken = await adminAuth.verifyIdToken(cookie.value);
                requesterUid = decodedToken.uid;
                if (requesterUid) break;
              } catch {}
            }
          }
        }
      }
    }

    if (!requesterUid) {
      throw new Error('Usuário não autenticado.');
    }

    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists) {
      throw new Error('Perfil do usuário não encontrado.');
    }

    const requesterData = requesterDoc.data();
    const requesterUserType = requesterData?.userType;
    const requesterTenantId = requesterData?.tenantId;

    if (requesterUserType !== 'admin' && requesterUserType !== 'constructor') {
      throw new Error('Permissão negada para alterar visibilidade.');
    }

    if (requesterUserType === 'constructor' && requesterTenantId !== constructorId) {
      const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
      const constructorData = constructorDoc.data();
      const members = constructorData?.members || [];
      const isMember = members.some((m: any) => m.uid === requesterUid);
      if (!isMember) {
        throw new Error('Permissão negada para esta construtora.');
      }
    }

    const project = await projectRepository.getById(projectId);
    if (!project) {
      throw new Error('Empreendimento não encontrado.');
    }

    if (requesterUserType !== 'admin' && project.builderId !== constructorId) {
      throw new Error('Este empreendimento não pertence a esta construtora.');
    }

    await projectRepository.update(projectId, { isPublished });
    revalidatePath(`/dashboard/construtoras/${constructorId}/oralink`);
    revalidatePath(`/oralink`);

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar visibilidade do projeto:', error);
    return { success: false, error: error.message || 'Erro ao atualizar visibilidade.' };
  }
}

async function verifyConstructorAccess(constructorId: string, idToken?: string) {
  let requesterUid: string | null = null;

  if (idToken) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      requesterUid = decodedToken.uid;
    } catch (e) {
      console.warn('Falha ao verificar ID token fornecido:', e);
    }
  }

  if (!requesterUid) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await adminAuth.verifyIdToken(token);
      requesterUid = decodedToken.uid;
    } else {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value || 
                            cookieStore.get('firebase-auth-token')?.value ||
                            cookieStore.get('token')?.value ||
                            cookieStore.get('auth-token')?.value;
      if (sessionCookie) {
        try {
          const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
          requesterUid = decodedClaims.uid;
        } catch {
          try {
            const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
            requesterUid = decodedToken.uid;
          } catch (e) {
            console.warn('Falha ao verificar token de sessão:', e);
          }
        }
      }

      if (!requesterUid) {
        const allCookies = cookieStore.getAll();
        for (const cookie of allCookies) {
          if (cookie.name.includes('firebase') || cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.includes('token')) {
            try {
              const decodedToken = await adminAuth.verifyIdToken(cookie.value);
              requesterUid = decodedToken.uid;
              if (requesterUid) break;
            } catch {}
          }
        }
      }
    }
  }

  if (!requesterUid) {
    throw new Error('Usuário não autenticado no servidor.');
  }

  const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
  if (!requesterDoc.exists) {
    throw new Error('Perfil do usuário solicitante não encontrado.');
  }

  const requesterData = requesterDoc.data();
  const requesterUserType = requesterData?.userType;
  const requesterTenantId = requesterData?.tenantId;

  if (requesterUserType !== 'admin' && requesterUserType !== 'constructor' && requesterUserType !== 'broker') {
    throw new Error('Permissão negada.');
  }

  if (requesterUserType === 'constructor' && requesterTenantId !== constructorId) {
    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    const constructorData = constructorDoc.data();
    const members = constructorData?.members || [];
    const isMember = members.some((m: any) => m.uid === requesterUid);
    if (!isMember) {
      throw new Error('Permissão negada. O usuário solicitante não pertence a esta construtora.');
    }
  }

  return requesterUid;
}

export async function getConstructorDetailsServer(constructorId: string, idToken?: string) {
  try {
    await verifyConstructorAccess(constructorId, idToken);
    const constructorDoc = await adminDb.collection('constructors').doc(constructorId).get();
    if (!constructorDoc.exists) {
      return { success: false, error: 'Construtora não encontrada.' };
    }
    const data = constructorDoc.data() || {};
    return {
      success: true,
      constructor: {
        id: String(constructorDoc.id),
        name: String(data.name || ''),
        slug: String(data.slug || ''),
        logoUrl: String(data.logoUrl || ''),
        whatsapp: String(data.whatsapp || ''),
        oralink: data.oralink && typeof data.oralink === 'object' ? JSON.parse(JSON.stringify(data.oralink)) : {},
      }
    };
  } catch (error: any) {
    console.error('Erro ao buscar detalhes da construtora:', error);
    return { success: false, error: error.message || 'Erro ao carregar dados da construtora.' };
  }
}

export async function saveConstructorOralinkServer(constructorId: string, oralinkData: any, idToken?: string) {
  try {
    await verifyConstructorAccess(constructorId, idToken);
    await adminDb.collection('constructors').doc(constructorId).set({
      oralink: oralinkData,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    revalidatePath(`/dashboard/construtoras/${constructorId}/oralink`);
    revalidatePath(`/oralink`);

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao salvar Oralink da construtora:', error);
    return { success: false, error: error.message || 'Erro ao salvar Oralink.' };
  }
}




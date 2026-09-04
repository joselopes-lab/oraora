'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  userType: z.enum(['admin', 'broker', 'constructor']),
  cpf: z.string().optional(),
  creci: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  isActive: z.boolean(),
  planId: z.string().optional(),
  avatarUrl: z.string().optional(),
  idToken: z.string().optional(),
});

export async function createAdminUserServer(formData: {
  name: string;
  email: string;
  password: string;
  userType: 'admin' | 'broker' | 'constructor';
  cpf?: string;
  creci?: string;
  cnpj?: string;
  address?: string;
  state?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  planId?: string;
  avatarUrl?: string;
  idToken?: string;
}) {
  try {
    const validationResult = createUserSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return { success: false, error: `Dados inválidos: ${errorMessage}` };
    }

    const data = validationResult.data;

    let requesterUid: string | null = null;

    if (data.idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(data.idToken);
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
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          requesterUid = decodedToken.uid;
        } catch (e) {
          console.warn('Falha ao verificar token do header Authorization:', e);
        }
      }
    }

    if (!requesterUid) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value || cookieStore.get('firebase-auth-token')?.value;
      if (sessionCookie) {
        try {
          const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
          requesterUid = decodedClaims.uid;
        } catch {
          try {
            const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
            requesterUid = decodedToken.uid;
          } catch (e) {
            console.warn('Falha ao verificar token de sessão nos cookies:', e);
          }
        }
      }
    }

    if (!requesterUid) {
      return { success: false, error: 'Usuário não autenticado no servidor.' };
    }

    // Verify requester is ADMIN in Firestore
    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists) {
      return { success: false, error: 'Perfil do usuário solicitante não encontrado.' };
    }

    const requesterData = requesterDoc.data();
    if (requesterData?.userType !== 'admin') {
      return { success: false, error: 'Permissão negada. Apenas administradores podem cadastrar novos usuários.' };
    }

    // Check if email already exists in Auth
    try {
      const existingUser = await adminAuth.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists' || (e.message && e.message.includes('already exists'))) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }
    }

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
        disabled: !data.isActive,
      });
    } catch (authError: any) {
      console.error('Erro ao criar usuário no Authentication:', authError);
      if (authError.code === 'auth/email-already-exists' || (authError.message && authError.message.includes('already exists'))) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }
      return { success: false, error: `Erro ao criar autenticação: ${authError.message}` };
    }

    const newUid = userRecord.uid;

    // Create user profile in Firestore
    try {
      const userDocRef = adminDb.collection('users').doc(newUid);
      await userDocRef.set({
        id: newUid,
        username: data.name,
        email: data.email,
        userType: data.userType,
        isActive: data.isActive,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        planId: data.planId || null,
        avatarUrl: data.avatarUrl || '',
        createdAt: FieldValue.serverTimestamp(),
      });

      // If broker, create/update brokers collection
      if (data.userType === 'broker') {
        const brokerDocRef = adminDb.collection('brokers').doc(newUid);
        await brokerDocRef.set({
          id: newUid,
          name: data.name,
          email: data.email,
          cpf: data.cpf || null,
          creci: data.creci || null,
          address: data.address || null,
          state: data.state || null,
          city: data.city || null,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      // If constructor, create/update constructors collection
      if (data.userType === 'constructor') {
        const constructorDocRef = adminDb.collection('constructors').doc(newUid);
        await constructorDocRef.set({
          id: newUid,
          name: data.name,
          email: data.email,
          cnpj: data.cnpj || null,
          address: data.address || null,
          state: data.state || null,
          city: data.city || null,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

    } catch (firestoreError: any) {
      console.error('Erro ao gravar perfil no Firestore após criar Auth:', firestoreError);
      try {
        await adminAuth.deleteUser(newUid);
      } catch (delErr) {
        console.error('Erro ao remover usuário do Auth após falha no Firestore:', delErr);
      }
      return { success: false, error: 'Erro ao gravar o perfil do usuário no banco de dados. Operação cancelada.' };
    }

    revalidatePath('/dashboard/admin/users');
    return { success: true, uid: newUid };

  } catch (error: any) {
    console.error('Erro inesperado no cadastro de usuário ADMIN:', error);
    return { success: false, error: error.message || 'Erro inesperado ao cadastrar usuário.' };
  }
}

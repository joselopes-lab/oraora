'use server';

import { adminAuth, adminDb } from '@/firebase/index.server';
import { cookies, headers } from 'next/headers';
import { serializeFirestoreData } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';

async function getAuthenticatedUserContext(idToken?: string) {
  let requesterUid: string | null = null;
  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      requesterUid = decoded.uid;
    } catch (e) {}
  }
  if (!requesterUid) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
        requesterUid = decoded.uid;
      } catch (e) {}
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
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        requesterUid = decoded.uid;
      } catch {
        try {
          const decoded = await adminAuth.verifyIdToken(sessionCookie);
          requesterUid = decoded.uid;
        } catch (e) {}
      }
    }
  }
  if (!requesterUid) {
    throw new Error('Usuário não autenticado no servidor.');
  }
  const userDoc = await adminDb.collection('users').doc(requesterUid).get();
  const userData = userDoc.data();
  return {
    uid: requesterUid,
    userType: userData?.userType,
  };
}

async function verifyPropertyOwnership(propertyId: string, requesterUid: string, userType?: string) {
  const propRef = adminDb.collection('brokerProperties').doc(propertyId);
  const propDoc = await propRef.get();
  if (!propDoc.exists) {
    throw new Error('Imóvel avulso não encontrado.');
  }
  const data = propDoc.data();
  if (userType !== 'admin' && data?.brokerId && data.brokerId !== requesterUid) {
    throw new Error('Permissão negada. Este imóvel avulso pertence a outro corretor.');
  }
  return propRef;
}

export async function getPrivatePropertyNotesServer(propertyId: string, idToken?: string) {
  try {
    const ctx = await getAuthenticatedUserContext(idToken);
    await verifyPropertyOwnership(propertyId, ctx.uid, ctx.userType);

    const notesSnap = await adminDb
      .collection('brokerProperties')
      .doc(propertyId)
      .collection('privateNotes')
      .orderBy('updatedAt', 'desc')
      .get();

    const notes = notesSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : (d.updatedAt || new Date().toISOString()),
        reminderAt: d.reminderAt instanceof Timestamp ? d.reminderAt.toDate().toISOString() : (d.reminderAt || null),
      };
    });

    return { success: true, notes: serializeFirestoreData(notes) };
  } catch (err: any) {
    console.error('Erro ao buscar notas privadas:', err);
    return { success: false, error: err.message || 'Erro ao carregar notas' };
  }
}

export async function createPrivatePropertyNoteServer(
  propertyId: string,
  noteData: { title?: string; content: string; reminderAt?: string },
  idToken?: string
) {
  try {
    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('O conteúdo da nota não pode estar vazio.');
    }
    const ctx = await getAuthenticatedUserContext(idToken);
    await verifyPropertyOwnership(propertyId, ctx.uid, ctx.userType);

    const notesRef = adminDb
      .collection('brokerProperties')
      .doc(propertyId)
      .collection('privateNotes');

    const now = Timestamp.now();
    const newDocRef = notesRef.doc();
    const payload = {
      title: noteData.title?.trim() || '',
      content: noteData.content.trim(),
      reminderAt: noteData.reminderAt ? Timestamp.fromDate(new Date(noteData.reminderAt)) : null,
      brokerId: ctx.uid,
      propertyId,
      createdAt: now,
      updatedAt: now,
    };

    await newDocRef.set(payload);

    return {
      success: true,
      note: serializeFirestoreData({
        id: newDocRef.id,
        ...payload,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
        reminderAt: payload.reminderAt ? payload.reminderAt.toDate().toISOString() : null,
      }),
    };
  } catch (err: any) {
    console.error('Erro ao criar nota privada:', err);
    return { success: false, error: err.message || 'Erro ao criar nota' };
  }
}

export async function updatePrivatePropertyNoteServer(
  propertyId: string,
  noteId: string,
  noteData: { title?: string; content: string; reminderAt?: string },
  idToken?: string
) {
  try {
    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('O conteúdo da nota não pode estar vazio.');
    }
    const ctx = await getAuthenticatedUserContext(idToken);
    await verifyPropertyOwnership(propertyId, ctx.uid, ctx.userType);

    const noteRef = adminDb
      .collection('brokerProperties')
      .doc(propertyId)
      .collection('privateNotes')
      .doc(noteId);

    const noteDoc = await noteRef.get();
    if (!noteDoc.exists) {
      throw new Error('Nota não encontrada.');
    }

    const now = Timestamp.now();
    const payload: any = {
      title: noteData.title?.trim() || '',
      content: noteData.content.trim(),
      reminderAt: noteData.reminderAt ? Timestamp.fromDate(new Date(noteData.reminderAt)) : null,
      updatedAt: now,
    };

    await noteRef.update(payload);

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao atualizar nota privada:', err);
    return { success: false, error: err.message || 'Erro ao atualizar nota' };
  }
}

export async function deletePrivatePropertyNoteServer(
  propertyId: string,
  noteId: string,
  idToken?: string
) {
  try {
    const ctx = await getAuthenticatedUserContext(idToken);
    await verifyPropertyOwnership(propertyId, ctx.uid, ctx.userType);

    const noteRef = adminDb
      .collection('brokerProperties')
      .doc(propertyId)
      .collection('privateNotes')
      .doc(noteId);

    await noteRef.delete();

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao excluir nota privada:', err);
    return { success: false, error: err.message || 'Erro ao excluir nota' };
  }
}

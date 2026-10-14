import { adminDb } from '@/firebase/index.server';
import { Timestamp } from 'firebase-admin/firestore';
import { NotificationModel } from './types';

/**
 * Validação de sessão no servidor e retorno das notificações estritamente para o UID autenticado.
 */
export async function getNotificationsForUser(authUserId: string, limitCount = 50): Promise<NotificationModel[]> {
  if (!authUserId) throw new Error('Acesso negado: usuário não autenticado.');

  const snap = await adminDb.collection('notifications')
    .where('userId', '==', authUserId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      read: data.read,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      eventId: data.eventId,
      sourceId: data.sourceId,
      sourceType: data.sourceType,
    };
  });
}

/**
 * Retorna a contagem de notificações não lidas estritamente para o UID autenticado.
 */
export async function getUnreadCount(authUserId: string): Promise<number> {
  if (!authUserId) throw new Error('Acesso negado: usuário não autenticado.');

  const snap = await adminDb.collection('notifications')
    .where('userId', '==', authUserId)
    .where('read', '==', false)
    .count()
    .get();

  return snap.data().count;
}

/**
 * Marca uma notificação como lida, validando rigidamente que o documento pertence ao authUserId.
 */
export async function markAsRead(notificationId: string, authUserId: string): Promise<void> {
  if (!authUserId || !notificationId) throw new Error('Acesso negado: parâmetros inválidos.');

  const docRef = adminDb.collection('notifications').doc(notificationId);
  const docSnap = await docRef.get();

  if (!docSnap.exists || docSnap.data()?.userId !== authUserId) {
    throw new Error('Notificação não encontrada ou acesso negado.');
  }

  await docRef.update({ read: true });
}

/**
 * Marca todas as notificações do usuário autenticado como lidas.
 */
export async function markAllAsRead(authUserId: string): Promise<void> {
  if (!authUserId) throw new Error('Acesso negado: usuário não autenticado.');

  const snap = await adminDb.collection('notifications')
    .where('userId', '==', authUserId)
    .where('read', '==', false)
    .get();

  if (snap.empty) return;

  const batch = adminDb.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}

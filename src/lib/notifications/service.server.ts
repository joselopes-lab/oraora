import { adminDb } from '@/firebase/index.server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CreateNotificationInput } from './types';

/**
 * Gera uma chave determinística para garantir idempotência baseada no eventId e userId.
 */
export function getDeterministicNotificationId(eventId: string, userId: string): string {
  return `${eventId}_${userId}`;
}

/**
 * Cria uma notificação individual de forma atômica e estritamente idempotente utilizando transação.
 * Impede sobrescritas concorrentes e preserva createdAt e read caso o documento já exista.
 */
export async function createNotification(input: CreateNotificationInput): Promise<string> {
  const docId = getDeterministicNotificationId(input.eventId, input.userId);
  const docRef = adminDb.collection('notifications').doc(docId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        // Se já existe, não faz nada para preservar read original e createdAt
        return;
      }

      const payload = {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        eventId: input.eventId,
        sourceId: input.sourceId,
        sourceType: input.sourceType,
      };

      transaction.set(docRef, payload);
    });

    return docId;
  } catch (error) {
    console.error('Erro transacional ao criar notificação:', error);
    throw new Error('Falha ao registrar notificação com segurança no servidor.');
  }
}

/**
 * Cria notificações em lote para múltiplos destinatários utilizando transações ou verificações atômicas,
 * respeitando os limites operacionais do Firestore.
 */
export async function createBatchNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs || inputs.length === 0) return;

  try {
    // Processamento individual/lote seguro para garantir que cada transação verifique a existência
    for (const input of inputs) {
      await createNotification(input);
    }
  } catch (error) {
    console.error('Erro ao processar lote seguro de notificações:', error);
    throw new Error('Falha ao processar lote de notificações com idempotência.');
  }
}

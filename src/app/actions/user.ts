'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

const requestDeletionSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
});

export async function requestAccountDeletion(userId: string, userEmail: string): Promise<{ success: boolean; error?: string }> {
  const validation = requestDeletionSchema.safeParse({ userId, userEmail });

  if (!validation.success) {
    return { success: false, error: 'Informações de usuário inválidas.' };
  }

  try {
    await addDoc(collection(db, 'deletionRequests'), {
      userId,
      userEmail,
      requestedAt: Timestamp.now(),
      status: 'pending',
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error requesting account deletion:', error);
    return { success: false, error: 'Não foi possível registrar sua solicitação. Tente novamente mais tarde.' };
  }
}

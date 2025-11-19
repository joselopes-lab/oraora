
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, Timestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface State {
  success: boolean | null;
  error: string | null;
}

const mediaSchema = z.object({
  builderId: z.string().min(1),
  propertyId: z.string().min(1, 'Selecione um imóvel.'),
  mediaType: z.enum(['video_link', 'image', 'plan', 'brand', 'social_media', 'ebook']),
  mediaName: z.string().min(1, 'Nome do arquivo/link é obrigatório.'),
  fileUrl: z.string().min(1, 'URL do arquivo ou link é obrigatório.'),
});

export async function handleAddMedia(formData: FormData): Promise<State> {
    const [propertyId, propertyName] = (formData.get('propertyId') as string || '|').split('|');

    const schemaData = {
        builderId: formData.get('builderId'),
        propertyId: propertyId,
        mediaType: formData.get('mediaType'),
        mediaName: formData.get('mediaName'),
        fileUrl: formData.get('fileUrl') || formData.get('link'),
    };
    
    const validatedFields = mediaSchema.safeParse(schemaData);

    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const { builderId, propertyId: propId, mediaType, mediaName, fileUrl } = validatedFields.data;
        
        await addDoc(collection(db, 'property_media'), {
            builderId,
            propertyId: propId,
            propertyName,
            mediaType,
            mediaName,
            fileUrl: fileUrl,
            createdAt: Timestamp.now(),
        });
        
        // Find brokers who have this property and create notifications
        const usersQuery = query(collection(db, 'users'), where('portfolioPropertyIds', 'array-contains', propId));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
            const batch = writeBatch(db);
            const notificationMessage = `Novos materiais de mídia foram adicionados para o imóvel "${propertyName}".`;
            
            usersSnapshot.forEach(userDoc => {
                const newNotifRef = doc(collection(db, 'broker_notifications'));
                batch.set(newNotifRef, {
                    brokerId: userDoc.id,
                    message: notificationMessage,
                    propertyId: propId,
                    propertyName: propertyName,
                    read: false,
                    createdAt: Timestamp.now(),
                });
            });
            await batch.commit();
        }

        revalidatePath('/dashboard-construtora/midia');
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function handleDeleteMedia(mediaId: string): Promise<{ success: boolean, error?: string }> {
    if (!mediaId) {
        return { success: false, error: 'ID do item de mídia é necessário.' };
    }
    try {
        await deleteDoc(doc(db, 'property_media', mediaId));
        revalidatePath('/dashboard-construtora/midia');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Falha ao deletar o item de mídia.' };
    }
}

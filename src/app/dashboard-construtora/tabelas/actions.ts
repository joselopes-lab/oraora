
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, Timestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export interface State {
  success: boolean | null;
  error: string | null;
}

const tableSchema = z.object({
  builderId: z.string().min(1),
  propertyId: z.string().min(1, 'Selecione um imóvel.'),
  tableName: z.string().min(1, 'Nome da tabela é obrigatório.'),
});

export async function handleAddTable(prevState: State, formData: FormData): Promise<State> {
    const file = formData.get('file') as File;
    const [propertyId, propertyName] = (formData.get('propertyId') as string || '|').split('|');

    const validatedFields = tableSchema.safeParse({
        builderId: formData.get('builderId'),
        propertyId: propertyId,
        tableName: formData.get('tableName'),
    });

    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const { builderId, propertyId, tableName } = validatedFields.data;
        
        let downloadURL = '';
        if (file && file.size > 0) {
            if (file.type !== 'application/pdf') {
                 return { success: false, error: 'O arquivo deve ser um PDF.' };
            }
            const path = `property_tables/${builderId}/${propertyId}/${file.name}`;
            downloadURL = await uploadFile(file, path);
        }
        
        await addDoc(collection(db, 'property_tables'), {
            builderId,
            propertyId,
            propertyName,
            tableName,
            fileUrl: downloadURL,
            createdAt: Timestamp.now(),
        });
        
        // Find brokers who have this property and create notifications
        const usersQuery = query(collection(db, 'users'), where('portfolioPropertyIds', 'array-contains', propertyId));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
            const batch = writeBatch(db);
            const notificationMessage = `A tabela de vendas do imóvel "${propertyName}" foi atualizada.`;
            
            usersSnapshot.forEach(userDoc => {
                const newNotifRef = doc(collection(db, 'broker_notifications'));
                batch.set(newNotifRef, {
                    brokerId: userDoc.id,
                    message: notificationMessage,
                    propertyId: propertyId,
                    propertyName: propertyName,
                    read: false,
                    createdAt: Timestamp.now(),
                });
            });
            await batch.commit();
        }

        revalidatePath('/dashboard-construtora/tabelas');
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function handleDeleteTable(tableId: string): Promise<{ success: boolean, error?: string }> {
    if (!tableId) {
        return { success: false, error: 'ID da tabela é necessário.' };
    }
    try {
        await deleteDoc(doc(db, 'property_tables', tableId));
        // Note: Deleting the file from storage is not implemented here to avoid accidental data loss and complexity.
        revalidatePath('/dashboard-construtora/tabelas');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Falha ao deletar a tabela.' };
    }
}

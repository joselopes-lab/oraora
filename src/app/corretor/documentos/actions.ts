
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export interface State {
  success: boolean | null;
  error: string | null;
}

const documentSchema = z.object({
  brokerId: z.string().min(1),
  name: z.string().min(1, 'Nome do documento é obrigatório.'),
  associatedType: z.enum(['client', 'property', 'none']),
  associatedId: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

const getAssociatedName = async (type: string, id: string | undefined): Promise<string | undefined> => {
    if (!id || type === 'none') return undefined;
    const collectionName = type === 'client' ? 'broker_clients' : 'properties';
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        const data = docSnap.data();
        return type === 'client' ? data.name : data.informacoesbasicas.nome;
    }
    return undefined;
}


export async function handleAddDocument(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = documentSchema.safeParse({
        brokerId: formData.get('brokerId'),
        name: formData.get('name'),
        associatedType: formData.get('associatedType'),
        associatedId: formData.get('associatedId'),
        expiryDate: formData.get('expiryDate'),
    });

    const file = formData.get('file') as File;

    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }
    if (!file || file.size === 0) {
        return { success: false, error: 'Arquivo é obrigatório.' };
    }

    try {
        const { brokerId, name, associatedType, associatedId, expiryDate } = validatedFields.data;
        
        const path = `broker_documents/${brokerId}/${file.name}`;
        const downloadURL = await uploadFile(file, path);

        const associatedName = await getAssociatedName(associatedType, associatedId);
        
        await addDoc(collection(db, 'broker_documents'), {
            brokerId,
            name,
            fileUrl: downloadURL,
            fileName: file.name,
            associatedType,
            associatedId: associatedId || null,
            associatedName: associatedName || null,
            expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
            createdAt: Timestamp.now(),
        });
        
        revalidatePath('/corretor/documentos');
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function handleUpdateDocument(prevState: State, formData: FormData): Promise<State> {
     const documentId = formData.get('documentId') as string;
      if (!documentId) {
        return { success: false, error: "ID do documento não encontrado." };
    }

    const validatedFields = documentSchema.safeParse({
        brokerId: formData.get('brokerId'),
        name: formData.get('name'),
        associatedType: formData.get('associatedType'),
        associatedId: formData.get('associatedId'),
        expiryDate: formData.get('expiryDate'),
    });

    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }
    
    try {
        const { name, associatedType, associatedId, expiryDate } = validatedFields.data;
        const associatedName = await getAssociatedName(associatedType, associatedId);

        const docRef = doc(db, 'broker_documents', documentId);
        await updateDoc(docRef, {
            name,
            associatedType,
            associatedId: associatedId || null,
            associatedName: associatedName || null,
            expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
        });

        revalidatePath('/corretor/documentos');
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


export async function handleDeleteDocument(documentId: string): Promise<{ success: boolean, error?: string }> {
    if (!documentId) {
        return { success: false, error: 'ID do documento é necessário.' };
    }
    try {
        await deleteDoc(doc(db, 'broker_documents', documentId));
        // Note: Deleting the file from storage is not implemented here to avoid accidental data loss.
        // This could be a future improvement.
        revalidatePath('/corretor/documentos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Falha ao deletar o documento.' };
    }
}

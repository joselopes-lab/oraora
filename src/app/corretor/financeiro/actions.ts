
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
}

const revenueSchema = z.object({
  brokerId: z.string().min(1, 'ID do corretor é obrigatório.'),
  sourceType: z.enum(['client', 'builder']),
  partnerId: z.string().min(1, 'Parceiro é obrigatório.'),
  value: z.coerce.number().positive('O valor deve ser positivo.'),
  dueDate: z.coerce.date({ required_error: "A data de vencimento é obrigatória." }),
  status: z.enum(['Pendente', 'Paga', 'Atrasada']),
  description: z.string().optional(),
});

const expenseSchema = z.object({
    brokerId: z.string().min(1, 'ID do corretor é obrigatório.'),
    description: z.string().min(1, 'Descrição é obrigatória.'),
    category: z.string().min(1, 'Categoria é obrigatória.'),
    value: z.coerce.number().positive('O valor deve ser positivo.'),
    dueDate: z.coerce.date({ required_error: "A data de vencimento é obrigatória." }),
    status: z.enum(['Pendente', 'Paga', 'Atrasada']),
});

export async function handleAddRevenue(prevState: State, formData: FormData): Promise<State> {
    const [partnerId, partnerName] = (formData.get('partnerId') as string || '|').split('|');

    const validatedFields = revenueSchema.safeParse({
        brokerId: formData.get('brokerId'),
        sourceType: formData.get('sourceType'),
        partnerId: partnerId,
        value: formData.get('value'),
        dueDate: formData.get('dueDate'),
        status: formData.get('status'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Verifique todos os campos obrigatórios.',
        }
    }

    try {
        await addDoc(collection(db, 'broker_revenues'), {
            ...validatedFields.data,
            partnerName: partnerName,
            dueDate: Timestamp.fromDate(validatedFields.data.dueDate),
            createdAt: Timestamp.now(),
        });
        
        return {
            success: true,
            error: null,
        }

    } catch (error) {
        console.error("Error creating revenue:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao salvar a receita. Tente novamente mais tarde.',
        }
    }
}

export async function handleUpdateRevenue(prevState: State, formData: FormData): Promise<State> {
    const revenueId = formData.get('revenueId') as string;
    if (!revenueId) {
        return { success: false, error: "ID da receita não encontrado." };
    }
    
    const [partnerId, partnerName] = (formData.get('partnerId') as string || '|').split('|');

    const validatedFields = revenueSchema.safeParse({
        brokerId: formData.get('brokerId'),
        sourceType: formData.get('sourceType'),
        partnerId: partnerId,
        value: formData.get('value'),
        dueDate: formData.get('dueDate'),
        status: formData.get('status'),
        description: formData.get('description'),
    });

     if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Verifique todos os campos obrigatórios.',
        }
    }

    try {
        const revenueRef = doc(db, 'broker_revenues', revenueId);
        await updateDoc(revenueRef, {
            ...validatedFields.data,
            partnerName: partnerName,
            dueDate: Timestamp.fromDate(validatedFields.data.dueDate),
        });
        
        return {
            success: true,
            error: null,
        }
    } catch (error) {
        console.error("Error updating revenue:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao atualizar a receita. Tente novamente mais tarde.',
        }
    }
}

export async function handleDeleteRevenue(revenueId: string): Promise<{ success: boolean, error?: string }> {
    if (!revenueId) {
        return { success: false, error: 'ID da receita é necessário.' };
    }

    try {
        await deleteDoc(doc(db, 'broker_revenues', revenueId));
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting revenue:", error);
        return { success: false, error: 'Falha ao deletar a receita.' };
    }
}

// --- Expense Actions ---

export async function handleAddExpense(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = expenseSchema.safeParse({
        brokerId: formData.get('brokerId'),
        description: formData.get('description'),
        category: formData.get('category'),
        value: formData.get('value'),
        dueDate: formData.get('dueDate'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos para despesa. Verifique todos os campos.',
        }
    }
    
    try {
        await addDoc(collection(db, 'broker_expenses'), {
            ...validatedFields.data,
            dueDate: Timestamp.fromDate(validatedFields.data.dueDate),
            createdAt: Timestamp.now(),
        });
        return { success: true, error: null };
    } catch (error) {
        console.error("Error creating expense:", error);
        return { success: false, error: 'Ocorreu um erro ao salvar a despesa.' };
    }
}

export async function handleUpdateExpense(prevState: State, formData: FormData): Promise<State> {
    const expenseId = formData.get('expenseId') as string;
    if (!expenseId) {
        return { success: false, error: "ID da despesa não encontrado." };
    }

    const validatedFields = expenseSchema.safeParse({
        brokerId: formData.get('brokerId'),
        description: formData.get('description'),
        category: formData.get('category'),
        value: formData.get('value'),
        dueDate: formData.get('dueDate'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos para despesa. Verifique todos os campos.',
        }
    }

    try {
        const expenseRef = doc(db, 'broker_expenses', expenseId);
        await updateDoc(expenseRef, {
            ...validatedFields.data,
            dueDate: Timestamp.fromDate(validatedFields.data.dueDate),
        });
        return { success: true, error: null };
    } catch (error) {
        console.error("Error updating expense:", error);
        return { success: false, error: 'Ocorreu um erro ao atualizar a despesa.' };
    }
}

export async function handleDeleteExpense(expenseId: string): Promise<{ success: boolean, error?: string }> {
    if (!expenseId) {
        return { success: false, error: 'ID da despesa é necessário.' };
    }
    try {
        await deleteDoc(doc(db, 'broker_expenses', expenseId));
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Falha ao deletar a despesa.' };
    }
}

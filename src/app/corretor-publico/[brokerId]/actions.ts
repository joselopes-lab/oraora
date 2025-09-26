'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
}

const contactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(10, 'Telefone inválido.'),
  message: z.string().optional(),
  brokerId: z.string().min(1, 'ID do corretor é inválido.'),
});

export async function handleBrokerContact(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = contactSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        brokerId: formData.get('brokerId'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Por favor, verifique todos os campos.',
            message: null,
        }
    }

    try {
        await addDoc(collection(db, 'broker_leads'), {
            ...validatedFields.data,
            createdAt: Timestamp.now(),
            status: 'new', // new, contacted, closed
        });
        
        return {
            success: true,
            error: null,
            message: 'Mensagem enviada com sucesso! O corretor entrará em contato em breve.',
        }

    } catch (error) {
        console.error("Error creating broker lead:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.',
            message: null,
        }
    }
}

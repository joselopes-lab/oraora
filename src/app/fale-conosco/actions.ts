
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
}

const contactFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(1, 'Telefone é obrigatório.'),
  subject: z.string().min(1, 'Assunto é obrigatório.'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
});

export async function handleContactSubmission(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = contactFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Por favor, verifique todos os campos.',
            message: null,
        }
    }

    try {
        // Salvar na coleção 'tickets' para integrar com a página de suporte do dashboard
        await addDoc(collection(db, 'tickets'), {
            ...validatedFields.data,
            createdAt: Timestamp.now(),
            status: 'Aberto', // Status inicial
        });
        
        return {
            success: true,
            error: null,
            message: '✅ Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.',
        }

    } catch (error) {
        console.error("Error creating contact submission:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.',
            message: null,
        }
    }
}

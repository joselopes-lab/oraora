
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
}

const supportFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres'),
});

export async function handleSupportRequest(prevState: State, formData: FormData): Promise<State> {
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
    };

    const validatedFields = supportFormSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Verifique todos os campos.',
        };
    }

    const { name, email, subject, message } = validatedFields.data;

    try {
        await addDoc(collection(db, 'tickets'), {
            name,
            email,
            subject,
            message,
            status: 'Aberto',
            createdAt: Timestamp.now(),
        });

        return {
            success: true,
            error: null,
            message: 'Seu ticket de suporte foi enviado com sucesso! Entraremos em contato em breve.',
        };

    } catch (e) {
        console.error('Support Request Error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
        return {
            success: false,
            error: `Falha ao enviar seu ticket: ${errorMessage}`,
        };
    }
}

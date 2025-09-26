'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
}

const brokerLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  whatsapp: z.string().min(10, 'WhatsApp inválido.'),
});

export async function handleBrokerLead(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = brokerLeadSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        whatsapp: formData.get('whatsapp'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Por favor, verifique todos os campos.',
            message: null,
        }
    }

    try {
        await addDoc(collection(db, 'broker_leads_restricted'), {
            ...validatedFields.data,
            createdAt: Timestamp.now(),
            status: 'new',
        });
        
        return {
            success: true,
            error: null,
            message: '✅ Convite solicitado! Você agora está na nossa lista de investigados VIP. O Detetive Oraora entrará em contato assim que o segredo for revelado.',
        }

    } catch (error) {
        console.error("Error creating restricted broker lead:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao enviar sua solicitação. Tente novamente mais tarde.',
            message: null,
        }
    }
}

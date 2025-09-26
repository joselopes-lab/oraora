
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
}

const builderLeadSchema = z.object({
  builderName: z.string().min(1, 'Nome da construtora é obrigatório.'),
  website: z.string().min(1, 'Site é obrigatório.'),
});

export async function handleBuilderLead(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = builderLeadSchema.safeParse({
        builderName: formData.get('builderName'),
        website: formData.get('website'),
    });

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0].message;
        return {
            success: false,
            error: firstError || 'Dados inválidos. Por favor, verifique todos os campos.',
            message: null,
        }
    }

    try {
        await addDoc(collection(db, 'builder_leads'), {
            ...validatedFields.data,
            createdAt: Timestamp.now(),
            status: 'new',
        });
        
        return {
            success: true,
            error: null,
            message: '✅ Pista recebida com sucesso! Agora o Detetive Oraora vai seguir o rastro do seu empreendimento. Aguarde novidades em breve.',
        }

    } catch (error) {
        console.error("Error creating builder lead:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao enviar sua solicitação. Tente novamente mais tarde.',
            message: null,
        }
    }
}

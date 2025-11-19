
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
  whatsappUrl?: string | null;
}

const contactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(10, 'Telefone inválido.'),
  message: z.string().optional(),
  brokerId: z.string().min(1, 'ID do corretor é inválido.'),
  propertyName: z.string().optional(),
  propertySlug: z.string().optional(),
});

const brokerWhatsAppLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  propertyId: z.string(),
  propertyName: z.string(),
  propertySlug: z.string(),
  brokerId: z.string().min(1),
  brokerWhatsApp: z.string().min(10),
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

export async function handleBrokerWhatsAppRedirect(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = brokerWhatsAppLeadSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        propertyId: formData.get('propertyId'),
        propertyName: formData.get('propertyName'),
        propertySlug: formData.get('propertySlug'),
        brokerId: formData.get('brokerId'),
        brokerWhatsApp: formData.get('brokerWhatsApp'),
    });

    if (!validatedFields.success) {
        return { 
            success: false, 
            error: 'Dados inválidos. Verifique os campos.', 
        };
    }
    
    const { name, email, propertyId, propertyName, propertySlug, brokerId, brokerWhatsApp } = validatedFields.data;

    try {
        // Save the lead
        await addDoc(collection(db, 'broker_leads'), {
            name,
            email,
            phone: brokerWhatsApp, // Save broker's whatsapp as lead contact for reference
            message: `Lead via WhatsApp para o imóvel ${propertyName}`,
            propertyId,
            propertyName,
            propertySlug,
            createdAt: Timestamp.now(), 
            status: 'new',
            brokerId: brokerId,
        });

        // Prepare WhatsApp message and URL
        const propertyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br'}/imoveis/${propertySlug}`;
        const whatsappMessage = `Olá, meu nome é ${name}. Tenho interesse no imóvel "${propertyName}".\nLink do imóvel: ${propertyUrl}`;
        const whatsappNumber = `55${brokerWhatsApp.replace(/\D/g, '')}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        return { 
            success: true, 
            error: null, 
            whatsappUrl: whatsappUrl
        };

    } catch (e) {
        console.error('WhatsApp Redirect Error for Broker:', e);
        const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
        return { 
            success: false, 
            error: `Falha ao processar a solicitação: ${errorMessage}`,
        };
    }
}


export async function handleBrokerContactSheet(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = contactSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        brokerId: formData.get('brokerId'),
        propertyName: formData.get('propertyName'),
        propertySlug: formData.get('propertySlug'),
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
            status: 'new',
        });
        
        return {
            success: true,
            error: null,
            message: 'Mensagem enviada! O corretor entrará em contato em breve.',
        }

    } catch (error) {
        console.error("Error creating broker lead from sheet:", error);
        return {
            success: false,
            error: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.',
            message: null,
        }
    }
}

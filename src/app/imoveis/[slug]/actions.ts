
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

export interface State {
  success: boolean | null;
  error: string | null;
  message?: string | null;
  whatsappUrl?: string | null;
}

interface Broker {
    id: string;
    name: string;
    whatsapp: string;
    locations: { state: string; city: string }[];
}

const whatsAppLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  propertyId: z.string(),
  propertyName: z.string(),
  propertySlug: z.string(),
  propertyCity: z.string(),
  propertyState: z.string(),
});

const contactFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  message: z.string().optional(),
  propertyId: z.string(),
  propertyName: z.string(),
  propertySlug: z.string(),
});


let lastBrokerIndexes: { [city: string]: number } = {};

export async function handleWhatsAppRedirect(prevState: State, formData: FormData): Promise<State> {
    const data = {
        name: formData.get('name') as string || '',
        email: formData.get('email') as string || '',
        propertyId: formData.get('propertyId') as string || '',
        propertyName: formData.get('propertyName') as string || '',
        propertySlug: formData.get('propertySlug') as string || '',
        propertyCity: formData.get('propertyCity') as string || '',
        propertyState: formData.get('propertyState') as string || '',
    };

    const validatedFields = whatsAppLeadSchema.safeParse(data);

    if (!validatedFields.success) {
        return { 
            success: false, 
            error: 'Dados inválidos. Verifique os campos.', 
        };
    }
    
    const { name, email, propertyId, propertyName, propertySlug, propertyCity, propertyState } = validatedFields.data;

    try {
        // 1. Find brokers for the property's city
        const brokersQuery = query(
            collection(db, 'brokers'), 
            where('locations', 'array-contains', { state: propertyState, city: propertyCity })
        );
        const brokersSnapshot = await getDocs(brokersQuery);
        const availableBrokers = brokersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));

        if (availableBrokers.length === 0) {
            return { 
                success: false, 
                error: 'Nenhum corretor disponível para esta cidade no momento.', 
            };
        }

        // 2. Round-robin logic to select a broker
        const cityKey = `${propertyState}-${propertyCity}`;
        let currentIndex = lastBrokerIndexes[cityKey] ?? -1;
        currentIndex = (currentIndex + 1) % availableBrokers.length;
        lastBrokerIndexes[cityKey] = currentIndex;
        
        const selectedBroker = availableBrokers[currentIndex];

        // 3. Save the lead
        await addDoc(collection(db, 'leads'), {
            name,
            email,
            phone: selectedBroker.whatsapp, // Save broker's whatsapp as lead contact
            message: `Lead via WhatsApp para o corretor ${selectedBroker.name}`,
            propertyId,
            propertyName,
            propertySlug,
            createdAt: Timestamp.now(), 
            status: 'new',
            brokerId: selectedBroker.id,
            brokerName: selectedBroker.name, // Save broker name
        });

        // 4. Prepare WhatsApp message and URL
        const propertyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br'}/imoveis/${propertySlug}`;
        const whatsappMessage = `Olá, meu nome é ${name}. Tenho interesse no imóvel "${propertyName}".\nLink do imóvel: ${propertyUrl}`;
        const whatsappNumber = `55${selectedBroker.whatsapp.replace(/\D/g, '')}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        return { 
            success: true, 
            error: null, 
            whatsappUrl: whatsappUrl
        };

    } catch (e) {
        console.error('WhatsApp Redirect Error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
        return { 
            success: false, 
            error: `Falha ao processar a solicitação: ${errorMessage}`,
        };
    }
}


export async function handleContactFormSubmit(prevState: State, formData: FormData): Promise<State> {
    const data = {
        name: formData.get('name') as string || '',
        email: formData.get('email') as string || '',
        phone: formData.get('phone') as string || '',
        message: formData.get('message') as string || '',
        propertyId: formData.get('propertyId') as string || '',
        propertyName: formData.get('propertyName') as string || '',
        propertySlug: formData.get('propertySlug') as string || '',
    };

    const validatedFields = contactFormSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Dados inválidos. Verifique todos os campos.',
        };
    }
    
    const { name, email, phone, message, propertyId, propertyName, propertySlug } = validatedFields.data;

    try {
        await addDoc(collection(db, 'leads'), {
            name,
            email,
            phone,
            message: message || `Demonstrou interesse no imóvel ${propertyName}`,
            propertyId,
            propertyName,
            propertySlug,
            createdAt: Timestamp.now(),
            status: 'new',
            brokerId: null, // Not assigned to a broker yet
            brokerName: null,
        });

        return {
            success: true,
            error: null,
            message: 'Contato enviado com sucesso! Em breve retornaremos.',
        };

    } catch (e) {
        console.error('Contact Form Submit Error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
        return {
            success: false,
            error: `Falha ao enviar seu contato: ${errorMessage}`,
        };
    }
}

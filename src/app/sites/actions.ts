
'use server';

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  propertyInterest?: string;
  message?: string;
  brokerId: string;
  source?: string;
}

export async function createLead(data: LeadFormData) {
  try {
    const { firestore } = initializeFirebase();
    const leadsCollection = collection(firestore, 'leads');

    // Calculate lead score
    let score = 20; // Base score
    if (data.source === 'WhatsApp') {
      score += 20;
    }
    if (data.message && data.message.length > 80) {
      score += 20;
    }
    if (data.propertyInterest) {
      score += 20;
    }
    if (data.name && data.email && data.phone) {
        score += 20;
    }

    let qualification: 'Quente' | 'Morno' | 'Frio' = 'Frio';
    if (score >= 70) {
      qualification = 'Quente';
    } else if (score >= 40) {
      qualification = 'Morno';
    }


    // Use the standard addDoc for server-side operations
    await addDoc(leadsCollection, {
      brokerId: data.brokerId,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      propertyInterest: data.propertyInterest || '',
      message: data.message || '',
      status: 'new',
      source: data.source || 'Site Público',
      createdAt: serverTimestamp(),
      leadScore: score,
      leadQualification: qualification,
    });

    return {
      success: true,
      message: 'Sua mensagem foi enviada com sucesso!',
    };
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    // Return a generic error message for security reasons
    return {
      success: false,
      message: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.',
    };
  }
}

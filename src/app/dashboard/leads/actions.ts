
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

type LeadStatus = 'new' | 'contacted' | 'closed';

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!leadId || !['new', 'contacted', 'closed'].includes(status)) {
    return { success: false, error: 'Dados inválidos.' };
  }

  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, { status });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignBrokerToLead(leadId: string, brokerId: string, brokerName: string) {
  if (!leadId || !brokerId || !brokerName) {
    return { success: false, error: 'Dados inválidos.' };
  }

  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, { brokerId, brokerName });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    if (!leadId) {
        return { success: false, error: "ID do lead é obrigatório." };
    }
    try {
        await deleteDoc(doc(db, 'leads', leadId));
        revalidatePath('/dashboard/leads');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Falha ao deletar o lead.' };
    }
}

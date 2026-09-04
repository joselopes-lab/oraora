import { adminDb } from '@/firebase/index.server';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  dealStatus: string;
  dealValue: number;
  brokerId: string;
  propertyName: string;
  statusHistory: any[];
  [key: string]: any;
}

export const leadRepository = {
  async listByBroker(brokerId: string): Promise<Lead[]> {
    const snapshot = await adminDb
      .collection('leads')
      .where('brokerId', '==', brokerId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
  },

  async listByTenant(tenantId: string): Promise<Lead[]> {
    const snapshot = await adminDb
      .collection('leads')
      .where('tenantId', '==', tenantId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
  },

  async create(leadData: Omit<Lead, 'id'>): Promise<string> {
    const docRef = await adminDb.collection('leads').add({
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getById(leadId: string): Promise<Lead | null> {
    const doc = await adminDb.collection('leads').doc(leadId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Lead;
  },

  async update(leadId: string, data: Partial<Lead>): Promise<void> {
    await adminDb.collection('leads').doc(leadId).update(data);
  },

  async delete(leadId: string): Promise<void> {
    await adminDb.collection('leads').doc(leadId).delete();
  }
};

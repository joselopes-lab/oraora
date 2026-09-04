import { adminDb } from '@/firebase/index.server';

export interface BrokerSelectedProperty {
  id: string;
  brokerId: string;
  propertyId: string;
  createdAt: any;
}

export const brokerSelectedPropertyRepository = {
  async getByBrokerAndProperty(brokerId: string, propertyId: string): Promise<BrokerSelectedProperty | null> {
    const snap = await adminDb.collection('brokerSelectedProperties')
      .where('brokerId', '==', brokerId)
      .where('propertyId', '==', propertyId)
      .limit(1)
      .get();
    
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as BrokerSelectedProperty;
  },

  async listByBrokerId(brokerId: string): Promise<BrokerSelectedProperty[]> {
    const snap = await adminDb.collection('brokerSelectedProperties')
      .where('brokerId', '==', brokerId)
      .get();
    
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrokerSelectedProperty));
  },

  async create(brokerId: string, propertyId: string): Promise<string> {
    if (!brokerId || !propertyId) {
      throw new Error('brokerId e propertyId são obrigatórios.');
    }

    // 1. Verificar se a propriedade existe em `properties`
    const propertyDoc = await adminDb.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      throw new Error('Imóvel não encontrado.');
    }

    const propertyData = propertyDoc.data();
    // 2. Verificar disponibilidade usando o campo existente isVisibleOnSite
    if (propertyData?.isVisibleOnSite === false) {
      throw new Error('Este imóvel não está disponível para distribuição.');
    }

    // 3. Verificar se já existe vínculo (idempotência / evitar duplicidade)
    const existing = await this.getByBrokerAndProperty(brokerId, propertyId);
    if (existing) {
      return existing.id;
    }

    // 4. Criar o vínculo contendo a referência e publishedOnSite = true para disponibilizar no site do corretor
    const docRef = await adminDb.collection('brokerSelectedProperties').add({
      brokerId,
      propertyId,
      publishedOnSite: true,
      createdAt: new Date(),
    });

    return docRef.id;
  },

  async remove(brokerId: string, propertyId: string): Promise<void> {
    const existing = await this.getByBrokerAndProperty(brokerId, propertyId);
    if (!existing) return;

    await adminDb.collection('brokerSelectedProperties').doc(existing.id).delete();
  },

  async isSelected(brokerId: string, propertyId: string): Promise<boolean> {
    const existing = await this.getByBrokerAndProperty(brokerId, propertyId);
    return existing !== null;
  }
};

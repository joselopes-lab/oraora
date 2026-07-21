import { collection, query, where, getDocs, Firestore, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Utilitário centralizado para busca de dados do corretor (Tenancy).
 * Busca diretamente pelo slug na coleção de brokers ou via mapeamento de domínio.
 */

export async function getBrokerData(firestore: Firestore, identifier: string) {
  if (!identifier) return null;

  try {
    const brokersRef = collection(firestore, 'brokers');
    const q = query(brokersRef, where('slug', '==', identifier));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    } else {
      // Tenta buscar no mapeamento de domínios customizados
      const domainRef = doc(firestore, 'domains', identifier);
      const domainSnap = await getDoc(domainRef);
      if (domainSnap.exists()) {
        const domainData = domainSnap.data();
        if (domainData?.brokerId) {
          const brokerRef = doc(firestore, 'brokers', domainData.brokerId);
          const brokerSnap = await getDoc(brokerRef);
          if (brokerSnap.exists()) {
            return { id: brokerSnap.id, ...brokerSnap.data() };
          }
        }
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar broker por slug/domínio ${identifier}:`, error);
  }
  
  return null;
}

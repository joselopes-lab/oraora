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
      // Tenta buscar diretamente pelo ID do documento
      const docSnap = await getDoc(doc(firestore, 'brokers', identifier));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

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

/**
 * Busca todos os imóveis visíveis no site a partir das coleções 'properties' (Minha Carteira)
 * e 'brokerProperties' (Imóveis Avulsos), combinando-os e removendo duplicatas por ID.
 */
export async function fetchPublishedProperties(firestore: Firestore): Promise<any[]> {
  try {
    const pRef = collection(firestore, 'properties');
    const q1 = query(pRef, where('isVisibleOnSite', '==', true));

    const bpRef = collection(firestore, 'brokerProperties');
    const q2 = query(bpRef, where('isVisibleOnSite', '==', true));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const list1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const list2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const combinedMap = new Map<string, any>();
    list1.forEach(p => combinedMap.set(p.id, p));
    list2.forEach(p => combinedMap.set(p.id, p));

    return Array.from(combinedMap.values());
  } catch (error) {
    console.error("Erro ao carregar imóveis publicados do site:", error);
    return [];
  }
}

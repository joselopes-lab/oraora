import { adminDb } from '@/firebase/index.server';

/**
 * @fileOverview Utilitários de servidor para busca de dados via Firebase Admin SDK.
 * Implementa serialização rigorosa para evitar erros de transferência entre Server e Client Components.
 */

export function serializeForClient(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (typeof obj.toDate === 'function') {
    try {
      return obj.toDate().toISOString();
    } catch {
      // fallback
    }
  }

  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
  }

  if (obj.id && typeof obj.path === 'string' && (obj.firestore || typeof obj.get === 'function')) {
    return obj.id;
  }

  if (obj.constructor && obj.constructor.name === 'DocumentReference') {
    return obj.id;
  }

  if (typeof obj.latitude === 'number' && typeof obj.longitude === 'number') {
    return { latitude: obj.latitude, longitude: obj.longitude };
  }

  if (obj.constructor && obj.constructor.name === 'GeoPoint') {
    return { latitude: obj.latitude, longitude: obj.longitude };
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeForClient(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeForClient(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * Busca dados do corretor pelo slug ou domínio personalizado.
 * Garante que objetos complexos (como Timestamps) sejam convertidos em dados primitivos.
 */
export async function getBrokerData(slug: string) {
  if (!slug) return null;

  try {
    console.log("[THEME_DEBUG] Iniciando busca de broker para:", slug);
    // 1. Tenta buscar pelo campo 'slug' (padrão subdomínio/pasta)
    let snap = await adminDb.collection('brokers').where('slug', '==', slug).limit(1).get();
    
    if (snap.empty) {
      // 1.5. Tenta buscar diretamente pelo ID do documento (caso o slug seja o ID/UID)
      const docSnap = await adminDb.collection('brokers').doc(slug).get();
      if (docSnap.exists) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log("[THEME_DEBUG] Broker encontrado via ID de documento. ID:", docSnap.id, "LayoutId:", data.layoutId);
        return JSON.parse(JSON.stringify(data));
      }

      // 2. Se não achou, tenta buscar pelo domínio customizado na coleção 'domains'
      const domainSnap = await adminDb.collection('domains').doc(slug).get();
      
      if (domainSnap.exists) {
        const domainData = domainSnap.data();
        if (domainData?.brokerId) {
          const brokerSnap = await adminDb.collection('brokers').doc(domainData.brokerId).get();
          if (brokerSnap.exists) {
            const data = { id: brokerSnap.id, ...brokerSnap.data() };
            console.log("[THEME_DEBUG] Broker encontrado via domínio customizado. ID:", brokerSnap.id, "LayoutId:", data.layoutId);
            return JSON.parse(JSON.stringify(data));
          }
        }
      }
    } else {
      const d = snap.docs[0];
      const data = { id: d.id, ...d.data() };
      console.log("[THEME_DEBUG] Broker encontrado via slug. ID:", d.id, "LayoutId:", data.layoutId);
      return JSON.parse(JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Erro ao buscar broker por slug/domínio ${slug}:`, error);
  }
  
  return null;
}

/**
 * Busca dados de um imóvel pelo slug ou ID.
 */
export async function getPropertyData(propertySlug: string) {
    if (!propertySlug) return null;
    try {
        // 1. Busca em imóveis globais de construtoras
        const propsSnap = await adminDb.collection('properties')
            .where('informacoesbasicas.slug', '==', propertySlug)
            .limit(1)
            .get();
        
        if (!propsSnap.empty) {
            const data = { id: propsSnap.docs[0].id, ...propsSnap.docs[0].data() };
            return JSON.parse(JSON.stringify(data));
        }

        // 2. Busca em imóveis avulsos de corretores
        const brokerPropsSnap = await adminDb.collection('brokerProperties')
            .where('informacoesbasicas.slug', '==', propertySlug)
            .limit(1)
            .get();

        if (!brokerPropsSnap.empty) {
            const data = { id: brokerPropsSnap.docs[0].id, ...brokerPropsSnap.docs[0].data() };
            return JSON.parse(JSON.stringify(data));
        }

        // 3. Fallback: busca por ID direto nas duas coleções
        const propRef = adminDb.collection('properties').doc(propertySlug);
        const propDoc = await propRef.get();
        if (propDoc.exists) {
            const data = { id: propDoc.id, ...propDoc.data() };
            return JSON.parse(JSON.stringify(data));
        }

        const bPropRef = adminDb.collection('brokerProperties').doc(propertySlug);
        const bPropDoc = await bPropRef.get();
        if (bPropDoc.exists) {
            const data = { id: bPropDoc.id, ...bPropDoc.data() };
            return JSON.parse(JSON.stringify(data));
        }

        return null;
    } catch (error) {
        console.error("Erro ao buscar dados do imóvel no servidor:", error);
        return null;
    }
}

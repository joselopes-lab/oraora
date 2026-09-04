import { Firestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Constructor } from '@/firebase/constructor-types';

/**
 * Serviço centralizado para resolver uma construtora a partir de um builderId.
 * No Portal Público, consome o endpoint /api/constructors/[id]/public para evitar expor dados privados.
 */
export async function resolveConstructorByBuilderId(db: Firestore, builderId: string): Promise<Constructor | null> {
  if (!builderId) return null;

  try {
    // 1. Tentar buscar via endpoint público do Next.js
    const response = await fetch(`/api/constructors/${builderId}/public`);
    if (response.ok) {
      const data = await response.json();
      return data as Constructor;
    }

    // 2. Fallback caso o builderId seja na verdade um ownerId ou precise de consulta direta no Firestore (quando db estiver disponível e endpoint falhar)
    if (db) {
      const directDocRef = doc(db, 'constructors', builderId);
      const directSnap = await getDoc(directDocRef);

      if (directSnap.exists()) {
        const data = directSnap.data();
        if (data.isVisibleOnSite !== false) {
          return {
            id: directSnap.id,
            ...data
          } as Constructor;
        }
      }

      const q = query(
        collection(db, 'constructors'),
        where('ownerId', '==', builderId),
        limit(1)
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        const data = foundDoc.data();
        if (data.isVisibleOnSite !== false) {
          return {
            id: foundDoc.id,
            ...data
          } as Constructor;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao resolver construtora por builderId:', error);
    return null;
  }
}


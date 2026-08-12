import { adminDb } from '@/firebase/index.server';
import { generateSemanticSlug } from '@/lib/slug';

export class PropertyRepository {
  private db: FirebaseFirestore.Firestore;

  constructor(db: FirebaseFirestore.Firestore = adminDb) {
    this.db = db;
  }

  static async findPublicBySlugOrId(identifier: string) {
    const repo = new PropertyRepository(adminDb);
    return repo.findPublicBySlugOrId(identifier);
  }

  async findPublicBySlugOrId(identifier: string) {
    if (!identifier) return null;
    try {
      // 1. properties por informacoesbasicas.slug
      const q1 = await this.db.collection('properties')
        .where('informacoesbasicas.slug', '==', identifier)
        .limit(1)
        .get();
      if (!q1.empty) {
        const doc = q1.docs[0];
        const data = { id: doc.id, ...doc.data() } as any;
        if (data.isVisibleOnSite === false) return null;
        return JSON.parse(JSON.stringify(data));
      }

      // 2. brokerProperties por informacoesbasicas.slug
      const q2 = await this.db.collection('brokerProperties')
        .where('informacoesbasicas.slug', '==', identifier)
        .limit(1)
        .get();
      if (!q2.empty) {
        const doc = q2.docs[0];
        const data = { id: doc.id, ...doc.data() } as any;
        if (data.isVisibleOnSite === false) return null;
        return JSON.parse(JSON.stringify(data));
      }

      // 3. properties/{identifier}
      const docRef1 = this.db.collection('properties').doc(identifier);
      const docSnap1 = await docRef1.get();
      if (docSnap1.exists) {
        const data = { id: docSnap1.id, ...docSnap1.data() } as any;
        if (data.isVisibleOnSite === false) return null;
        return JSON.parse(JSON.stringify(data));
      }

      // 4. brokerProperties/{identifier}
      const docRef2 = this.db.collection('brokerProperties').doc(identifier);
      const docSnap2 = await docRef2.get();
      if (docSnap2.exists) {
        const data = { id: docSnap2.id, ...docSnap2.data() } as any;
        if (data.isVisibleOnSite === false) return null;
        return JSON.parse(JSON.stringify(data));
      }

      // 5. Dynamic semantic slug match (runtime generation for legacy records)
      const allPropsSnap = await this.db.collection('properties').where('isVisibleOnSite', '==', true).limit(300).get();
      for (const docSnap of allPropsSnap.docs) {
        const data = docSnap.data();
        const propObj = { id: docSnap.id, ...data };
        if (generateSemanticSlug(propObj) === identifier) {
          if (propObj.isVisibleOnSite === false) return null;
          return JSON.parse(JSON.stringify(propObj));
        }
      }

      const allBrokerPropsSnap = await this.db.collection('brokerProperties').where('isVisibleOnSite', '==', true).limit(300).get();
      for (const docSnap of allBrokerPropsSnap.docs) {
        const data = docSnap.data();
        const propObj = { id: docSnap.id, ...data };
        if (generateSemanticSlug(propObj) === identifier) {
          if (propObj.isVisibleOnSite === false) return null;
          return JSON.parse(JSON.stringify(propObj));
        }
      }

      return null;
    } catch (error) {
      console.error("Erro em PropertyRepository.findPublicBySlugOrId:", error);
      return null;
    }
  }
}

export const propertyRepository = new PropertyRepository();

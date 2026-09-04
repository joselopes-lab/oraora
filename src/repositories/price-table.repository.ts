import { adminDb } from '@/firebase/index.server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type PriceTableItem = {
  propertyId: string;
  unidade?: string;
  numero?: string;
  torre?: string;
  bloco?: string;
  andar?: string;
  area?: number;
  price: number;
  pricePerSquareMeter?: number;
  status?: string;
};

export type PriceTableVersion = {
  id: string;
  priceTableId: string;
  versionNumber: number;
  validFrom: Timestamp | string;
  minPrice: number;
  minPricePropertyId: string;
  maxPrice: number;
  avgPrice: number;
  avgPricePerSquareMeter: number;
  previousMinPrice: number | null;
  variationAmount: number | null;
  variationPercent: number | null;
  createdAt: Timestamp | string;
  createdBy: string;
  items: PriceTableItem[];
};

export type PriceTable = {
  id: string;
  tenantId: string;
  constructorId: string;
  targetType?: 'project' | 'property';
  projectId?: string;
  propertyId?: string;
  name: string;
  status: 'active' | 'archived';
  currentVersionId?: string;
  minPrice?: number;
  minPricePropertyId?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  createdBy: string;
};

export class PriceTableRepository {
  private collection = adminDb.collection('priceTables');

  async createTable(data: {
    tenantId: string;
    constructorId: string;
    targetType: 'project' | 'property';
    projectId?: string;
    propertyId?: string;
    name: string;
    createdBy: string;
    sourceFile?: {
      fileName: string;
      storagePath: string;
      mimeType: string;
      size: number;
    };
  }): Promise<string> {
    const payload: any = {
      tenantId: data.tenantId,
      constructorId: data.constructorId,
      targetType: data.targetType || (data.propertyId ? 'property' : 'project'),
      projectId: data.targetType === 'project' ? data.projectId : null,
      propertyId: data.targetType === 'property' ? data.propertyId : null,
      name: data.name,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: data.createdBy,
    };
    if (data.sourceFile) {
      payload.sourceFile = {
        ...data.sourceFile,
        uploadedAt: FieldValue.serverTimestamp(),
      };
    }
    const docRef = await this.collection.add(payload);
    return docRef.id;
  }

  async getTable(tableId: string): Promise<PriceTable | null> {
    const doc = await this.collection.doc(tableId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as PriceTable;
  }

  async getTableByProperty(propertyId: string): Promise<PriceTable | null> {
    const snap = await this.collection.where('propertyId', '==', propertyId).limit(1).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as PriceTable;
  }

  async getTablesByPropertyIds(propertyIds: string[]): Promise<PriceTable[]> {
    if (!propertyIds || propertyIds.length === 0) return [];
    const tables: PriceTable[] = [];
    const batches: string[][] = [];
    for (let i = 0; i < propertyIds.length; i += 30) {
      batches.push(propertyIds.slice(i, i + 30));
    }
    for (const batch of batches) {
      const snap = await this.collection.where('propertyId', 'in', batch).get();
      snap.forEach(doc => {
        tables.push({ id: doc.id, ...doc.data() } as PriceTable);
      });
    }
    return tables;
  }

  async listTablesByTenant(tenantId: string): Promise<PriceTable[]> {
    const snap = await this.collection.where('tenantId', '==', tenantId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceTable));
  }

  async listAllTables(): Promise<PriceTable[]> {
    const snap = await this.collection.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceTable));
  }

  async listVersions(tableId: string): Promise<PriceTableVersion[]> {
    const snap = await this.collection.doc(tableId).collection('versions').orderBy('versionNumber', 'desc').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceTableVersion));
  }

  async getCurrentVersion(tableId: string, currentVersionId?: string): Promise<PriceTableVersion | null> {
    if (currentVersionId) {
      const doc = await this.collection.doc(tableId).collection('versions').doc(currentVersionId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as PriceTableVersion;
      }
    }
    const snap = await this.collection.doc(tableId).collection('versions').orderBy('versionNumber', 'desc').limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as PriceTableVersion;
  }

  async createVersion(tableId: string, versionData: Omit<PriceTableVersion, 'id'>): Promise<string> {
    const versionRef = await this.collection.doc(tableId).collection('versions').add({
      ...versionData,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update table metadata
    await this.collection.doc(tableId).update({
      currentVersionId: versionRef.id,
      minPrice: versionData.minPrice,
      minPricePropertyId: versionData.minPricePropertyId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return versionRef.id;
  }
}

export const priceTableRepository = new PriceTableRepository();

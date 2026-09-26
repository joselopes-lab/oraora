import { adminDb } from '@/firebase/index.server';
import { PropertySearchIntent, PublicProperty } from './types';
import { normalizeSearchText } from './text-normalizer';
import { FieldPath } from 'firebase-admin/firestore';

interface SearchOptions {
  resultLimit?: number;
  pageSize?: number;
}

const DEFAULT_RESULT_LIMIT = 20;
const DEFAULT_PAGE_SIZE = 50;
const ORA_PUBLIC_INVENTORY_COLLECTION = 'oraPublicInventory';

export async function searchPublicProperties(
  intent: PropertySearchIntent,
  options?: SearchOptions
): Promise<PublicProperty[]> {
  const resultLimit = options?.resultLimit ?? DEFAULT_RESULT_LIMIT;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const db = adminDb;
  if (!db) {
    console.error('Admin DB not initialized');
    return [];
  }

  const publicProperties: PublicProperty[] = [];
  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  let hasMore = true;

  const cityNorm = intent.city ? normalizeSearchText(intent.city) : null;

  while (hasMore && publicProperties.length < resultLimit) {
    try {
      let q: FirebaseFirestore.Query = db
        .collection(ORA_PUBLIC_INVENTORY_COLLECTION)
        .orderBy(FieldPath.documentId())
        .limit(pageSize);

      if (cityNorm) {
        q = q.where('cityNormalized', '==', cityNorm);
      }

      if (lastDoc) {
        q = q.startAfter(lastDoc);
      }

      const snap = await q.get();

      if (snap.empty) {
        hasMore = false;
        break;
      }

      lastDoc = snap.docs[snap.docs.length - 1];

      for (const doc of snap.docs) {
        const data = doc.data();
        let matches = true;

        if (cityNorm && data.cityNormalized !== cityNorm) {
          matches = false;
        }

        if (matches && intent.purpose) {
          const intentPurpose = normalizeSearchText(intent.purpose);
          const propPurpose = normalizeSearchText(data.purpose);
          if (intentPurpose === 'venda') {
            if (propPurpose !== 'venda' && propPurpose !== 'ambos') matches = false;
          } else if (intentPurpose === 'aluguel') {
            if (propPurpose !== 'aluguel' && propPurpose !== 'ambos') matches = false;
          }
        }

        if (matches && intent.neighborhoods && intent.neighborhoods.length > 0) {
          const propNbhNorm = data.neighborhoodNormalized || normalizeSearchText(data.neighborhood || '');
          const matchedNbh = intent.neighborhoods.some(n => {
            const normN = normalizeSearchText(n);
            return normN.length > 0 && propNbhNorm.length > 0 && propNbhNorm === normN;
          });
          if (!matchedNbh) matches = false;
        }

        if (matches && intent.propertyTypes && intent.propertyTypes.length > 0) {
          const propTypeNorm = data.typeNormalized || normalizeSearchText(data.type || '');
          const matchedType = intent.propertyTypes.some(t => {
            const normT = normalizeSearchText(t);
            return propTypeNorm === normT || propTypeNorm.includes(normT);
          });
          if (!matchedType) matches = false;
        }

        if (matches && intent.maxPrice !== undefined) {
          if (data.price === undefined || data.price > intent.maxPrice) matches = false;
        }
        if (matches && intent.minPrice !== undefined) {
          if (data.price === undefined || data.price < intent.minPrice) matches = false;
        }

        if (matches && intent.minBedrooms !== undefined) {
          const b = data.bedrooms;
          const bOpts = data.bedroomOptions;
          let passesBedrooms = false;
          if (b !== undefined && b >= intent.minBedrooms) {
            passesBedrooms = true;
          } else if (Array.isArray(bOpts) && bOpts.length > 0) {
            if (bOpts.some((opt: number) => opt >= intent.minBedrooms)) {
              passesBedrooms = true;
            }
          }
          if (!passesBedrooms) matches = false;
        }

        if (matches && intent.minSuites !== undefined) {
          if (data.suites === undefined || data.suites < intent.minSuites) matches = false;
        }

        if (matches && intent.minBathrooms !== undefined) {
          if (data.bathrooms === undefined || data.bathrooms < intent.minBathrooms) matches = false;
        }

        if (matches && intent.minParkingSpaces !== undefined) {
          if (data.parkingSpaces === undefined || data.parkingSpaces < intent.minParkingSpaces) matches = false;
        }

        if (matches && intent.minArea !== undefined) {
          if (data.usableArea === undefined || data.usableArea < intent.minArea) matches = false;
        }
        if (matches && intent.maxArea !== undefined) {
          if (data.usableArea === undefined || data.usableArea > intent.maxArea) matches = false;
        }

        if (matches && intent.requiredFeatures && intent.requiredFeatures.length > 0) {
          const propFeaturesNorm: string[] = data.featuresNormalized || [];
          const hasAll = intent.requiredFeatures.every(req => {
            const normReq = normalizeSearchText(req);
            return propFeaturesNorm.some(f => f.includes(normReq));
          });
          if (!hasAll) matches = false;
        }

        if (matches) {
          const propItem: PublicProperty = {
            id: data.sourceId,
            sourceType: data.sourceType || 'broker_property',
            title: data.title,
            type: data.type,
            purpose: data.purpose,
            price: data.price,
            city: data.city,
            neighborhood: data.neighborhood,
            state: data.state,
            bedrooms: data.bedrooms,
            bedroomOptions: data.bedroomOptions,
            suites: data.suites,
            bathrooms: data.bathrooms,
            parkingSpaces: data.parkingSpaces,
            usableArea: data.usableArea,
            features: data.features || [],
            images: data.images || [],
            status: data.status,
            publicUrl: data.publicUrl
          };
          publicProperties.push(propItem);
        }

        if (publicProperties.length >= resultLimit) {
          break;
        }
      }

      if (snap.docs.length < pageSize) {
        hasMore = false;
      }
    } catch (error) {
      console.error('Erro ao consultar oraPublicInventory no Firestore:', error);
      break;
    }
  }

  return publicProperties;
}

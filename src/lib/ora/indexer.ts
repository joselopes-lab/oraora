import { SearchDocument } from './types';
import { isEligibleForPublicInventory } from './property-eligibility';
import { normalizeBrokerProperty } from './property-normalizer';
import { normalizeSearchText } from './text-normalizer';

export function createSearchId(sourceCollection: 'properties' | 'brokerProperties', sourceId: string): string {
  if (!sourceCollection || !sourceId) return '';
  return `${sourceCollection}:${sourceId}`;
}

export function buildSearchDocument(
  sourceCollection: 'properties' | 'brokerProperties',
  sourceId: string,
  data: unknown
): SearchDocument | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // 1. Elegibilidade (fail closed)
  if (!isEligibleForPublicInventory(data)) {
    return null;
  }

  // 2. Normalização base (PublicProperty)
  const prop = normalizeBrokerProperty(sourceId, data);
  if (!prop) {
    return null;
  }

  // 3. Derivação de campos normalizados
  const cityNormalized = normalizeSearchText(prop.city);
  const neighborhoodNormalized = normalizeSearchText(prop.neighborhood);
  
  let typeNormalized = normalizeSearchText(prop.type);
  if (typeNormalized === 'apartamentos') {
    typeNormalized = 'apartamento';
  }

  const featuresNormalized = Array.from(
    new Set(
      prop.features
        .map(f => normalizeSearchText(f))
        .filter(Boolean)
    )
  );

  // 4. Tratamento seguro de sourceUpdatedAt
  let sourceUpdatedAt: number | undefined = undefined;
  const rawRecord = data as Record<string, any>;
  const rawUpdatedAt = rawRecord.updatedAt || rawRecord.createdAt || rawRecord.atualizadoEm || rawRecord.criadoEm;

  if (rawUpdatedAt) {
    if (typeof rawUpdatedAt === 'number') {
      sourceUpdatedAt = rawUpdatedAt;
    } else if (typeof rawUpdatedAt.toMillis === 'function') {
      sourceUpdatedAt = rawUpdatedAt.toMillis();
    } else if (typeof rawUpdatedAt.seconds === 'number') {
      sourceUpdatedAt = rawUpdatedAt.seconds * 1000;
    } else {
      const parsed = Date.parse(rawUpdatedAt);
      if (!isNaN(parsed)) {
        sourceUpdatedAt = parsed;
      }
    }
  }

  const searchId = createSearchId(sourceCollection, sourceId);

  return {
    searchId,
    sourceType: prop.sourceType,
    sourceCollection,
    sourceId,
    responsibleBrokerId: prop.responsibleBrokerId,
    developerId: prop.developerId,
    projectId: prop.projectId,
    title: prop.title,
    type: prop.type,
    typeNormalized,
    purpose: prop.purpose,
    price: prop.price,
    city: prop.city,
    cityNormalized,
    neighborhood: prop.neighborhood,
    neighborhoodNormalized,
    state: prop.state,
    bedrooms: prop.bedrooms,
    bedroomOptions: prop.bedroomOptions,
    suites: prop.suites,
    bathrooms: prop.bathrooms,
    parkingSpaces: prop.parkingSpaces,
    usableArea: prop.usableArea,
    features: prop.features,
    featuresNormalized,
    images: prop.images,
    status: prop.status,
    publicUrl: prop.publicUrl,
    sourceUpdatedAt,
  };
}

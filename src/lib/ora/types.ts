export type SourceType = 'broker_property' | 'developer_property';

export interface PublicProperty {
  id: string;
  sourceType: SourceType;
  responsibleBrokerId?: string;
  developerId?: string;
  projectId?: string;

  title: string;
  type: string;
  purpose: 'venda' | 'aluguel' | 'ambos';
  price: number; // Guaranteed valid and positive by eligibility check

  city: string;
  neighborhood: string;
  state: string;

  bedrooms?: number;
  bedroomOptions?: number[];
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  usableArea?: number;

  features: string[];
  images: string[];

  status: string;
  publicUrl: string;
}

export interface SearchDocument {
  searchId: string;

  sourceType: SourceType;
  sourceCollection: 'properties' | 'brokerProperties';
  sourceId: string;

  responsibleBrokerId?: string;
  developerId?: string;
  projectId?: string;

  title: string;

  type: string;
  typeNormalized: string;

  purpose: 'venda' | 'aluguel' | 'ambos';

  price: number;

  city: string;
  cityNormalized: string;

  neighborhood: string;
  neighborhoodNormalized: string;

  state: string;

  bedrooms?: number;
  bedroomOptions?: number[];
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  usableArea?: number;

  features: string[];
  featuresNormalized: string[];

  images: string[];

  status: string;

  publicUrl: string;

  sourceUpdatedAt?: number;
}

export interface PersistedSearchDocument extends SearchDocument {
  indexedAt: number;
}

export interface PropertySearchIntent {
  purpose?: 'venda' | 'aluguel';
  city?: string;
  neighborhoods?: string[];
  propertyTypes?: string[];

  minPrice?: number;
  maxPrice?: number;

  minBedrooms?: number;
  minSuites?: number;
  minBathrooms?: number;
  minParkingSpaces?: number;

  minArea?: number;
  maxArea?: number;

  requiredFeatures?: string[];
  preferredFeatures?: string[];
  freePreferences?: string[];
}

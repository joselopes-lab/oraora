import crypto from 'crypto';

export interface PhysicalIdentityResult {
  physicalPropertyId?: string | null;
  identityFingerprint?: string | null;
  matchStatus: 'CONFIRMED' | 'PROBABLE' | 'UNCERTAIN' | 'NEW';
}

/**
 * Normaliza string para fingerprint físico (remove acentos, espaços extras, lowercase).
 */
function normalizeStr(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Valida se há dados físicos suficientes para identificar um imóvel de forma única.
 * Regra: Cidade + estado + bairro isolados NÃO são suficientes.
 * Exige pelo menos:
 * - CEP + número/unidade/endereço
 * - OU logradouro + número + unidade + cidade/estado
 * - OU empreendimento + unidade + número/endereço + cidade/estado
 * - OU CEP + logradouro + número + cidade/estado
 * - OU empreendimento + quadra + lote + cidade/estado
 */
export function hasSufficientIdentityData(propertyData: any): boolean {
  const loc = propertyData?.localizacao || propertyData?.location || {};
  const char = propertyData?.caracteristicasimovel || propertyData?.characteristics || {};

  const address = normalizeStr(loc.address || loc.endereco || '');
  const number = normalizeStr(loc.numero || loc.number || '');
  const neighborhood = normalizeStr(loc.bairro || loc.neighborhood || '');
  const city = normalizeStr(loc.cidade || loc.city || '');
  const state = normalizeStr(loc.estado || loc.uf || loc.state || '');
  const unit = normalizeStr(char.unidade || propertyData?.unidade || char.numeroUnidade || '');
  const development = normalizeStr(propertyData?.empreendimento || propertyData?.nomeEmpreendimento || '');
  const cep = normalizeStr(loc.cep || '');
  const quadra = normalizeStr(propertyData?.quadra || loc.quadra || '');
  const lote = normalizeStr(propertyData?.lote || loc.lote || '');

  const hasAddressAndNumber = address.length > 0 && number.length > 0;
  const hasCepAndDetail = cep.length > 0 && (number.length > 0 || unit.length > 0 || address.length > 0);
  const hasDevAndDetail = development.length > 0 && (unit.length > 0 || number.length > 0 || address.length > 0 || (quadra.length > 0 && lote.length > 0));
  const hasCepAndAddress = cep.length > 0 && address.length > 0;

  return hasAddressAndNumber || hasCepAndDetail || hasDevAndDetail || hasCepAndAddress;
}

/**
 * Calcula o hash determinístico (identityFingerprint) dos dados físicos do imóvel.
 * Retorna null se os dados forem insuficientes.
 */
export function calculateIdentityFingerprint(propertyData: any): string | null {
  if (!hasSufficientIdentityData(propertyData)) {
    return null;
  }

  const loc = propertyData?.localizacao || propertyData?.location || {};
  const char = propertyData?.caracteristicasimovel || propertyData?.characteristics || {};

  const address = normalizeStr(loc.address || loc.endereco || '');
  const number = normalizeStr(loc.numero || loc.number || '');
  const neighborhood = normalizeStr(loc.bairro || loc.neighborhood || '');
  const city = normalizeStr(loc.cidade || loc.city || '');
  const state = normalizeStr(loc.estado || loc.uf || loc.state || '');
  const type = normalizeStr(char.tipo || propertyData?.tipo || '');
  const unit = normalizeStr(char.unidade || propertyData?.unidade || char.numeroUnidade || '');
  const development = normalizeStr(propertyData?.empreendimento || propertyData?.nomeEmpreendimento || '');

  const rawKey = [address, number, neighborhood, city, state, type, unit, development].join('|');
  
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Gera um UUID v4 para o physicalPropertyId.
 */
export function generatePhysicalPropertyId(): string {
  return crypto.randomUUID();
}

/**
 * Assegura a identidade física do imóvel (physicalPropertyId e identityFingerprint).
 * Se os dados forem insuficientes, retorna matchStatus: 'UNCERTAIN' e IDs nulos.
 */
export function ensurePhysicalIdentity(
  propertyData: any,
  existingProperties: any[] = []
): PhysicalIdentityResult {
  if (propertyData?.physicalPropertyId) {
    const fingerprint = calculateIdentityFingerprint(propertyData);
    return {
      physicalPropertyId: propertyData.physicalPropertyId,
      identityFingerprint: fingerprint || propertyData.identityFingerprint || null,
      matchStatus: 'CONFIRMED'
    };
  }

  const fingerprint = calculateIdentityFingerprint(propertyData);
  if (!fingerprint) {
    return {
      physicalPropertyId: null,
      identityFingerprint: null,
      matchStatus: 'UNCERTAIN'
    };
  }

  const exactMatch = existingProperties.find(
    (p) => p.identityFingerprint === fingerprint || (p.physicalPropertyId && calculateIdentityFingerprint(p) === fingerprint)
  );

  if (exactMatch && exactMatch.physicalPropertyId) {
    return {
      physicalPropertyId: exactMatch.physicalPropertyId,
      identityFingerprint: fingerprint,
      matchStatus: 'CONFIRMED'
    };
  }

  return {
    physicalPropertyId: generatePhysicalPropertyId(),
    identityFingerprint: fingerprint,
    matchStatus: 'NEW'
  };
}

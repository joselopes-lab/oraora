import { PublicProperty } from './types';

function parseStrictNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return Number.isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      return Number.isNaN(num) ? undefined : num;
    }
  }
  return undefined;
}

function parseBedroomsField(val: any): { bedrooms?: number; bedroomOptions?: number[] } {
  if (val === undefined || val === null || val === '') return {};

  if (Array.isArray(val)) {
    const numbers: number[] = [];
    for (const item of val) {
      const parsed = parseStrictNumber(item);
      if (parsed !== undefined) {
        numbers.push(parsed);
      }
    }
    const uniqueSorted = Array.from(new Set(numbers)).sort((a, b) => a - b);
    if (uniqueSorted.length === 1) {
      return { bedrooms: uniqueSorted[0], bedroomOptions: uniqueSorted };
    } else if (uniqueSorted.length > 1) {
      return { bedrooms: undefined, bedroomOptions: uniqueSorted };
    }
    return {};
  }

  const single = parseStrictNumber(val);
  if (single !== undefined) {
    return { bedrooms: single, bedroomOptions: [single] };
  }

  return {};
}

function parseOptionalNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return Number.isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      return Number.isNaN(num) ? undefined : num;
    }
  }
  return undefined;
}

export function normalizeBrokerProperty(id: string, data: any): PublicProperty | null {
  if (!data) return null;

  const basic = data.informacoesbasicas || {};
  const charac = data.caracteristicasimovel || {};
  const loc = data.localizacao || {};

  const title = basic.titulo || basic.nome || data.title || data.name || 'Imóvel sem título';
  const type = basic.tipo || data.type || charac.tipo || 'Imóvel';
  const purpose = basic.finalidade || data.purpose || 'venda';
  
  const rawPrice = basic.valorVenda ?? basic.preco ?? basic.salePrice ?? basic.valor ?? data.price;
  const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : 0;

  const city = loc.cidade || data.city || '';
  const neighborhood = loc.bairro || data.neighborhood || '';
  const state = loc.uf || loc.estado || data.state || '';

  const rawBedroomsInput = basic.quartos ?? basic.dormitorios ?? charac.quartos ?? data.bedrooms;
  const { bedrooms, bedroomOptions } = parseBedroomsField(rawBedroomsInput);

  const suites = parseOptionalNumber(basic.suites ?? charac.suites ?? data.suites);
  const bathrooms = parseOptionalNumber(basic.banheiros ?? basic.bathrooms ?? charac.banheiros ?? data.bathrooms);
  const parkingSpaces = parseOptionalNumber(basic.vagas ?? charac.vagas ?? data.parkingSpaces);
  const usableArea = parseOptionalNumber(basic.areaUtil ?? basic.metragem ?? charac.tamanho ?? charac.areaUtil ?? data.usableArea);

  const features = Array.isArray(data.caracteristicas)
    ? data.caracteristicas
    : Array.isArray(basic.caracteristicas)
    ? basic.caracteristicas
    : Array.isArray(charac.caracteristicas)
    ? charac.caracteristicas
    : [];

  const rawImages = data.midia || data.fotos || data.imagens || data.images || [];
  const images = Array.isArray(rawImages)
    ? rawImages.map((img: any) => (typeof img === 'string' ? img : img.url || ''))
        .filter(Boolean)
    : [];

  const status = basic.status || data.status || 'Disponível';
  const responsibleBrokerId = data.brokerId || data.responsibleBrokerId;

  const publicUrl = `/imoveis/${id}`;

  return {
    id,
    sourceType: 'broker_property',
    responsibleBrokerId,
    title,
    type,
    purpose: purpose.toLowerCase().includes('loca') ? 'aluguel' : 'venda',
    price,
    city,
    neighborhood,
    state,
    bedrooms,
    bedroomOptions,
    suites,
    bathrooms,
    parkingSpaces,
    usableArea,
    features,
    images,
    status,
    publicUrl,
  };
}

// /src/lib/feeds/canalpro-xml-generator.ts

export interface CanalProValidationError {
  field: string;
  code: string;
  message: string;
}

/**
 * Normaliza o ID do imóvel para atender à restrição do Canal Pro / VRSync (máx 20 caracteres, único e determinístico).
 * Não altera o ID real do Firestore.
 */
export function normalizeListingId(id: any): string {
  if (!id) return 'PROP-DEFAULT';
  const strId = String(id).trim();
  if (strId.length <= 20) return strId;
  
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    const char = strId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const prefix = strId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const suffix = Math.abs(hash).toString(36).toUpperCase();
  const candidate = `${prefix}-${suffix}`;
  return candidate.length <= 20 ? candidate : candidate.slice(0, 20);
}

export function parsePriceValue(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  const cleaned = str
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3,})/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function getPropertySalePrice(prop: any): number {
  if (!prop) return 0;
  const info = prop.informacoesbasicas || {};
  const raw = info.salePrice ?? info.precoVenda ?? info.valor ?? prop.salePrice ?? prop.precoVenda ?? prop.valor ?? prop.price;
  return parsePriceValue(raw);
}

export function getPropertyRentalPriceValue(prop: any): number {
  if (!prop) return 0;
  const info = prop.informacoesbasicas || {};
  const raw = info.rentPrice ?? info.precoAluguel ?? info.aluguel ?? prop.rentPrice ?? prop.aluguel;
  return parsePriceValue(raw);
}

export function getPropertySeasonalPriceValue(prop: any): number {
  if (!prop) return 0;
  const info = prop.informacoesbasicas || {};
  const raw = info.seasonalPrice ?? info.precoTemporada ?? info.temporada ?? prop.seasonalPrice;
  return parsePriceValue(raw);
}

export function getPropertyPostalCode(prop: any): string {
  if (!prop) return '';
  const loc = prop.localizacao || {};
  const raw = loc.cep || loc.zipCode || loc.postalCode || prop.cep || prop.zipCode || '';
  const cleaned = String(raw).replace(/\D/g, '');
  return cleaned.length === 8 ? cleaned : '';
}

export function getPropertyMedia(prop: any): string[] {
  const mediaList = prop.midia || prop.media || prop.imagens || prop.images || prop.fotos || prop.galeria || [];
  if (!Array.isArray(mediaList)) return [];
  const urls = mediaList
    .map((m: any) => (typeof m === 'string' ? m : m?.url))
    .filter((url: string) => typeof url === 'string' && url.trim().length > 0 && url.startsWith('http'));
  
  return Array.from(new Set(urls));
}

export function getPropertyType(prop: any): string {
  return prop.caracteristicasimovel?.tipo || prop.tipo || prop.propertyType || 'Apartamento';
}

/**
 * Mapeamento oficial VRSync / Canal Pro para PropertyType oficial
 */
export function mapToVrsyncListingType(tipo: string): { listingType: string; isSupported: boolean } {
  if (!tipo) return { listingType: 'Residential / Apartment', isSupported: false };
  const t = tipo.toLowerCase().trim();

  // Residencial
  if (t.includes('cobertura')) return { listingType: 'Residential / Penthouse', isSupported: true };
  if (t.includes('flat') || t.includes('apart hotel')) return { listingType: 'Residential / Flat', isSupported: true };
  if (t.includes('loft')) return { listingType: 'Residential / Loft', isSupported: true };
  if (t.includes('studio')) return { listingType: 'Residential / Studio', isSupported: true };
  if (t.includes('kitnet') || t.includes('conjugado')) return { listingType: 'Residential / Kitnet', isSupported: true };
  if (t.includes('apartamento') || t.includes('apto')) return { listingType: 'Residential / Apartment', isSupported: true };
  if (t.includes('sobrado')) return { listingType: 'Residential / Sobrado', isSupported: true };
  if (t.includes('condomínio') || t.includes('condominio')) return { listingType: 'Residential / Condo', isSupported: true };
  if (t.includes('vila')) return { listingType: 'Residential / Village House', isSupported: true };
  if (t.includes('chácara') || t.includes('chacara')) return { listingType: 'Residential / Farm Ranch', isSupported: true };
  if (t.includes('fazenda') || t.includes('sítio') || t.includes('sitio')) return { listingType: 'Residential / Agricultural', isSupported: true };
  if (t.includes('casa')) return { listingType: 'Residential / Home', isSupported: true };

  // Terrenos / Lotes / Rurais
  if (t.includes('terreno comercial') || t.includes('lote comercial')) return { listingType: 'Commercial / Land Lot', isSupported: true };
  if (t.includes('terreno') || t.includes('lote') || t.includes('loteamento')) return { listingType: 'Residential / Land Lot', isSupported: true };

  // Comercial
  if (t.includes('consultório') || t.includes('consultorio')) return { listingType: 'Commercial / Consultorio', isSupported: true };
  if (t.includes('galpão') || t.includes('depósito') || t.includes('armazém') || t.includes('galpao') || t.includes('deposito')) return { listingType: 'Commercial / Industrial', isSupported: true };
  if (t.includes('garagem') || t.includes('vaga')) return { listingType: 'Commercial / Garage', isSupported: true };
  if (t.includes('hotel') || t.includes('pousada') || t.includes('motel')) return { listingType: 'Commercial / Hotel', isSupported: true };
  if (t.includes('andar') || t.includes('laje') || t.includes('laje corporativa')) return { listingType: 'Commercial / Corporate Floor', isSupported: true };
  if (t.includes('loja') || t.includes('salão') || t.includes('ponto') || t.includes('salao') || t.includes('ponto comercial')) return { listingType: 'Commercial / Business', isSupported: true };
  if (t.includes('prédio inteiro') || t.includes('predio inteiro')) return { listingType: 'Commercial / Edificio Comercial', isSupported: true };
  if (t.includes('sala') || t.includes('conjunto')) return { listingType: 'Commercial / Office', isSupported: true };
  if (t.includes('comercial')) return { listingType: 'Commercial / Building', isSupported: true };

  return { listingType: tipo, isSupported: false };
}

export function parseNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (Array.isArray(val)) {
    const parsed = parseInt(String(val[0]).replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseInt(String(val).replace(/\D/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseArea(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function resolveLivingArea(prop: any): number {
  const raw = prop.areaUtil ?? prop.caracteristicasimovel?.tamanho ?? prop.usableArea ?? prop.area ?? 0;
  return parseArea(raw);
}

export function resolveLotArea(prop: any): number {
  const raw = prop.areaTotal ?? prop.caracteristicasimovel?.tamanhoTotal ?? prop.terreno ?? prop.areaTerreno ?? prop.lotArea ?? prop.totalArea ?? 0;
  return parseArea(raw);
}

/**
 * ÚNICA FONTE DE VERDADE DE VALIDAÇÃO (Single Source of Truth) para o padrão VRSync do Canal Pro
 */
export function getCanalProValidationErrors(prop: any): CanalProValidationError[] {
  const errors: CanalProValidationError[] = [];

  if (!prop) {
    errors.push({ field: 'general', code: 'INVALID_OBJECT', message: 'Objeto de imóvel inválido.' });
    return errors;
  }

  if (!prop.id) {
    errors.push({ field: 'id', code: 'MISSING_ID', message: 'ID do imóvel ausente.' });
  }

  // Tipo / PropertyType
  const rawType = getPropertyType(prop);
  const mappedType = mapToVrsyncListingType(rawType);
  if (!mappedType.isSupported) {
    errors.push({ 
      field: 'tipo', 
      code: 'UNSUPPORTED_PROPERTY_TYPE', 
      message: `Tipo de imóvel '${rawType}' não é aceito pelo Canal Pro (VRSync).` 
    });
  }

  // Transação & Preços
  const info = prop.informacoesbasicas || {};
  const txTypes = info.transactionTypes || [];
  const finalidade = (prop.finalidade || '').toLowerCase();
  const isSale = txTypes.includes('sale') || finalidade.includes('venda');
  const isRent = txTypes.includes('rent') || finalidade.includes('aluguel');
  const isSeasonal = txTypes.includes('seasonal') || finalidade.includes('temporada');

  const salePrice = getPropertySalePrice(prop);
  const rentPrice = getPropertyRentalPriceValue(prop);
  const seasonalPrice = getPropertySeasonalPriceValue(prop);

  if (isSale && salePrice <= 0) {
    errors.push({ field: 'ListPrice', code: 'MISSING_SALE_PRICE', message: 'Preço de venda obrigatório para imóveis à venda.' });
  }
  if (isRent && rentPrice <= 0) {
    errors.push({ field: 'RentalPrice', code: 'MISSING_RENT_PRICE', message: 'Preço de aluguel obrigatório para imóveis para locação.' });
  }
  if (isSeasonal && seasonalPrice <= 0) {
    errors.push({ field: 'SeasonalPrice', code: 'MISSING_SEASONAL_PRICE', message: 'Preço de temporada obrigatório para imóveis de temporada.' });
  }
  if (!isSale && !isRent && !isSeasonal) {
    if (salePrice <= 0 && rentPrice <= 0) {
      errors.push({ field: 'Prices', code: 'MISSING_PRICES', message: 'Preço de venda e/ou aluguel obrigatório.' });
    }
  }

  // Localização & CEP
  const loc = prop.localizacao || {};
  const street = loc.logradouro || loc.street || loc.address;
  if (!street || String(street).trim() === '') {
    errors.push({ field: 'Address', code: 'MISSING_STREET', message: 'Logradouro / endereço não informado.' });
  }
  const city = loc.cidade || loc.city;
  if (!city || String(city).trim() === '') {
    errors.push({ field: 'City', code: 'MISSING_CITY', message: 'Cidade não informada.' });
  }
  const state = loc.estado || loc.state;
  if (!state || String(state).trim() === '') {
    errors.push({ field: 'State', code: 'MISSING_STATE', message: 'Estado não informado.' });
  }
  const postalCode = getPropertyPostalCode(prop);
  if (!postalCode) {
    errors.push({ field: 'PostalCode', code: 'INVALID_CEP', message: 'CEP inválido ou ausente (deve conter 8 dígitos).' });
  }

  // Regra de Área por Categoria VRSync
  const propertyType = mappedType.listingType;
  const isLandOrLot = propertyType.includes('Land Lot') || propertyType.includes('Agricultural') || propertyType.includes('Industrial');
  
  const livingArea = resolveLivingArea(prop);
  const lotArea = resolveLotArea(prop);

  if (isLandOrLot) {
    if (lotArea <= 0) {
      errors.push({ field: 'LotArea', code: 'MISSING_LOT_AREA', message: 'Área do terreno (LotArea) obrigatória e maior que zero para este tipo de imóvel.' });
    }
  } else {
    if (livingArea <= 0) {
      errors.push({ field: 'LivingArea', code: 'MISSING_LIVING_AREA', message: 'Área útil (LivingArea) obrigatória e maior que zero para este tipo de imóvel.' });
    }
  }

  // Mídia / Fotos (Mínimo 1 foto válida)
  const media = getPropertyMedia(prop);
  if (media.length === 0) {
    errors.push({ field: 'Media', code: 'MISSING_PHOTOS', message: 'São necessárias pelo menos 1 foto válida com URL pública.' });
  }

  return errors;
}

export const ORAORA_TO_VRSYNC_FEATURE_MAP: Record<string, string> = {
  // Características privativas / imóvel
  'mobiliado': 'Furnished',
  'varanda': 'Balcony',
  'sacada': 'Balcony',
  'varanda gourmet': 'Gourmet Balcony',
  'closet': 'Closet',
  'lavabo': 'Lavabo',
  'escritório': 'Home Office',
  'home office': 'Home Office',
  'cozinha americana': 'American Kitchen',
  'cozinha planejada': 'Kitchen Cabinets',
  'armário na cozinha': 'Kitchen Cabinets',
  'armários na cozinha': 'Kitchen Cabinets',
  'armário no banheiro': 'Bathroom Cabinets',
  'armários no banheiro': 'Bathroom Cabinets',
  'armário embutido': 'Builtin Wardrobe',
  'armários embutidos': 'Builtin Wardrobe',
  'móvel planejado': 'Planned Furniture',
  'móveis planejados': 'Planned Furniture',
  'ar condicionado': 'Cooling',
  'ar-condicionado': 'Cooling',
  'vista mar': 'Ocean View',
  'vista para o mar': 'Ocean View',
  'área de serviço': 'Laundry',
  'lavanderia': 'Laundry',
  'depósito privativo': 'Storage',
  'fechadura digital': 'Digital Locker',
  'hidromassagem': 'Whirlpool',
  'lareira': 'Fireplace',
  'box blindex': 'Blindex Box',
  'janela grande': 'Large Window',
  'aceita animais': 'Pets Allowed',
  'ventilação natural': 'Natural Ventilation',
  'sala de jantar': 'Dinner Room',

  // Áreas comuns / Lazer / Edifício
  'piscina': 'Pool',
  'piscina aquecida': 'Heated Pool',
  'piscina infantil': 'Childrens Pool',
  'academia': 'Gym',
  'churrasqueira': 'BBQ',
  'espaço gourmet': 'Gourmet Area',
  'salão de festas': 'Party Room',
  'salão de jogos': 'Game room',
  'playground': 'Playground',
  'brinquedoteca': 'Toys Place',
  'sauna': 'Sauna',
  'quadra poliesportiva': 'Sports Court',
  'quadra de tênis': 'Tennis court',
  'pet place': 'Pet Space',
  'espaço pet': 'Pet Space',
  'bicicletário': 'Bicycles Place',
  'elevador': 'Elevator',
  'portaria 24h': 'Concierge 24h',
  'gerador': 'Generator',
  'jardim': 'Garden Area',
  'área de lazer': 'Recreation Area',
  'spa': 'Spa',
  'cinema': 'Media Room',
  'coworking': 'Coworking',
};

export const ORAORA_TO_VRSYNC_PROXIMITY_MAP: Record<string, string> = {
  'próximo a escolas': 'Close to schools',
  'escola': 'Close to schools',
  'próximo a hospitais': 'Close to hospitals',
  'hospital': 'Close to hospitals',
  'próximo a shopping': 'Close to shopping',
  'shopping': 'Close to shopping',
  'supermercado': 'Close to supermarket',
};

export function cleanDescriptionForVrsync(raw: string): string {
  if (!raw) return '';
  let text = String(raw);
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/<[^>]*>?/gm, '');
  text = text.split('\n')
    .map(line => line.trim())
    .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
    .join('\n')
    .trim();
  if (text.length > 3000) {
    text = text.slice(0, 3000).trim();
  }
  text = text.replace(/\]\]>/g, ']]]]><![CDATA[>');
  return text;
}

export function getPropertyFeatures(prop: any): string[] {
  const rawFeatures: string[] = [];
  if (Array.isArray(prop.caracteristicas)) rawFeatures.push(...prop.caracteristicas);
  if (Array.isArray(prop.areascomuns)) rawFeatures.push(...prop.areascomuns);
  if (Array.isArray(prop.lazerItens)) rawFeatures.push(...prop.lazerItens);
  
  const mapped = new Set<string>();
  for (const feat of rawFeatures) {
    if (typeof feat !== 'string') continue;
    const key = feat.toLowerCase().trim();
    const vrsyncFeat = ORAORA_TO_VRSYNC_FEATURE_MAP[key];
    if (vrsyncFeat) {
      mapped.add(vrsyncFeat);
    }
  }

  if (Array.isArray(prop.proximidades)) {
    for (const prox of prop.proximidades) {
      if (typeof prox !== 'string') continue;
      const key = prox.toLowerCase().trim();
      const vrsyncProx = ORAORA_TO_VRSYNC_PROXIMITY_MAP[key];
      if (vrsyncProx) {
        mapped.add(vrsyncProx);
      }
    }
  }

  return Array.from(mapped);
}

export function generateCanalProXml(properties: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">\n';
  xml += '  <Listings>\n';

  for (const prop of properties) {
    const validationErrors = getCanalProValidationErrors(prop);
    if (validationErrors.length > 0) {
      console.warn(`[VrsyncXmlFeed] Imóvel ${prop.id || 'desconhecido'} rejeitado:`, validationErrors.map(e => e.message).join(' | '));
      continue;
    }

    const listingId = escapeXml(normalizeListingId(prop.id));
    const title = escapeXml(prop.informacoesbasicas?.nome || prop.titulo || prop.title || 'Imóvel');
    const rawDesc = prop.informacoesbasicas?.descricao || prop.descricao || prop.description || '';
    
    const mappedTypeObj = mapToVrsyncListingType(getPropertyType(prop));
    const propertyType = escapeXml(mappedTypeObj.listingType);
    const isLandOrLot = propertyType.includes('Land Lot') || propertyType.includes('Agricultural') || propertyType.includes('Industrial');

    const info = prop.informacoesbasicas || {};
    const txTypes = info.transactionTypes || [];
    const finalidade = (prop.finalidade || '').toLowerCase();
    const isSale = txTypes.includes('sale') || finalidade.includes('venda');
    const isRent = txTypes.includes('rent') || finalidade.includes('aluguel');
    const transactionType = isSale && isRent ? 'For Sale / Rent' : isRent ? 'For Rent' : 'For Sale';

    const listPrice = getPropertySalePrice(prop);
    const rentalPrice = getPropertyRentalPriceValue(prop);
    const seasonalPrice = getPropertySeasonalPriceValue(prop);
    const condominiumFee = parsePriceValue(info.condominio);
    const tax = parsePriceValue(info.iptu);

    const loc = prop.localizacao || {};
    const street = escapeXml(loc.logradouro || loc.street || loc.address || '');
    const number = escapeXml(loc.numero || loc.number || 'S/N');
    const neighborhood = escapeXml(loc.bairro || loc.neighborhood || '');
    const city = escapeXml(loc.cidade || loc.city || '');
    const state = escapeXml(loc.estado || loc.state || '');
    const postalCode = escapeXml(getPropertyPostalCode(prop));

    const bedrooms = isLandOrLot ? 0 : parseNumber(prop.quartos ?? prop.caracteristicasimovel?.quartos);
    const suites = isLandOrLot ? 0 : parseNumber(prop.caracteristicasimovel?.suites ?? prop.suites);
    const bathrooms = isLandOrLot ? 0 : parseNumber(prop.banheiros ?? prop.caracteristicasimovel?.banheiros);
    const garage = parseNumber(prop.vagas ?? prop.caracteristicasimovel?.vagas);
    const livingArea = Math.round(resolveLivingArea(prop));
    const lotArea = Math.round(resolveLotArea(prop));
    const features = getPropertyFeatures(prop);

    const media = getPropertyMedia(prop);
    const videoUrl = prop.videoUrl || prop.youtubeUrl || prop.videos?.[0] || '';

    xml += '    <Listing>\n';
    xml += `      <ListingID>${listingId}</ListingID>\n`;
    xml += `      <Title>${title}</Title>\n`;
    xml += `      <TransactionType>${transactionType}</TransactionType>\n`;

    // Details / Preços e Características (Description e Features agora ficam DENTRO de Details conforme VRSync spec)
    xml += '      <Details>\n';
    xml += `        <PropertyType>${propertyType}</PropertyType>\n`;
    
    const cleanDesc = cleanDescriptionForVrsync(rawDesc);
    if (cleanDesc) {
      xml += `        <Description><![CDATA[${cleanDesc}]]></Description>\n`;
    }

    if (listPrice > 0) xml += `        <ListPrice currency="BRL">${listPrice}</ListPrice>\n`;
    if (rentalPrice > 0) xml += `        <RentalPrice currency="BRL">${rentalPrice}</RentalPrice>\n`;
    if (seasonalPrice > 0) xml += `        <SeasonalPrice currency="BRL">${seasonalPrice}</SeasonalPrice>\n`;
    if (condominiumFee > 0) xml += `        <PropertyAdministrationFee currency="BRL">${condominiumFee}</PropertyAdministrationFee>\n`;
    if (tax > 0) xml += `        <Iptu currency="BRL" period="Yearly">${tax}</Iptu>\n`;

    if (!isLandOrLot && livingArea > 0) {
      xml += `        <LivingArea unit="square metres">${livingArea}</LivingArea>\n`;
    }
    if (lotArea > 0) {
      xml += `        <LotArea unit="square metres">${lotArea}</LotArea>\n`;
    }

    if (!isLandOrLot && bedrooms > 0) {
      xml += `        <Bedrooms>${bedrooms}</Bedrooms>\n`;
    }
    if (!isLandOrLot && suites > 0) {
      xml += `        <Suites>${suites}</Suites>\n`;
    }
    if (!isLandOrLot && bathrooms > 0) {
      xml += `        <Bathrooms>${bathrooms}</Bathrooms>\n`;
    }
    if (garage > 0) {
      xml += `        <Garage type="Parking Space">${garage}</Garage>\n`;
    }

    if (features.length > 0) {
      xml += '        <Features>\n';
      features.forEach(f => {
        xml += `          <Feature>${escapeXml(f)}</Feature>\n`;
      });
      xml += '        </Features>\n';
    }

    xml += '      </Details>\n';

    // Location
    xml += '      <Location>\n';
    if (state) xml += `        <State>${state}</State>\n`;
    if (city) xml += `        <City>${city}</City>\n`;
    if (neighborhood) xml += `        <Neighborhood>${neighborhood}</Neighborhood>\n`;
    if (street) xml += `        <Address>${street}</Address>\n`;
    if (number) xml += `        <StreetNumber>${number}</StreetNumber>\n`;
    if (postalCode) xml += `        <PostalCode>${postalCode}</PostalCode>\n`;
    xml += '      </Location>\n';

    // Media
    if (media.length > 0) {
      xml += '      <Media>\n';
      media.forEach((url, idx) => {
        const primary = idx === 0 ? 'true' : 'false';
        xml += `        <Item medium="image" primary="${primary}">${escapeXml(url)}</Item>\n`;
      });
      if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim().startsWith('http')) {
        xml += `        <Item medium="video">${escapeXml(videoUrl)}</Item>\n`;
      }
      xml += '      </Media>\n';
    }

    xml += '    </Listing>\n';
  }

  xml += '  </Listings>\n';
  xml += '</ListingDataFeed>';
  return xml;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

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
 * Mapeamento oficial VRSync / Canal Pro para Tipo de Imóvel
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
  if (t.includes('vila')) return { listingType: 'Residential / Vila', isSupported: true };
  if (t.includes('casa')) return { listingType: 'Residential / House', isSupported: true };

  // Terrenos / Rurais
  if (t.includes('loteamento') || t.includes('lote')) return { listingType: 'Land / Lot', isSupported: true };
  if (t.includes('terreno')) return { listingType: 'Land / Land', isSupported: true };
  if (t.includes('sítio') || t.includes('sitio')) return { listingType: 'Agricultural / Farm', isSupported: true };
  if (t.includes('chácara') || t.includes('chacara')) return { listingType: 'Agricultural / Farmhouse', isSupported: true };
  if (t.includes('fazenda')) return { listingType: 'Agricultural / Ranch', isSupported: true };
  if (t.includes('haras')) return { listingType: 'Agricultural / Ranch', isSupported: true };

  // Comercial
  if (t.includes('sala')) return { listingType: 'Commercial / Office', isSupported: true };
  if (t.includes('loja')) return { listingType: 'Commercial / Store', isSupported: true };
  if (t.includes('galpão') || t.includes('depósito') || t.includes('armazém')) return { listingType: 'Commercial / Industrial', isSupported: true };
  if (t.includes('prédio') || t.includes('conjunto')) return { listingType: 'Commercial / Building', isSupported: true };
  if (t.includes('hotel') || t.includes('pousada')) return { listingType: 'Commercial / Hotel', isSupported: true };

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

  // Tipo / ListingType
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
  const usableArea = parseArea(prop.areaUtil ?? prop.caracteristicasimovel?.tamanho);
  const totalArea = parseArea(prop.areaTotal ?? prop.caracteristicasimovel?.tamanhoTotal);
  const requiresTotalArea = ['Land / Lot', 'Land / Land', 'Commercial / Industrial'].includes(mappedType.listingType);

  if (requiresTotalArea) {
    if (totalArea <= 0) {
      errors.push({ field: 'TotalArea', code: 'MISSING_TOTAL_AREA', message: 'Área total obrigatória e deve ser maior que zero para este tipo de imóvel.' });
    }
  } else {
    if (usableArea <= 0) {
      errors.push({ field: 'UsableArea', code: 'MISSING_USABLE_AREA', message: 'Área útil obrigatória e deve ser maior que zero para este tipo de imóvel.' });
    }
  }

  // Mídia / Fotos (Mínimo 1 foto válida)
  const media = getPropertyMedia(prop);
  if (media.length === 0) {
    errors.push({ field: 'Media', code: 'MISSING_PHOTOS', message: 'São necessárias pelo menos 1 foto válida com URL pública.' });
  }

  return errors;
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
    const description = escapeXml(rawDesc.replace(/<[^>]*>?/gm, '').trim());
    const mappedTypeObj = mapToVrsyncListingType(getPropertyType(prop));
    const listingType = escapeXml(mappedTypeObj.listingType);

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

    // Isenções oficiais VRSync: Lote, Terreno, Galpão, Depósito, Armazém não levam quartos/banheiros
    const isExemptFromRooms = ['Land / Lot', 'Land / Land', 'Commercial / Industrial'].includes(listingType);
    const requiresTotalArea = isExemptFromRooms;

    const bedrooms = isExemptFromRooms ? 0 : parseNumber(prop.quartos ?? prop.caracteristicasimovel?.quartos);
    const bathrooms = isExemptFromRooms ? 0 : parseNumber(prop.banheiros ?? prop.caracteristicasimovel?.banheiros ?? prop.caracteristicasimovel?.suites);
    const garages = parseNumber(prop.vagas ?? prop.caracteristicasimovel?.vagas);
    const usableArea = parseArea(prop.areaUtil ?? prop.caracteristicasimovel?.tamanho);
    const totalArea = parseArea(prop.areaTotal ?? prop.caracteristicasimovel?.tamanhoTotal);

    const media = getPropertyMedia(prop);
    const videoUrl = prop.videoUrl || prop.youtubeUrl || prop.videos?.[0] || '';

    xml += '    <Listing>\n';
    xml += `      <ListingID>${listingId}</ListingID>\n`;
    xml += `      <Title>${title}</Title>\n`;
    xml += `      <TransactionType>${transactionType}</TransactionType>\n`;
    xml += `      <ListingType>${listingType}</ListingType>\n`;
    
    if (description) {
      xml += `      <Description><![CDATA[${rawDesc.trim()}]]></Description>\n`;
    }

    // Details / Preços e Características
    xml += '      <Details>\n';
    if (listPrice > 0) xml += `        <ListPrice currency="BRL">${listPrice}</ListPrice>\n`;
    if (rentalPrice > 0) xml += `        <RentalPrice currency="BRL">${rentalPrice}</RentalPrice>\n`;
    if (seasonalPrice > 0) xml += `        <SeasonalPrice currency="BRL">${seasonalPrice}</SeasonalPrice>\n`;
    if (condominiumFee > 0) xml += `        <CondominiumFee currency="BRL">${condominiumFee}</CondominiumFee>\n`;
    if (tax > 0) xml += `        <Tax currency="BRL">${tax}</Tax>\n`;

    if (!requiresTotalArea && usableArea > 0) {
      xml += `        <UsableArea unit="square metres">${usableArea}</UsableArea>\n`;
    }
    if (totalArea > 0) {
      xml += `        <TotalArea unit="square metres">${totalArea}</TotalArea>\n`;
    }

    if (!isExemptFromRooms && bedrooms > 0) {
      xml += `        <Bedrooms>${bedrooms}</Bedrooms>\n`;
    }
    if (!isExemptFromRooms && bathrooms > 0) {
      xml += `        <Bathrooms>${bathrooms}</Bathrooms>\n`;
    }
    if (garages > 0) {
      xml += `        <Garages>${garages}</Garages>\n`;
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

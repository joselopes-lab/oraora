// /src/lib/feeds/canalpro-xml-generator.ts

export function generateCanalProXml(properties: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<ListingDataFeed\n';
  xml += '  xmlns="http://www.vivareal.com/schemas/1.0/VRSync"\n';
  xml += '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">\n';
  xml += '  <Listings>\n';

  for (const prop of properties) {
    const rejectionReason = getRejectionReason(prop);
    if (rejectionReason) {
      console.warn(`[CanalProFeed] Imóvel ${prop.id || 'desconhecido'} rejeitado: ${rejectionReason}`);
      continue;
    }

    const listingId = escapeXml(String(prop.id));
    const title = escapeXml(getPropertyTitle(prop));
    const description = escapeXml(getPropertyDescription(prop));
    const operationType = mapToZapOperationType(prop);
    const listingType = mapToZapListingType(getPropertyType(prop));
    const price = getPropertyPrice(prop, operationType);
    const rentalPrice = getPropertyRentalPrice(prop, operationType);
    
    const loc = prop.localizacao || {};
    const street = escapeXml(loc.logradouro || loc.street || loc.address || '');
    const number = escapeXml(loc.numero || loc.number || 'S/N');
    const neighborhood = escapeXml(loc.bairro || loc.neighborhood || '');
    const city = escapeXml(loc.cidade || loc.city || '');
    const state = escapeXml(loc.estado || loc.state || '');
    const zipCode = escapeXml((loc.cep || loc.zipCode || '').replace(/\D/g, ''));

    const bedrooms = parseNumber(prop.quartos ?? prop.caracteristicasimovel?.quartos);
    const bathrooms = parseNumber(prop.banheiros ?? prop.caracteristicasimovel?.banheiros ?? prop.caracteristicasimovel?.suites);
    const garages = parseNumber(prop.vagas ?? prop.caracteristicasimovel?.vagas);
    const usableArea = parseArea(prop.areaUtil ?? prop.caracteristicasimovel?.tamanho);
    const totalArea = parseArea(prop.areaTotal ?? prop.caracteristicasimovel?.tamanhoTotal);

    const mediaItems = getPropertyMedia(prop);

    xml += '    <Listing>\n';
    xml += `      <ListingID>${listingId}</ListingID>\n`;
    xml += `      <Title>${title}</Title>\n`;
    xml += `      <Description>${description}</Description>\n`;
    xml += `      <TransactionType>${operationType}</TransactionType>\n`;
    xml += `      <ListingType>${listingType}</ListingType>\n`;
    
    xml += '      <ContactInfo>\n';
    xml += `        <Name>${escapeXml(prop.contactName || prop.corretorNome || 'Atendimento')}</Name>\n`;
    xml += `        <Email>${escapeXml(prop.contactEmail || prop.corretorEmail || 'contato@ollar.com.br')}</Email>\n`;
    xml += '      </ContactInfo>\n';

    xml += '      <Location>\n';
    xml += '        <Country>BR</Country>\n';
    if (state) xml += `        <State>${state}</State>\n`;
    if (city) xml += `        <City>${city}</City>\n`;
    if (neighborhood) xml += `        <Neighborhood>${neighborhood}</Neighborhood>\n`;
    if (street) xml += `        <Street>${street}</Street>\n`;
    if (number) xml += `        <StreetNumber>${number}</StreetNumber>\n`;
    if (zipCode) xml += `        <ZipCode>${zipCode}</ZipCode>\n`;
    xml += '      </Location>\n';

    xml += '      <Details>\n';
    if (price > 0 && operationType !== 'For Rent') {
      xml += `        <ListPrice currency="BRL">${price}</ListPrice>\n`;
    }
    if (rentalPrice > 0 && (operationType === 'For Rent' || operationType === 'Sale/Rent')) {
      xml += `        <RentalPrice currency="BRL">${rentalPrice}</RentalPrice>\n`;
    }
    if (bedrooms >= 0) xml += `        <Bedrooms>${bedrooms}</Bedrooms>\n`;
    if (bathrooms >= 0) xml += `        <Bathrooms>${bathrooms}</Bathrooms>\n`;
    if (garages >= 0) xml += `        <Garages>${garages}</Garages>\n`;
    if (usableArea > 0) xml += `        <UsableArea>${usableArea}</UsableArea>\n`;
    if (totalArea > 0) xml += `        <TotalArea>${totalArea}</TotalArea>\n`;
    xml += '        <Features>\n';
    xml += '          <Feature>Imóvel Padrão</Feature>\n';
    xml += '        </Features>\n';
    xml += '      </Details>\n';

    xml += '      <Media>\n';
    mediaItems.forEach((url, idx) => {
      const isPrimary = idx === 0 ? ' primary="true"' : '';
      xml += `        <Item medium="image"${isPrimary}>${escapeXml(url)}</Item>\n`;
    });
    xml += '      </Media>\n';
    xml += '    </Listing>\n';
  }

  xml += '  </Listings>\n';
  xml += '</ListingDataFeed>';
  return xml;
}

function parsePriceValue(val: any): number {
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

function getPropertySalePrice(prop: any): number {
  if (!prop) return 0;
  const info = prop.informacoesbasicas || {};
  const raw = info.salePrice ?? info.precoVenda ?? info.valor ?? prop.salePrice ?? prop.precoVenda ?? prop.valor ?? prop.price;
  return parsePriceValue(raw);
}

function getPropertyRentalPriceValue(prop: any): number {
  if (!prop) return 0;
  const info = prop.informacoesbasicas || {};
  const raw = info.rentPrice ?? info.precoAluguel ?? info.aluguel ?? prop.rentPrice ?? prop.aluguel;
  return parsePriceValue(raw);
}

function getRejectionReason(prop: any): string | null {
  if (!prop) return 'Objeto de imóvel inválido';
  if (!prop.id) return 'ID do imóvel ausente';
  
  const salePrice = getPropertySalePrice(prop);
  const rentPrice = getPropertyRentalPriceValue(prop);
  const price = salePrice > 0 ? salePrice : rentPrice;
  if (!price || price <= 0) return 'Preço ausente ou inválido';

  const loc = prop.localizacao || {};
  if (!loc.logradouro && !loc.street && !loc.address) return 'Logradouro ausente';
  if (!loc.cidade && !loc.city) return 'Cidade ausente';
  if (!loc.estado && !loc.state) return 'Estado ausente';
  if (!loc.cep && !loc.zipCode) return 'CEP ausente';

  const media = getPropertyMedia(prop);
  if (media.length === 0) return 'Nenhuma foto/mídia válida cadastrada';

  return null;
}

function getPropertyTitle(prop: any): string {
  return prop.informacoesbasicas?.nome || prop.titulo || prop.title || 'Imóvel sem título';
}

function getPropertyDescription(prop: any): string {
  const desc = prop.informacoesbasicas?.descricao || prop.descricao || prop.description || '';
  return desc.replace(/<[^>]*>?/gm, '').trim();
}

function getPropertyType(prop: any): string {
  return prop.caracteristicasimovel?.tipo || prop.tipo || prop.propertyType || 'Apartamento';
}

function mapToZapListingType(tipo: string): string {
  if (!tipo) return 'Apartamento';
  const t = tipo.toLowerCase().trim();
  if (t.includes('casa') || t.includes('sobrado') || t.includes('bangalô') || t.includes('geminada')) return 'Casa';
  if (t.includes('cobertura')) return 'Cobertura';
  if (t.includes('kitnet') || t.includes('studio')) return 'Studio';
  if (t.includes('loft')) return 'Loft';
  if (t.includes('flat') || t.includes('apart hotel')) return 'Flat';
  if (t.includes('comercial') || t.includes('sala') || t.includes('loja') || t.includes('escritório')) return 'Comercial';
  if (t.includes('terreno') || t.includes('lote')) return 'Terreno';
  if (t.includes('sítio') || t.includes('sitio') || t.includes('chácara') || t.includes('chacara') || t.includes('fazenda')) return 'Sítio';
  return 'Apartamento';
}

function mapToZapOperationType(prop: any): string {
  const info = prop.informacoesbasicas || {};
  const txTypes = info.transactionTypes || [];
  const finalidade = (prop.finalidade || '').toLowerCase();

  const isSale = txTypes.includes('sale') || finalidade.includes('venda');
  const isRent = txTypes.includes('rent') || finalidade.includes('aluguel');

  if (isSale && isRent) return 'Sale/Rent';
  if (isRent) return 'For Rent';
  return 'For Sale';
}

function getPropertyPrice(prop: any, opType: string): number {
  return getPropertySalePrice(prop);
}

function getPropertyRentalPrice(prop: any, opType: string): number {
  return getPropertyRentalPriceValue(prop);
}

function parseNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (Array.isArray(val)) {
    const parsed = parseInt(String(val[0]).replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseInt(String(val).replace(/\D/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function parseArea(val: any): number {
  if (val === undefined || val === null) return 0;
  const cleaned = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function getPropertyMedia(prop: any): string[] {
  const mediaList = prop.midia || prop.media || [];
  if (!Array.isArray(mediaList)) return [];
  return mediaList
    .map((m: any) => (typeof m === 'string' ? m : m?.url))
    .filter((url: string) => typeof url === 'string' && url.trim().length > 0 && url.startsWith('http'));
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

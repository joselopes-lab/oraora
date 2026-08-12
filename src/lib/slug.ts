/**
 * Utilitário de geração de slugs semânticos para imóveis.
 * Converte títulos, tipos e localizações em URLs limpas e amigáveis para SEO.
 */
/**
 * Utilitário de geração de slugs semânticos geográficos para imóveis.
 * Regra oficial: [NOME DO IMÓVEL] + [BAIRRO] + [CIDADE] + [UF]
 */
export function generateSemanticSlug(property: any): string {
  // Se houver um slug SEO explícito cadastrado que já contenha o contexto, podemos respeitar ou derivar.
  // Vamos construir de forma determinística com base nos dados reais disponíveis:
  const info = property?.informacoesbasicas || property?.info || {};
  const loc = property?.localizacao || property?.location || {};

  const parts: string[] = [];

  // 1. Nome do imóvel ou título
  const nome = info.nome || info.titulo || property?.nome || '';
  if (nome && nome.trim() !== '') {
    parts.push(nome);
  } else {
    // Fallback se não houver nome
    const char = property?.caracteristicasimovel || property?.characteristics || {};
    if (char.tipo) parts.push(char.tipo);
    if (info.status) parts.push(info.status);
    if (char.quartos) parts.push(`${char.quartos}-quartos`);
    if (parts.length === 0) {
      parts.push(property?.id || 'imovel');
    }
  }

  // 2. Bairro
  const bairro = loc.bairro || loc.neighborhood || '';
  if (bairro && bairro.trim() !== '') {
    parts.push(bairro);
  }

  // 3. Cidade
  const cidade = loc.cidade || loc.city || '';
  if (cidade && cidade.trim() !== '') {
    parts.push(cidade);
  }

  // 4. Estado / UF
  const uf = loc.estado || loc.uf || loc.state || '';
  if (uf && uf.trim() !== '') {
    parts.push(uf);
  }

  const raw = parts.join(' ');

  let slug = String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || property?.id || 'imovel';
}

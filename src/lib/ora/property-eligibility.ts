export function isEligibleForPublicInventory(data: any): boolean {
  if (!data) return false;

  // Fail closed: matching real portal queries where isVisibleOnSite must be explicitly true
  // true -> eligible
  // false, undefined, null, missing -> ineligible
  if (data.isVisibleOnSite !== true) return false;
  if (data.isActive === false) return false;

  const status = typeof data.status === 'string' ? data.status.toLowerCase() : '';
  const basicStatus = data.informacoesbasicas?.status ? String(data.informacoesbasicas.status).toLowerCase() : '';

  if (status === 'inactive' === true || status === 'arquivado' || status === 'draft' || status === 'rascunho') {
    return false;
  }
  if (basicStatus === 'inactive' || basicStatus === 'arquivado' || basicStatus === 'draft' || basicStatus === 'rascunho') {
    return false;
  }

  const city = data.localizacao?.cidade || data.city;
  const basic = data.informacoesbasicas || {};
  const rawPrice = basic.valorVenda ?? basic.preco ?? basic.salePrice ?? basic.valor ?? data.price;
  const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : NaN;

  if (!city || isNaN(price) || price <= 0) {
    return false;
  }

  return true;
}


/**
 * Normalizador defensivo para payload de leads do Canal Pro/Grupo ZAP.
 * Esta camada isola a lógica de extração do payload oficial dos ZAP/OLX.
 */

export interface NormalizedLead {
  externalId: string | null;
  listingId: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function normalizeCanalProLead(payload: any): NormalizedLead {
  return {
    externalId: payload.originLeadId || payload.id || null,
    listingId: payload.clientListingId || payload.listingId || payload.id || null,
    name: payload.leadName || payload.name || 'Cliente Canal Pro',
    email: payload.leadEmail || payload.email || '',
    phone: payload.leadPhone || payload.phone || '',
    message: payload.message || ''
  };
}

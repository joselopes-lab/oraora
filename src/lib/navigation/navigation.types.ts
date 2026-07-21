/**
 * @fileOverview ORAORA NAVIGATION SDK 1.0 - Tipagem Oficial
 */

export interface NavigationContext {
  slug: string;
  pathname: string;
}

export interface NavigationService {
  home: () => string;
  about: () => string;
  contact: () => string;
  services: () => string;
  properties: () => string;
  search: (query?: string) => string;
  property: (idOrSlug: string) => string;
  map: () => string;
  privacy: () => string;
  terms: () => string;
  whatsapp: (phone?: string, text?: string) => string;
  cta: () => string;
}

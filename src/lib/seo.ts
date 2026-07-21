
/**
 * @fileOverview ORAORA AI INDEX ENGINE 1.0
 * 
 * Camada de inteligência semântica e SEO Multi-Tenant.
 * Responsável por gerar o Knowledge Graph da plataforma para Google, Gemini e ChatGPT.
 */

import { Metadata } from 'next';

export type SeoStrategy = "broker" | "portal" | "shared";

const MAIN_DOMAIN = 'oraora.com.br';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || `https://${MAIN_DOMAIN}`;

/**
 * MÓDULO 01 & 02: ENTITY & RELATIONSHIP ENGINE
 * Resolve URLs e bases semânticas.
 */
export function getBaseUrl(broker?: any) {
  if (broker?.seoSettings?.customDomain && broker?.seoSettings?.customDomainVerified) {
    return `https://${broker.seoSettings.customDomain}`;
  }
  if (broker?.slug) {
    return `https://${broker.slug}.${MAIN_DOMAIN}`;
  }
  return BASE_URL;
}

export function getCanonicalUrl(property: any, currentHostname: string, broker?: any) {
  const strategy = property.seo?.canonicalStrategy || (property.brokerId ? "broker" : "portal");
  const slug = property.seo?.slug || property.informacoesbasicas?.slug || property.id;
  
  if (strategy === "broker" && broker) {
    return `${getBaseUrl(broker)}/imovel/${slug}`;
  }
  return `${BASE_URL}/imoveis/${slug}`;
}

/**
 * MÓDULO 03: SCHEMA ENGINE
 * Gera JSON-LD completo para Entidades e Knowledge Graph.
 */

// Schema para a Organização (Portal Oraora)
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": "Oraora",
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo-oraora.png`
    },
    "sameAs": [
      "https://instagram.com/oraora",
      "https://linkedin.com/company/oraora"
    ]
  };
}

// Schema para o Agente/Corretor (RealEstateAgent)
export function generateBrokerJsonLd(broker: any) {
  const baseUrl = getBaseUrl(broker);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${baseUrl}/#agent`,
    "name": broker.brandName,
    "url": baseUrl,
    "image": broker.logoUrl,
    "telephone": broker.footerContactPhone,
    "email": broker.footerContactEmail,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": broker.footerContactAddress,
      "addressLocality": broker.city,
      "addressRegion": broker.creciState,
      "addressCountry": "BR"
    },
    "priceRange": "$$$",
    "memberOf": { "@id": `${BASE_URL}/#organization` }
  };
}

// Schema para o Imóvel (Knowledge Graph Ready)
export function generatePropertyJsonLd(property: any, baseUrl: string) {
  const price = property.informacoesbasicas?.salePrice || property.informacoesbasicas?.valor || 0;
  const slug = property.seo?.slug || property.informacoesbasicas?.slug || property.id;
  
  // MÓDULO 05: AI READY CONTENT
  const bedrooms = parseInt(String(property.caracteristicasimovel?.quartos || 0));
  const size = parseFloat(String(property.caracteristicasimovel?.tamanho || 0).replace(/[^\d.]/g, ''));

  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Residence"],
    "name": property.informacoesbasicas?.nome,
    "description": property.informacoesbasicas?.descricao?.replace(/<[^>]*>?/gm, '').substring(0, 160),
    "url": `${baseUrl}/imoveis/${slug}`,
    "image": property.midia,
    "numberOfRooms": bedrooms > 0 ? bedrooms : undefined,
    "floorSize": size > 0 ? {
      "@type": "QuantitativeValue",
      "value": size,
      "unitCode": "MTK"
    } : undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.localizacao?.cidade,
      "addressRegion": property.localizacao?.estado,
      "streetAddress": property.localizacao?.address,
      "addressNeighborhood": property.localizacao?.bairro
    },
    "geo": property.localizacao?.latitude ? {
      "@type": "GeoCoordinates",
      "latitude": property.localizacao.latitude,
      "longitude": property.localizacao.longitude
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "validFrom": property.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }
  };
}

/**
 * MÓDULO 04: SEMANTIC METADATA
 * Resolve regras de Robots e Tags Sociais.
 */
export function getRobotsRules(property: any, currentHostname: string) {
  if (property.isVisibleOnSite === false) return "noindex, nofollow";
  
  const isMainPortal = currentHostname.includes(MAIN_DOMAIN);
  const strategy = property.seo?.indexOnPortal ?? true;
  
  if (isMainPortal) {
    return strategy ? "index, follow" : "noindex, follow";
  }
  return "index, follow";
}

/**
 * MÓDULO 10: AI INDEX SCORE (Auditoria Interna)
 * Avalia o quanto o dado está pronto para ser consumido por IA.
 */
export function calculateAiScore(property: any): number {
  let score = 0;
  if (property.informacoesbasicas?.nome) score += 10;
  if (property.informacoesbasicas?.descricao) score += 15;
  if (property.localizacao?.latitude) score += 15;
  if (property.midia?.length > 2) score += 10;
  if (property.caracteristicasimovel?.tamanho) score += 15;
  if (property.caracteristicasimovel?.quartos) score += 15;
  if (property.builderId) score += 10;
  if (property.personaIds?.length) score += 10;
  return score;
}

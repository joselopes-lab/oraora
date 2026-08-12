
/**
 * @fileOverview ORAORA AI INDEX ENGINE 1.0
 * 
 * Camada de inteligência semântica e SEO Multi-Tenant.
 * Responsável por gerar o Knowledge Graph da plataforma para Google, Gemini e ChatGPT.
 */

import { Metadata } from 'next';
import { generateSemanticSlug } from '@/lib/slug';

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
  const slug = generateSemanticSlug(property);
  
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
  const updatedAt = broker.updatedAt?.toDate?.()?.toISOString() || broker.updatedAt || new Date().toISOString();
  
  const sameAs: string[] = [];
  if (broker.instagramUrl) sameAs.push(broker.instagramUrl);
  if (broker.facebookUrl) sameAs.push(broker.facebookUrl);
  if (broker.linkedinUrl) sameAs.push(broker.linkedinUrl);
  if (broker.youtubeUrl) sameAs.push(broker.youtubeUrl);
  if (broker.whatsappUrl) sameAs.push(broker.whatsappUrl);

  const knowsAbout: string[] = [];
  if (broker.specialties && Array.isArray(broker.specialties)) {
    knowsAbout.push(...broker.specialties);
  } else {
    knowsAbout.push("Compra de imóveis", "Venda de imóveis", "Locação de imóveis", "Imóveis de alto padrão");
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${baseUrl}/#agent`,
    "name": broker.brandName || broker.name,
    "url": baseUrl,
    "image": broker.logoUrl,
    ...(broker.footerSlogan || broker.bio || broker.description ? {
      "description": broker.footerSlogan || broker.bio || broker.description
    } : {}),
    "telephone": broker.footerContactPhone || broker.phone,
    "email": broker.footerContactEmail || broker.email,
    ...(broker.city ? {
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": broker.city
      }
    } : {}),
    ...(sameAs.length > 0 ? { "sameAs": sameAs } : {}),
    ...(knowsAbout.length > 0 ? { "knowsAbout": knowsAbout } : {}),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": broker.footerContactAddress,
      "addressLocality": broker.city,
      "addressRegion": broker.creciState,
      "addressCountry": "BR"
    },
    "priceRange": "$$$",
    "dateModified": updatedAt,
    "memberOf": { "@id": `${BASE_URL}/#organization` }
  };
}

// Schema para o Imóvel (Knowledge Graph Ready)
export function generatePropertyJsonLd(property: any, baseUrl: string, broker?: any) {
  const price = property.informacoesbasicas?.salePrice || property.informacoesbasicas?.valor || 0;
  const rentPrice = property.informacoesbasicas?.rentPrice || 0;
  const slug = property.seo?.slug || property.informacoesbasicas?.slug || property.id;
  
  // MÓDULO 05: AI READY CONTENT
  const bedrooms = parseInt(String(property.caracteristicasimovel?.quartos || 0));
  const bathrooms = parseInt(String(property.caracteristicasimovel?.suites || property.caracteristicasimovel?.banheiros || 0));
  const size = parseFloat(String(property.caracteristicasimovel?.tamanho || 0).replace(/[^\d.]/g, ''));
  const propertyType = property.caracteristicasimovel?.tipo || 'RealEstateProperty';
  
  const updatedAt = property.updatedAt?.toDate?.()?.toISOString() || property.seo?.lastModifiedAt?.toDate?.()?.toISOString() || new Date().toISOString();
  const createdAt = property.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

  const offers: any[] = [];
  if (price > 0) {
    offers.push({
      "@type": "Offer",
      "price": price,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "validFrom": createdAt,
      ...(broker ? {
        "offeredBy": {
          "@type": "RealEstateAgent",
          "name": broker.brandName,
          "url": getBaseUrl(broker),
          "telephone": broker.footerContactPhone,
          "email": broker.footerContactEmail
        }
      } : {})
    });
  }
  if (rentPrice > 0) {
    offers.push({
      "@type": "Demand",
      "price": rentPrice,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "validFrom": createdAt
    });
  }

  const developmentName = property.empreendimento || property.informacoesbasicas?.nomeCondominio;

  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Accommodation"],
    "@id": `${baseUrl}/imoveis/${slug}#listing`,
    "name": property.informacoesbasicas?.nome,
    "description": property.informacoesbasicas?.descricao?.replace(/<[^>]*>?/gm, '').substring(0, 300),
    "url": `${baseUrl}/imoveis/${slug}`,
    "image": property.midia || property.media || [],
    "dateCreated": createdAt,
    "dateModified": updatedAt,
    ...(property.physicalPropertyId ? {
      "identifier": {
        "@type": "PropertyValue",
        "propertyID": "physicalPropertyId",
        "value": property.physicalPropertyId
      }
    } : {}),
    "accommodationCategory": propertyType,
    "numberOfRooms": bedrooms > 0 ? bedrooms : undefined,
    "numberOfBedrooms": bedrooms > 0 ? bedrooms : undefined,
    "numberOfBathroomsTotal": bathrooms > 0 ? bathrooms : undefined,
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
      "addressNeighborhood": property.localizacao?.bairro,
      "postalCode": property.localizacao?.cep
    },
    "geo": property.localizacao?.latitude ? {
      "@type": "GeoCoordinates",
      "latitude": property.localizacao.latitude,
      "longitude": property.localizacao.longitude
    } : undefined,
    ...(developmentName ? {
      "containedInPlace": {
        "@type": "ApartmentComplex",
        "name": developmentName
      }
    } : {}),
    ...(property.builderId ? {
      "creator": {
        "@type": "Organization",
        "identifier": property.builderId,
        "name": "Construtora / Incorporadora"
      }
    } : {}),
    ...(property.knowledgeMetadata ? {
      "additionalProperty": [
        property.knowledgeMetadata.source ? {
          "@type": "PropertyValue",
          "propertyID": "dataSource",
          "value": property.knowledgeMetadata.source
        } : null,
        property.knowledgeMetadata.reliability ? {
          "@type": "PropertyValue",
          "propertyID": "dataReliability",
          "value": property.knowledgeMetadata.reliability
        } : null
      ].filter(Boolean)
    } : {}),
    "offers": offers.length > 0 ? (offers.length === 1 ? offers[0] : offers) : undefined
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

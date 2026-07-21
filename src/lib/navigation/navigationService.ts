'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationService } from './navigation.types';

/**
 * @fileOverview navigationService.ts - O Motor de Roteamento Multi-Tenant
 */

/**
 * Fábrica pura que gera as URLs baseada no contexto atual.
 */
export function getNavigation(slug: string, pathname: string): NavigationService {
  const isPortalAccess = pathname.startsWith('/sites');
  
  // Base para rotas do corretor
  // Se for via portal: /sites/slug
  // Se for domínio customizado: '' (root)
  const brokerBase = isPortalAccess ? `/sites/${slug}` : '';

  return {
    home: () => `${brokerBase}/`,
    about: () => `${brokerBase}/sobre`,
    contact: () => `${brokerBase}/fale-conosco`,
    services: () => `${brokerBase}/servicos`,
    properties: () => `${brokerBase}/search`,
    search: (query?: string) => `${brokerBase}/search${query ? `?${query}` : ''}`,
    property: (idOrSlug: string) => `${brokerBase}/imovel/${idOrSlug}`,
    map: () => `${brokerBase}/explorar-no-mapa`,
    
    // Rotas de utilidade global
    privacy: () => `/politica-de-privacidade`,
    terms: () => `/termos-de-uso`,
    
    // Geradores de links externos/especiais
    whatsapp: (phone?: string, text?: string) => {
      if (!phone) return '#';
      const cleanPhone = phone.replace(/\D/g, '');
      const encodedText = text ? encodeURIComponent(text) : '';
      return `https://wa.me/55${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
    },
    
    // Atalho para o CTA principal (geralmente contato)
    cta: () => `${brokerBase}/fale-conosco`
  };
}

/**
 * Hook oficial para consumo nos componentes de layout.
 */
export function useNavigation(slug: string) {
  const pathname = usePathname();
  return useMemo(() => getNavigation(slug, pathname), [slug, pathname]);
}

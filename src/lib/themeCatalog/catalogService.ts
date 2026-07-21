/**
 * @fileOverview catalogService.ts - Serviço de abstração do Catálogo de Temas.
 * 
 * Atua como mediador entre o Registry Técnico e a camada Comercial.
 * Na próxima etapa, o MOCK_THEME_CATALOG será substituído por chamadas ao Firestore.
 */

import { THEME_REGISTRY } from '@/layouts/registry';
import { MOCK_THEME_CATALOG } from './mockCatalog';
import { ThemeFullDefinition } from './types';

/**
 * Constrói a definição completa unindo os dois mundos (Manifest + Catálogo).
 */
function buildFullDefinition(id: string): ThemeFullDefinition | null {
  const technical = THEME_REGISTRY[id];
  const commercial = MOCK_THEME_CATALOG[id];

  if (!technical || !commercial) return null;

  return {
    id,
    technical,
    commercial
  };
}

/**
 * Retorna todos os temas disponíveis, ordenados comercialmente.
 */
export function getAllThemes(): ThemeFullDefinition[] {
  return Object.keys(THEME_REGISTRY)
    .map(id => buildFullDefinition(id))
    .filter((t): t is ThemeFullDefinition => t !== null)
    .sort((a, b) => a.commercial.displayOrder - b.commercial.displayOrder);
}

/**
 * Busca um tema específico por ID.
 */
export function getThemeById(id: string): ThemeFullDefinition | null {
  return buildFullDefinition(id);
}

/**
 * Filtra apenas temas em destaque.
 */
export function getFeaturedThemes(): ThemeFullDefinition[] {
  return getAllThemes().filter(t => t.commercial.featured);
}

/**
 * Filtra apenas temas premium.
 */
export function getPremiumThemes(): ThemeFullDefinition[] {
  return getAllThemes().filter(t => t.commercial.premium);
}

/**
 * Filtra apenas temas gratuitos.
 */
export function getFreeThemes(): ThemeFullDefinition[] {
  return getAllThemes().filter(t => t.commercial.price === 0);
}

/**
 * Filtra temas por categoria comercial.
 */
export function getThemesByCategory(category: string): ThemeFullDefinition[] {
  return getAllThemes().filter(t => t.commercial.category === category);
}

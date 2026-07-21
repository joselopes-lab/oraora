/**
 * @fileOverview themeLoader.ts - Motor de Carregamento de Temas e Páginas
 */

import { THEME_REGISTRY } from './themeRegistry';
import { ThemeDefinition, PageKey } from './types';

/**
 * Busca a definição completa de um tema pelo ID.
 * Caso o tema não exista, retorna o padrão "urban-padrao".
 */
export function getTheme(themeId: string | undefined): ThemeDefinition {
  const id = themeId || 'urban-padrao';
  const theme = THEME_REGISTRY[id];

  if (!theme) {
    console.warn(`[THEME_DEBUG] Fallback ativado! Tema "${id}" não encontrado no Registry.`);
    return THEME_REGISTRY['urban-padrao'];
  }

  return theme;
}

/**
 * Motor de Resolução de Páginas (Page Loader 1.0).
 * Retorna o componente específico do tema ou o fallback do Urban Padrão.
 */
export function getThemePage(themeId: string | undefined, pageKey: PageKey): React.ComponentType<any> {
  const activeTheme = getTheme(themeId);
  const urbanTheme = THEME_REGISTRY['urban-padrao'];

  // 1. Tenta obter a página do tema ativo
  const ThemePage = activeTheme.pages[pageKey];

  if (ThemePage) {
    return ThemePage;
  }

  // 2. Fallback para a página correspondente no Urban Padrão
  const FallbackPage = urbanTheme.pages[pageKey];
  
  if (FallbackPage) {
    console.log(`[THEME_LOADER] Página "${pageKey}" não encontrada no tema "${activeTheme.id}". Usando fallback Urban.`);
    return FallbackPage;
  }

  // 3. Fallback final para a Homepage do Urban (segurança extrema)
  return urbanTheme.component;
}

/**
 * Lista todos os layouts disponíveis para a Loja ou Admin.
 */
export function getAllThemes(): ThemeDefinition[] {
  return Object.values(THEME_REGISTRY);
}

/**
 * Filtra temas ativos e por categoria.
 */
export function getAvailableThemes(filters?: { premium?: boolean, category?: string }) {
  let list = getAllThemes().filter(t => t.manifest.status === 'active');
  
  if (filters?.premium !== undefined) {
    list = list.filter(t => t.manifest.premium === filters.premium);
  }
  
  if (filters?.category) {
    list = list.filter(t => t.manifest.category === filters.category);
  }
  
  return list;
}

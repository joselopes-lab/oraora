/**
 * @fileOverview themeLoader.ts - Motor de Carregamento de Temas e Páginas
 */

import { THEME_REGISTRY, THEME_PAGE_LOADERS } from './themeRegistry';
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
 * Retorna o componente específico do tema sob demanda via importação assíncrona.
 */
export async function getThemePage(themeId: string | undefined, pageKey: PageKey): Promise<React.ComponentType<any>> {
  const id = themeId || 'urban-padrao';
  const themeLoaders = THEME_PAGE_LOADERS[id] || THEME_PAGE_LOADERS['urban-padrao'];

  let loader = themeLoaders?.[pageKey];

  if (!loader) {
    loader = THEME_PAGE_LOADERS['urban-padrao']?.[pageKey];
  }

  if (!loader) {
    loader = THEME_PAGE_LOADERS['urban-padrao']?.['home'];
  }

  if (!loader) {
    throw new Error(`[THEME_LOADER] Não foi possível carregar página "${pageKey}" para o tema "${id}".`);
  }

  const module = await loader();
  return module.default;
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


/**
 * @fileOverview themeRegistry.ts - Dicionário Mestre de Layouts e Páginas
 * 
 * Centraliza o registro de todos os temas e mapeamento de carregamento dinâmico sob demanda.
 */

import { PageKey, ThemeDefinition } from './types';

// Metadados SDK 1.0 (apenas JSON / objetos leves, sem importar React components)
import { manifest as auraManifest } from '../aura/manifest';
import { config as auraConfig } from '../aura/config';
import { manifest as vertexManifest } from '../vertex/manifest';
import { config as vertexConfig } from '../vertex/config';

export type PageLoader = () => Promise<{ default: React.ComponentType<any> }>;

/**
 * Mapeamento de carregadores dinâmicos (sob demanda com await import)
 */
export const THEME_PAGE_LOADERS: Record<string, Partial<Record<PageKey, PageLoader>>> = {
  'urban-padrao': {
    home: () => import('@/layouts/urban-padrao/UrbanPadraoLayout'),
    about: () => import('@/layouts/urban-padrao/SobreClientPage'),
    contact: () => import('@/layouts/urban-padrao/fale-conosco/FaleConoscoClientPage'),
    services: () => import('@/layouts/urban-padrao/servicos/ServicosClientPage'),
    search: () => import('@/layouts/urban-padrao/search/SearchResults'),
    listing: () => import('@/layouts/urban-padrao/search/SearchResults'),
    property: () => import('@/layouts/urban-padrao/imovel/PropertyDetailsPage'),
    map: () => import('@/layouts/urban-padrao/explorar-no-mapa/MapClientPage')
  },
  'domus': {
    home: () => import('@/app/layouts/domus/DomusLayout'),
    about: () => import('@/app/layouts/domus/sobre/DomusSobrePage'),
    contact: () => import('@/app/layouts/domus/fale-conosco/DomusFaleConoscoPage'),
    search: () => import('@/app/layouts/domus/search/DomusSearchPage'),
    listing: () => import('@/app/layouts/domus/search/DomusSearchPage'),
    property: () => import('@/app/layouts/domus/imovel/DomusPropertyDetailsPage'),
    map: () => import('@/app/layouts/domus/explorar-no-mapa/DomusMapClientPage')
  },
  'living': {
    home: () => import('@/layouts/living/LivingLayout')
  },
  'aura': {
    home: () => import('@/layouts/aura/Layout')
  },
  'vertex': {
    home: () => import('@/layouts/vertex/Layout')
  }
};

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  'urban-padrao': {
    id: 'urban-padrao',
    component: null as any,
    isLegacy: true,
    manifest: {
      id: 'urban-padrao',
      name: 'Urban Padrão',
      version: '1.0.0',
      category: 'Classic',
      author: 'Oraora',
      premium: false,
      price: 0,
      featured: true,
      supports: ['hero', 'search', 'featuredProperties', 'about', 'footer'],
      status: 'active'
    },
    config: {
      spacing: 'comfortable',
      animations: true
    },
    pages: {}
  },
  'domus': {
    id: 'domus',
    component: null as any,
    isLegacy: true,
    manifest: {
      id: 'domus',
      name: 'Domus',
      version: '1.0.0',
      category: 'Luxury',
      author: 'Oraora',
      premium: true,
      price: 0,
      featured: true,
      supports: ['hero', 'search', 'featuredProperties', 'about', 'map', 'footer'],
      status: 'active'
    },
    config: {
      spacing: 'loose',
      glass: true
    },
    pages: {}
  },
  'living': {
    id: 'living',
    component: null as any,
    isLegacy: true,
    manifest: {
      id: 'living',
      name: 'Living',
      version: '1.0.0',
      category: 'Modern',
      author: 'Oraora',
      premium: true,
      price: 0,
      featured: false,
      supports: ['hero', 'stats', 'featuredProperties', 'about', 'footer'],
      status: 'active'
    },
    config: {
      spacing: 'comfortable'
    },
    pages: {}
  },
  'aura': {
    id: 'aura',
    component: null as any,
    isLegacy: false,
    manifest: auraManifest,
    config: auraConfig as any,
    pages: {}
  },
  'vertex': {
    id: 'vertex',
    component: null as any,
    isLegacy: false,
    manifest: vertexManifest,
    config: vertexConfig as any,
    pages: {}
  }
};


/**
 * @fileOverview themeRegistry.ts - Dicionário Mestre de Layouts e Páginas
 * 
 * Centraliza o registro de todos os temas e seus componentes internos.
 */

import { ThemeDefinition } from './types';

// --- IMPORTS DE COMPONENTES ---

// Urban Padrão (Base & Fallback)
import UrbanPadraoLayout from '@/layouts/urban-padrao/UrbanPadraoLayout';
import SobreClientPage from '@/layouts/urban-padrao/SobreClientPage';
import FaleConoscoClientPage from '@/layouts/urban-padrao/fale-conosco/FaleConoscoClientPage';
import ServicosClientPage from '@/layouts/urban-padrao/servicos/ServicosClientPage';
import SearchResults from '@/layouts/urban-padrao/search/SearchResults';
import PropertyDetailsPage from '@/layouts/urban-padrao/imovel/PropertyDetailsPage';
import MapClientPage from '@/layouts/urban-padrao/explorar-no-mapa/MapClientPage';

// Domus Luxury
import DomusLayout from '@/app/layouts/domus/DomusLayout';
import DomusSobrePage from '@/app/layouts/domus/sobre/DomusSobrePage';
import DomusFaleConoscoPage from '@/app/layouts/domus/fale-conosco/DomusFaleConoscoPage';
import DomusSearchPage from '@/app/layouts/domus/search/DomusSearchPage';
import DomusPropertyDetailsPage from '@/app/layouts/domus/imovel/DomusPropertyDetailsPage';
import DomusMapClientPage from '@/app/layouts/domus/explorar-no-mapa/DomusMapClientPage';

// Outros Layouts
import LivingLayout from '@/layouts/living/LivingLayout';
import AuraLayout from '@/layouts/aura/Layout';
import VertexLayout from '@/layouts/vertex/Layout';

// Metadados SDK 1.0
import { manifest as auraManifest } from '../aura/manifest';
import { config as auraConfig } from '../aura/config';
import { manifest as vertexManifest } from '../vertex/manifest';
import { config as vertexConfig } from '../vertex/config';

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  'urban-padrao': {
    id: 'urban-padrao',
    component: UrbanPadraoLayout,
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
    pages: {
      home: UrbanPadraoLayout,
      about: SobreClientPage,
      contact: FaleConoscoClientPage,
      services: ServicosClientPage,
      search: SearchResults,
      listing: SearchResults,
      property: PropertyDetailsPage,
      map: MapClientPage
    }
  },
  'domus': {
    id: 'domus',
    component: DomusLayout,
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
    pages: {
      home: DomusLayout,
      about: DomusSobrePage,
      contact: DomusFaleConoscoPage,
      search: DomusSearchPage,
      listing: DomusSearchPage,
      property: DomusPropertyDetailsPage,
      map: DomusMapClientPage
    }
  },
  'living': {
    id: 'living',
    component: LivingLayout,
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
    pages: {
      home: LivingLayout
    }
  },
  'aura': {
    id: 'aura',
    component: AuraLayout,
    isLegacy: false,
    manifest: auraManifest,
    config: auraConfig as any,
    pages: {
      home: AuraLayout
    }
  },
  'vertex': {
    id: 'vertex',
    component: VertexLayout,
    isLegacy: false,
    manifest: vertexManifest,
    config: vertexConfig as any,
    pages: {
      home: VertexLayout
    }
  }
};

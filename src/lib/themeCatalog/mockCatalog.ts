/**
 * @fileOverview mockCatalog.ts - Dados estáticos para a Etapa 04.
 * Estes dados serão movidos para o Firestore na Etapa 05.
 */

import { ThemeCatalog } from './types';

export const MOCK_THEME_CATALOG: Record<string, ThemeCatalog> = {
  'urban-padrao': {
    themeId: 'urban-padrao',
    displayName: 'Urban Padrão',
    description: 'Minimalismo moderno focado em conversão e performance. O layout de entrada preferido pelos corretores da rede.',
    category: 'Essencial',
    status: 'active',
    featured: true,
    premium: false,
    price: 0,
    includedInPlans: ['free', 'basic', 'premium', 'enterprise'],
    tags: ['Rápido', 'Mobile First', 'Clean'],
    thumbnail: 'https://picsum.photos/seed/urban-thumb/400/300',
    banner: 'https://picsum.photos/seed/urban-banner/1200/600',
    previewImages: [],
    displayOrder: 1,
    releaseDate: '2024-01-01',
    lastUpdated: '2024-11-20'
  },
  'domus': {
    themeId: 'domus',
    displayName: 'Domus Luxury',
    description: 'Sofisticação extrema para o mercado de alto luxo. Foco em imagens grandes, tipografia elegante e experiências visuais ricas.',
    category: 'Luxury',
    status: 'active',
    featured: true,
    premium: true,
    price: 197,
    promotionalPrice: 149,
    includedInPlans: ['premium', 'enterprise'],
    tags: ['Luxo', 'Impactante', 'Premium'],
    thumbnail: 'https://picsum.photos/seed/domus-thumb/400/300',
    banner: 'https://picsum.photos/seed/domus-banner/1200/600',
    previewImages: [],
    displayOrder: 2,
    releaseDate: '2024-05-15',
    lastUpdated: '2024-12-01'
  },
  'living': {
    themeId: 'living',
    displayName: 'Living Modern',
    description: 'Design contemporâneo equilibrado. Ideal para corretores que buscam um visual moderno sem abrir mão da simplicidade.',
    category: 'Modern',
    status: 'active',
    featured: false,
    premium: true,
    price: 99,
    includedInPlans: ['basic', 'premium', 'enterprise'],
    tags: ['Contemporâneo', 'Equilibrado'],
    thumbnail: 'https://picsum.photos/seed/living-thumb/400/300',
    banner: 'https://picsum.photos/seed/living-banner/1200/600',
    previewImages: [],
    displayOrder: 3,
    releaseDate: '2024-03-10',
    lastUpdated: '2024-10-15'
  },
  'aura': {
    themeId: 'aura',
    displayName: 'Aura Clean',
    description: 'A nova geração de layouts Oraora. Minimalismo puro utilizando o SDK 1.0 para performance máxima.',
    category: 'Minimalist',
    status: 'beta',
    featured: true,
    premium: true,
    price: 249,
    includedInPlans: ['enterprise'],
    tags: ['SDK 1.0', 'Minimalista', 'Puro'],
    thumbnail: 'https://picsum.photos/seed/aura-thumb/400/300',
    banner: 'https://picsum.photos/seed/aura-banner/1200/600',
    previewImages: [],
    displayOrder: 0,
    releaseDate: '2025-01-20',
    lastUpdated: '2025-01-26'
  },
  'vertex': {
    themeId: 'vertex',
    displayName: 'Vertex Premium',
    description: 'Estética disruptiva inspirada em interfaces de alta performance. O auge do design minimalista para o mercado imobiliário.',
    category: 'Luxury',
    status: 'active',
    featured: true,
    premium: true,
    price: 297,
    promotionalPrice: 247,
    includedInPlans: ['enterprise'],
    tags: ['Premium', 'Exclusivo', 'Lançamento'],
    thumbnail: 'https://picsum.photos/seed/vertex-thumb/400/300',
    banner: 'https://picsum.photos/seed/vertex-banner/1200/600',
    previewImages: [],
    displayOrder: -1, // No topo da lista
    releaseDate: '2025-01-26',
    lastUpdated: '2025-01-26'
  }
};

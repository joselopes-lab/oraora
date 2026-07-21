import { LayoutManifest } from '../sdk.types';

/**
 * @fileOverview Manifesto do Layout Aura
 * Registra o layout na Loja Oraora seguindo o SDK 1.0.
 */

export const manifest: LayoutManifest = {
  id: 'aura',
  name: 'Aura',
  version: '1.0.0',
  category: 'Modern & Clean',
  author: 'Oraora Design Team',
  premium: true,
  price: 0,
  featured: true,
  supports: [
    'hero',
    'search',
    'featuredProperties',
    'about',
    'services',
    'contact',
    'map',
    'cta',
    'footer'
  ],
  status: 'active'
};

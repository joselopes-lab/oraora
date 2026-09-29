import { LayoutManifest } from '../sdk.types';

/**
 * @fileOverview manifest.ts - Manifesto do Layout Studio
 */

export const manifest: LayoutManifest = {
  id: 'studio',
  name: 'Studio',
  version: '1.0.0',
  category: 'Editorial Minimalist',
  author: 'Oraora Design Lab',
  premium: true,
  price: 347,
  featured: true,
  supports: [
    'hero',
    'search',
    'stats',
    'featuredProperties',
    'builders',
    'about',
    'testimonials',
    'cta',
    'footer',
    'whatsapp'
  ],
  status: 'active'
};

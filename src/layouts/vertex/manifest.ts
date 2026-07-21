import { LayoutManifest } from '../sdk.types';

/**
 * @fileOverview manifest.ts - Manifesto do Layout Vertex
 * 
 * Registra as capacidades e metadados comerciais do tema.
 */

export const manifest: LayoutManifest = {
  id: 'vertex',
  name: 'Vertex Premium',
  version: '1.0.0',
  category: 'Luxury Minimalist',
  author: 'Oraora Design Lab',
  premium: true,
  price: 297,
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

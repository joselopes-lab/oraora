/**
 * @fileOverview types.ts - Definições de tipos para o Catálogo Comercial.
 */

import { ThemeDefinition } from '@/layouts/registry/types';

export type ThemeStatus = 'active' | 'beta' | 'deprecated' | 'hidden' | 'archived';

/**
 * Interface que representa a visão comercial de um tema na Loja Oraora.
 */
export interface ThemeCatalog {
  themeId: string;
  displayName: string;
  description: string;
  category: string;
  status: ThemeStatus;
  featured: boolean;
  premium: boolean;
  price: number;
  promotionalPrice?: number;
  includedInPlans: string[]; // ['free', 'basic', 'premium', 'enterprise']
  tags: string[];
  thumbnail: string;
  banner: string;
  previewImages: string[];
  videoUrl?: string;
  displayOrder: number;
  releaseDate: string;
  lastUpdated: string;
}

/**
 * Objeto completo unindo o Layout técnico com os dados de Catálogo.
 */
export interface ThemeFullDefinition {
  id: string;
  technical: ThemeDefinition;
  commercial: ThemeCatalog;
}

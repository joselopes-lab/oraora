/**
 * @fileOverview Definições de tipos para o ORAORA THEME REGISTRY.
 */

import { LayoutProps } from '../sdk.types';

export type PageKey = 
  | 'home' 
  | 'about' 
  | 'contact' 
  | 'services' 
  | 'search' 
  | 'listing' 
  | 'property' 
  | 'map';

export interface LayoutManifest {
  id: string;
  name: string;
  version: string;
  category: string;
  author: string;
  premium: boolean;
  price: number;
  featured: boolean;
  supports: string[];
  status: 'active' | 'beta' | 'deprecated';
  thumbnail?: string;
  preview?: string;
}

export interface LayoutConfig {
  spacing?: 'compact' | 'comfortable' | 'loose';
  typography?: {
    heading: string;
    body: string;
  };
  heroVariant?: string;
  searchVariant?: string;
  cardVariant?: string;
  footerVariant?: string;
  animations?: boolean;
  shadow?: string;
  borderRadius?: string;
  glass?: boolean;
}

export interface ThemeDefinition {
  id: string;
  component: React.ComponentType<any>; // Mantido para compatibilidade (Homepage)
  manifest: LayoutManifest;
  config: LayoutConfig;
  isLegacy?: boolean;
  pages: Partial<Record<PageKey, React.ComponentType<any>>>;
}

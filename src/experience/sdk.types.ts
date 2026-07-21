/**
 * @fileOverview ORAORA EXPERIENCE SDK 1.0 - Definições de Tipos Oficiais
 * 
 * Define o contrato obrigatório para todos os blocos reutilizáveis da plataforma.
 */

import { BrokerSDK, PropertySDK, ThemeSDK } from '@/layouts/sdk.types';

export type BlockCategory = 
  | 'hero' 
  | 'search' 
  | 'cta' 
  | 'display' 
  | 'navigation' 
  | 'content' 
  | 'utility';

/**
 * Propriedades universais enviadas para qualquer bloco.
 */
export interface BlockProps {
  broker: BrokerSDK;
  properties?: PropertySDK[];
  content?: any;
  theme?: ThemeSDK;
  settings?: any;
  custom?: any; // Propriedades específicas da instância do bloco
}

/**
 * Metadados comerciais e técnicos do bloco.
 */
export interface BlockManifest {
  id: string;
  name: string;
  version: string;
  category: BlockCategory;
  author: string;
  previewImageUrl?: string;
}

/**
 * Definição completa de um bloco no Registry.
 */
export interface BlockDefinition {
  manifest: BlockManifest;
  component: React.ComponentType<BlockProps>;
  defaultConfig?: any;
}

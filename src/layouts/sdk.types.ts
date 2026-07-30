/**
 * @fileOverview ORAORA THEME SDK 1.0 - Definições de Tipos Oficiais
 * 
 * Este arquivo define as interfaces obrigatórias que todo layout do Oraora
 * deve implementar para garantir compatibilidade com a Loja e o Host Controller.
 */

export interface BrokerSDK {
  id: string;
  brandName: string;
  slug: string;
  logoUrl?: string;
  footerLogoUrl?: string;
  faviconUrl?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export interface PropertySDK {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
    address?: string;
  };
  midia: string[];
  media?: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
}

export interface ThemeSDK {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
}

export interface LayoutProps {
  broker: BrokerSDK;
  properties: PropertySDK[];
  content: any; // Conteúdo gerado pela IA (broker.homepage)
  theme: ThemeSDK;
  seo: {
    title?: string;
    slogan?: string;
    description?: string;
  };
  settings: {
    enabledTransactions: string[];
  };
  version: string;
}

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
}

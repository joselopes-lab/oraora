/**
 * @fileOverview Definições de tipos para o Oraora Editorial Engine.
 */

export type ContentType = 
  | 'cidade' 
  | 'bairro' 
  | 'construtora' 
  | 'empreendimento' 
  | 'condominio' 
  | 'corretor' 
  | 'artigo' 
  | 'landing-page' 
  | 'faq' 
  | 'institucional';

export interface ContentTemplate {
  title: string;
  sections: number;
  wordCount: { min: number; max: number };
  structure: {
    h1: string;
    h2: string[];
    h3?: string[];
    cta: string;
    conclusion: boolean;
  };
}

export interface EditorialRules {
  tone: string[];
  mandatory: string[];
  seo: {
    keywordDensity: string;
    headingStructure: string;
    internalLinking: string;
  };
  aiProtocol: string[];
}

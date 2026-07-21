
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

/**
 * @fileOverview Configuração central do Genkit v1.x para o BrokerSphere.
 * 
 * Este arquivo define o objeto global 'ai' usado em toda a aplicação
 * e centraliza os esquemas de dados usados pelos fluxos de IA.
 */

export const ai = genkit({
  plugins: [
    // Forçamos o uso da chave vinda do ambiente para evitar cache de chaves antigas
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// --- CITY CONTENT SCHEMAS ---

export const CityContentOutputSchema = z.object({
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  sections: z.object({
    resumo_institucional: z.string(),
    historia_resumida: z.string(),
    perfil_cidade: z.string(),
    mercado_imobiliario: z.string(),
    perfil_economico: z.string(),
    infraestrutura_mobilidade: z.string(),
    turismo_lazer: z.string(),
    conclusao_cta: z.string(),
    faq: z.array(z.object({
      pergunta: z.string(),
      resposta: z.string()
    }))
  }),
  scores: z.object({
    seo: z.number().min(0).max(100),
    quality: z.number().min(0).max(100)
  })
});

export type CityContentOutput = z.infer<typeof CityContentOutputSchema>;

// --- MARKET REPORT ANALYSIS SCHEMAS ---

export const AnalyzeMarketReportInputSchema = z.object({
  photoDataUri: z.string().describe("A base64 data URI of the market report image (FipeZAP style)."),
  monthYear: z.string().describe("The month and year for this report (e.g. 'Março 2026')."),
});

export const AnalyzeMarketReportOutputSchema = z.object({
  avgPricePerM2: z.number().describe("O preço médio em R$/m2 encontrado no relatório."),
  monthlyVariation: z.number().describe("A variação percentual no mês (ex: 0.58)."),
  yearlyVariation: z.number().describe("A variação acumulada em 12 meses (ex: 8.90)."),
  numHouseholds: z.number().optional().describe("Número total de domicílios (converter 'mil' para número real, ex: 296 mil = 296000)."),
  numApartments: z.number().optional().describe("Quantidade total de apartamentos (converter 'mil' para número real)."),
  residentPopulation: z.number().optional().describe("População residente total (converter 'mil' para número real)."),
  avgHouseholdIncome: z.number().optional().describe("Renda média domiciliar encontrada no relatório."),
  topNeighborhoods: z.array(z.object({
    name: z.string(),
    price: z.number(),
    variation: z.number()
  })).describe("Lista dos bairros mais representativos com seus respectivos preços m2 e variações."),
  salesInsights: z.string().describe("Insights detalhados para o corretor usar na venda, formatados em Markdown. Use obrigatoriamente blocos de citação (>) para cada pitch de vendas."),
});

// --- SITE CONTENT GENERATION SCHEMAS ---

export const OnboardingDataSchema = z.object({
  name: z.string(),
  yearsExperience: z.string().optional(),
  locations: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  audiences: z.array(z.string()).optional(),
  differential: z.string().optional(),
  valueProposition: z.string().optional(),
  services: z.array(z.string()).optional(),
  process: z.string().optional(),
  postSales: z.string().optional(),
  salesVolume: z.string().optional(),
  certifications: z.string().optional(),
  testimonials: z.string().optional(),
  marketPosition: z.string().optional(),
  professionalStrength: z.string().optional(),
  creci: z.string().optional(),
});

export const GenerateSiteContentOutputSchema = z.object({
  homepage: z.object({
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    heroTagline: z.string(),
    statsSold: z.string(),
    statsExperience: z.string(),
    statsSatisfaction: z.string(),
    statsSupport: z.string(),
    featuredTitle: z.string(),
    featuredSubtitle: z.string(),
    aboutTitle: z.string(),
    aboutText: z.string(),
  }),
  urbanPadraoSobre: z.object({
    brokerName: z.string(),
    brokerTitle: z.string(),
    bio: z.string(),
    statManagedDeals: z.string(),
    statAssistedFamilies: z.string(),
    statYearsExperience: z.string(),
    value1Title: z.string(),
    value2Title: z.string(),
    value3Title: z.string(),
    value1Description: z.string(),
    value2Description: z.string(),
    value3Description: z.string(),
  }),
  urbanPadraoServicos: z.object({
    headerTitle: z.string(),
    headerSubtitle: z.string(),
    servicesTitle: z.string(),
    servicesSubtitle: z.string(),
    serviceItems: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })),
    processTitle: z.string(),
    processSubtitle: z.string(),
    processSteps: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
  }),
  oraoraContato: z.object({
    headerTitle: z.string(),
    headerSubtitle: z.string(),
    headerTagline: z.string(),
  }),
});

// --- PROPERTY RECOMMENDATION SCHEMAS ---

export const PropertyRecommendationsInputSchema = z.object({
  clientPreferences: z.string().describe("As preferências e necessidades do cliente para busca de imóveis."),
});

export const PropertyRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.object({
    address: z.string(),
    price: z.string(),
    reason: z.string(),
  })),
});

export type PropertyRecommendationsInput = z.infer<typeof PropertyRecommendationsInputSchema>;
export type PropertyRecommendationsOutput = z.infer<typeof PropertyRecommendationsOutputSchema>;

// --- SEO GENERATION SCHEMAS ---

export const GenerateSeoInputSchema = z.object({
  nome: z.string(),
  descricao: z.string().optional(),
  tipo: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string(),
});

export const GenerateSeoOutputSchema = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.string(),
});

export type GenerateSeoInput = z.infer<typeof GenerateSeoInputSchema>;
export type GenerateSeoOutput = z.infer<typeof GenerateSeoOutputSchema>;

// --- PROPERTY INVESTMENT ANALYSIS SCHEMAS ---

export const PropertyInvestmentAnalysisInputSchema = z.object({
  propertyName: z.string(),
  propertyPricePerM2: z.number(),
  neighborhoodName: z.string(),
  neighborhoodAvgPricePerM2: z.number(),
  neighborhoodYearlyVariation: z.number(),
});

export const PropertyInvestmentAnalysisOutputSchema = z.object({
  criticalAnalysis: z.object({
    isAnomaly: z.boolean(),
    analysisText: z.string(),
  }),
  trend: z.object({
    neighborhoodName: z.string(),
    variation12Months: z.number(),
    description: z.string(),
  }),
  projections: z.object({
    sixMonths: z.number(),
    oneYear: z.number(),
    twoYears: z.number(),
    descriptions: z.object({
      sixMonths: z.string(),
      oneYear: z.string(),
      twoYears: z.string(),
    })
  }),
  benchmark: z.object({
    propertyReturn: z.number(),
    cdi: z.number(),
    ibovespa: z.number(),
    yield: z.number(),
    appreciation: z.number(),
  }),
  verdict: z.object({
    status: z.string(),
    protection: z.string(),
    gainPotential: z.string(),
    actionNeeded: z.string(),
  }),
  fullMarkdown: z.string().describe("A análise imobiliária completa formatada em Markdown."),
});

export type PropertyInvestmentAnalysisInput = z.infer<typeof PropertyInvestmentAnalysisInputSchema>;
export type PropertyInvestmentAnalysisOutput = z.infer<typeof PropertyInvestmentAnalysisOutputSchema>;

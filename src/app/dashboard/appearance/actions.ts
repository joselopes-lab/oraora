
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { generateSeo, GenerateSeoOutput } from '@/ai/flows/generate-seo-flow';

export interface CategoryImages {
  Apartamento?: string;
  'Casa em Condomínio'?: string;
  Casa?: string;
  Terreno?: string;
  'Sala Comercial'?: string;
  Flat?: string;
  Loja?: string;
}

export interface AppearanceSettings {
  logoUrl: string;
  faviconUrl?: string;
  heroTitle: string;
  searchFormTitle: string;
  heroBackgroundImage: string;
  footerAboutText?: string;
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  brokerCallDesktopImage?: string;
  brokerCallMobileImage?: string;
  brokerCallLink?: string;
  brokerCallLinkTargetBlank?: boolean;
  categoryImages?: CategoryImages;
}

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  const defaults: AppearanceSettings = {
    logoUrl: '',
    faviconUrl: '',
    heroTitle: 'Encontre seu imóvel dos sonhos para você.',
    searchFormTitle: 'Vamos investigar',
    heroBackgroundImage: 'https://placehold.co/1200x600.png',
    footerAboutText: 'A Oraora nasceu para transformar a forma como imóveis são encontrados, apresentados e vendidos. Unimos tecnologia inteligente, design funcional e dados reais para conectar compradores, corretores e construtoras em uma experiência única e sem ruídos.',
    newsletterTitle: 'Receba novidades',
    newsletterSubtitle: 'Fique por dentro dos melhores lançamentos e oportunidades do mercado imobiliário.',
    socialFacebook: '#',
    socialInstagram: 'https://www.instagram.com/oraorabr',
    socialTwitter: '#',
    socialYoutube: '#',
    seoTitle: 'Oraora | Encontre Lançamentos e Imóveis Prontos',
    seoDescription: 'A Oraora é o seu hub de imóveis. Encontre, compare e decida entre os melhores lançamentos e imóveis prontos nas principais cidades do Brasil.',
    seoKeywords: 'imóveis, comprar apartamento, lançamentos, imóveis prontos, imobiliária',
    brokerCallDesktopImage: '',
    brokerCallMobileImage: '',
    brokerCallLink: '',
    brokerCallLinkTargetBlank: false,
    categoryImages: {},
  };
  
  try {
    const settingsRef = doc(db, 'settings', 'homepage');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      return { ...defaults, ...docSnap.data() } as AppearanceSettings;
    }
    
    return defaults;
  } catch (error) {
    console.error("Error fetching appearance settings:", error);
    return defaults;
  }
}

export async function revalidateHomepage() {
    revalidatePath('/');
}

export async function handleGenerateSeo(): Promise<{ success: boolean, data?: GenerateSeoOutput, error?: string }> {
  try {
    const result = await generateSeo({ siteName: 'Oraora', focus: 'lançamentos e imóveis prontos' });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

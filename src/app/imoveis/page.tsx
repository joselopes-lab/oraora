import PublicLayout from '@/components/public-layout';
import { getAppearanceSettings } from '../dashboard/appearance/actions';
import { Metadata } from 'next';
import ImoveisClientPage from './imoveis-client-page';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getAppearanceSettings();
    return {
      title: `Busca de Imóveis | ${settings.seoTitle || 'Oraora'}`,
      description: settings.seoDescription || 'Filtre e encontre os melhores lançamentos e imóveis prontos nas principais cidades do Brasil.',
      keywords: settings.seoKeywords,
    };
  } catch (error) {
    console.error("Failed to fetch SEO metadata for search page:", error);
    return {
      title: 'Busca de Imóveis | Oraora',
      description: 'Filtre e encontre os melhores lançamentos e imóveis prontos nas principais cidades do Brasil.',
    }
  }
}

export default function ImoveisPage() {
    return (
      <PublicLayout>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ImoveisClientPage />
        </Suspense>
      </PublicLayout>
    )
}

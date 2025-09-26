import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { getAppearanceSettings } from './dashboard/appearance/actions';
import Script from 'next/script';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getAppearanceSettings();

    return {
      title: settings.seoTitle || 'Oraora | Hub de Imóveis',
      description: settings.seoDescription || 'Encontre, compare e decida entre os melhores lançamentos e imóveis prontos nas principais cidades do Brasil.',
      keywords: settings.seoKeywords || 'imóveis, comprar apartamento, lançamentos, imobiliária',
      icons: {
        icon: settings.faviconUrl || '/favicon.ico', // Default fallback
      },
    };
  } catch (error) {
    console.error("Failed to fetch SEO metadata:", error);
    return {
      title: 'Oraora | Hub de Imóveis',
      description: 'Encontre, compare e decida entre os melhores lançamentos e imóveis prontos nas principais cidades do Brasil.',
    }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-NKK4615JX3"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-NKK4615JX3');
          `}
        </Script>
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background pb-16 md:pb-0')}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

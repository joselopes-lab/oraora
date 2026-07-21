
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider, AuthProvider } from '@/firebase';
import { adminDb } from '@/firebase/index.server';
import { ActivityTracker } from '@/components/ActivityTracker';
import { Suspense } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { generateOrganizationJsonLd } from '@/lib/seo';

type BrokerData = {
  faviconUrl?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
};

async function getSiteData(): Promise<BrokerData | null> {
  try {
    const siteDoc = await adminDb.collection('brokers').doc('oraora-main-site').get();
    if (siteDoc.exists) return siteDoc.data() as BrokerData;
    return null;
  } catch (error) {
    console.error("Error fetching site data in layout:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();
  return {
    title: {
      default: 'Oraora | Inteligência Imobiliária',
      template: '%s | Oraora'
    },
    description: 'A plataforma definitiva para encontrar, anunciar e gerenciar imóveis de alto padrão com auxílio de inteligência artificial.',
    icons: {
      icon: siteData?.faviconUrl || '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: 'https://oraora.com.br',
      siteName: 'Oraora',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Oraora | Inteligência Imobiliária',
      description: 'Encontre seu lugar no mundo com a plataforma mais moderna do mercado.',
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteData = await getSiteData();
  const gaId = siteData?.googleAnalyticsId;
  const fbPixelId = siteData?.facebookPixelId;

  return (
    <html lang="pt-BR" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        {gaId && (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        <JsonLd data={generateOrganizationJsonLd()} />
        <FirebaseClientProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <ActivityTracker />
            </Suspense>
            {children}
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

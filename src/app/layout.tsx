
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/firebase/auth-provider';
import { initializeFirebase } from '@/firebase/index.server';
import { doc, getDoc } from 'firebase/firestore';


type BrokerData = {
  faviconUrl?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
};

async function getSiteData(): Promise<BrokerData | null> {
  try {
    const { firestore } = initializeFirebase();
    const siteContentDocRef = doc(firestore, 'brokers', 'oraora-main-site');
    const siteDoc = await getDoc(siteContentDocRef);
    
    if (siteDoc.exists()) {
      return siteDoc.data() as BrokerData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching site data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();

  return {
    title: 'Oraora',
    description: 'Área restrita para corretores',
    icons: {
      icon: siteData?.faviconUrl || '/favicon.ico',
    },
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        
        {/* Google Analytics Script */}
        {gaId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        
        {/* Facebook Pixel Script */}
        {fbPixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        {fbPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

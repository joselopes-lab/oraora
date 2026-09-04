'use client';

import { useEffect } from 'react';
import { CONSENT_COOKIE_NAME, ConsentState } from '@/lib/privacy/types';

export function BrokerTrackingLoader({ 
    gaId, 
    gtmId, 
    pixelId 
}: { 
    gaId?: string, 
    gtmId?: string, 
    pixelId?: string 
}) {
  useEffect(() => {
    const injectScripts = () => {
      try {
        const cookies = document.cookie.split(';');
        const consentCookie = cookies.find(c => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));
        if (!consentCookie) return;

        const parsed: ConsentState = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
        if (parsed?.preferences?.analytics !== true) return;

        // GA4
        if (gaId && !document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
          window.dataLayer = window.dataLayer || [];
          function gtag(...args: any[]) { window.dataLayer.push(args); }
          (window as any).gtag = (window as any).gtag || gtag;
          
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script);

          const inlineScript = document.createElement('script');
          inlineScript.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`;
          document.head.appendChild(inlineScript);
        }

        // GTM
        if (gtmId && !document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)) {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
          const f = document.getElementsByTagName('script')[0];
          const j = document.createElement('script');
          j.async = true;
          j.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
          f.parentNode?.insertBefore(j, f);
        }

        // Meta Pixel
        if (pixelId && !(window as any).fbq) {
          !function(f,b,e,v,n,t,s) {
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
          }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          (window as any).fbq('init', pixelId);
          (window as any).fbq('track', 'PageView');
        }
      } catch (e) {
        console.error('Error loading tracking client-side:', e);
      }
    };

    injectScripts();
    window.addEventListener('oraora_consent_updated', injectScripts as EventListener);
    return () => {
      window.removeEventListener('oraora_consent_updated', injectScripts as EventListener);
    };
  }, [gaId, gtmId, pixelId]);

  return null;
}

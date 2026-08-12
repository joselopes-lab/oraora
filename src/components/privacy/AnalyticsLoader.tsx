'use client';

import { useEffect } from 'react';
import { CONSENT_COOKIE_NAME, ConsentState } from '@/lib/privacy/types';

export function AnalyticsLoader({ gaId }: { gaId?: string }) {
  useEffect(() => {
    if (!gaId) return;

    const checkAndInject = () => {
      try {
        const cookies = document.cookie.split(';');
        const consentCookie = cookies.find(c => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));
        if (!consentCookie) return;

        const parsed: ConsentState = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
        if (parsed?.preferences?.analytics === true) {
          if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
            window.dataLayer = window.dataLayer || [];
            function gtag(...args: any[]) {
              window.dataLayer.push(args);
            }
            (window as any).gtag = (window as any).gtag || gtag;

            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            inlineScript.id = 'google-analytics-client';
            inlineScript.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`;
            document.head.appendChild(inlineScript);
          }
        }
      } catch (e) {
        console.error('Error loading analytics client-side:', e);
      }
    };

    checkAndInject();

    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ConsentState>;
      if (customEvent.detail?.preferences?.analytics === true) {
        checkAndInject();
      } else {
        if (window && (window as any).gtag && gaId) {
          (window as any).gtag('consent', 'update', {
            analytics_storage: 'denied'
          });
        }
      }
    };

    window.addEventListener('oraora_consent_updated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('oraora_consent_updated', handleConsentUpdate as EventListener);
    };
  }, [gaId]);

  return null;
}

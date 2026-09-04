'use client';

import { CONSENT_COOKIE_NAME, ConsentState } from '@/lib/privacy/types';

export function trackEvent(eventName: string, eventData: Record<string, any>) {
  // Respect Consent
  const cookies = document.cookie.split(';');
  const consentCookie = cookies.find(c => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!consentCookie) return;

  try {
    const parsed: ConsentState = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
    if (parsed?.preferences?.analytics !== true) return;

    // Push to DataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventData,
      timestamp: new Date().getTime(),
    });
  } catch (e) {
    console.error('Error tracking event:', e);
  }
}

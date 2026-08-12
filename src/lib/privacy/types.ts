export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState {
  consentId: string;
  tenantId: string;
  domain: string;
  version: string;
  preferences: ConsentPreferences;
  timestamp: string;
  revokedAt: string | null;
}

export const CONSENT_COOKIE_NAME = 'oraora_consent_v1';
export const CURRENT_CONSENT_VERSION = '1.0';

export function getDefaultConsent(): ConsentPreferences {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
  };
}

export function generateConsentId(): string {
  return 'c_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

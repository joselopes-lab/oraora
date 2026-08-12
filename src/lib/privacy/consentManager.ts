import { ConsentState, ConsentPreferences, CONSENT_COOKIE_NAME, CURRENT_CONSENT_VERSION, getDefaultConsent, generateConsentId } from './types';
import { sendConsentAuditLog, ConsentEventType } from './auditService';

export class ConsentManager {
  static getConsent(tenantId: string = 'oraora-global'): ConsentState | null {
    if (typeof window === 'undefined') return null;

    try {
      const cookies = document.cookie.split(';');
      const consentCookie = cookies.find(c => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));
      
      if (!consentCookie) return null;

      const cookieValue = decodeURIComponent(consentCookie.split('=')[1]);
      const parsed: ConsentState = JSON.parse(cookieValue);

      if (!parsed || !parsed.preferences) return null;

      return parsed;
    } catch (e) {
      console.error('Erro ao ler consentimento:', e);
      return null;
    }
  }

  static saveConsent(preferences: ConsentPreferences, tenantId: string = 'oraora-global', domain: string = 'oraora.com.br'): ConsentState {
    const existing = typeof window !== 'undefined' ? this.getConsent(tenantId) : null;
    
    const newAnalytics = Boolean(preferences.analytics);
    const newMarketing = Boolean(preferences.marketing);

    // Determine event type based on state transition
    let eventType: ConsentEventType = 'CONSENT_UPDATED';
    if (!existing) {
      if (newAnalytics || newMarketing) {
        eventType = 'CONSENT_GRANTED';
      } else {
        eventType = 'CONSENT_DENIED';
      }
    } else {
      const oldAnalytics = existing.preferences.analytics;
      const oldMarketing = existing.preferences.marketing;

      // Check if user revoked something previously granted
      if ((oldAnalytics && !newAnalytics) || (oldMarketing && !newMarketing)) {
        eventType = 'CONSENT_REVOKED';
      } else if (!oldAnalytics && !oldMarketing && (newAnalytics || newMarketing)) {
        eventType = 'CONSENT_GRANTED';
      } else if (oldAnalytics === newAnalytics && oldMarketing === newMarketing) {
        // No change in preferences, do not trigger audit log unnecessarily
        return existing;
      }
    }

    const state: ConsentState = {
      consentId: existing?.consentId || generateConsentId(),
      tenantId,
      domain,
      version: CURRENT_CONSENT_VERSION,
      preferences: {
        necessary: true,
        analytics: newAnalytics,
        marketing: newMarketing
      },
      timestamp: new Date().toISOString(),
      revokedAt: null
    };

    if (typeof window !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 180); // 180 dias
      
      const cookieVal = encodeURIComponent(JSON.stringify(state));
      document.cookie = `${CONSENT_COOKIE_NAME}=${cookieVal}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;

      // Evento customizado para notificar componentes na mesma aba
      window.dispatchEvent(new CustomEvent('oraora_consent_updated', { detail: state }));

      // Send audit log asynchronously (non-blocking)
      sendConsentAuditLog({
        consentId: state.consentId,
        tenantId: state.tenantId,
        domain: state.domain,
        eventType,
        version: state.version,
        preferences: state.preferences,
        timestamp: state.timestamp,
        source: 'web'
      });
    }

    return state;
  }

  static revokeAll(tenantId: string = 'oraora-global', domain: string = 'oraora.com.br'): ConsentState {
    return this.saveConsent({
      necessary: true,
      analytics: false,
      marketing: false
    }, tenantId, domain);
  }

  static acceptAll(tenantId: string = 'oraora-global', domain: string = 'oraora.com.br'): ConsentState {
    return this.saveConsent({
      necessary: true,
      analytics: true,
      marketing: true
    }, tenantId, domain);
  }

  static hasUserResponded(tenantId: string = 'oraora-global'): boolean {
    return this.getConsent(tenantId) !== null;
  }
}


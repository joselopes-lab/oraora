export type ConsentEventType = 'CONSENT_GRANTED' | 'CONSENT_DENIED' | 'CONSENT_UPDATED' | 'CONSENT_REVOKED';

export interface ConsentAuditLogPayload {
  consentId: string;
  tenantId: string;
  domain: string;
  eventType: ConsentEventType;
  version: string;
  preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  timestamp: string;
  source: string;
}

export async function sendConsentAuditLog(payload: ConsentAuditLogPayload): Promise<void> {
  try {
    // Non-blocking asynchronous transmission to backend/server action or API route
    if (typeof window === 'undefined') return;

    fetch('/api/privacy/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      // Fail silently to never block or disrupt user experience
      console.warn('Audit log transmission failed silently:', err);
    });
  } catch (e) {
    // Fail silently
  }
}

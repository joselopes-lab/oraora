import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/index.server'; // Optional or graceful fallback if admin not fully configured in some environments

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consentId, tenantId, domain, eventType, version, preferences, timestamp, source } = body;

    if (!consentId || !tenantId || !eventType) {
      return NextResponse.json({ error: 'Missing required audit fields' }, { status: 400 });
    }

    const auditLog = {
      consentId,
      tenantId: tenantId || 'oraora-global',
      domain: domain || 'oraora.com.br',
      eventType,
      version: version || '1.0',
      preferences: {
        necessary: Boolean(preferences?.necessary),
        analytics: Boolean(preferences?.analytics),
        marketing: Boolean(preferences?.marketing),
      },
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'web',
      createdAt: new Date().toISOString(),
    };

    // Attempt persistence in Firestore collection 'consentAuditLogs' if admin db is available
    try {
      if (adminDb) {
        await adminDb.collection('consentAuditLogs').add(auditLog);
      }
    } catch (firestoreErr) {
      // Graceful fallback: log to console server-side if Firestore write fails, without failing HTTP response
      console.warn('Server-side Firestore audit log write skipped or failed:', firestoreErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Return success to never disrupt client flow even if audit log fails server-side
    return NextResponse.json({ success: true });
  }
}

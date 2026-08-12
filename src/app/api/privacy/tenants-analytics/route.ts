import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/index.server';

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ tenants: [] }, { status: 200 });
    }
    const snapshot = await adminDb.collection('tenantsAnalyticsConfig').get();
    const tenants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json({ tenants }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tenants analytics config:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, domain, googleAnalyticsId, enabled } = body;

    if (!tenantId || !domain) {
      return NextResponse.json({ error: 'Tenant ID and Domain are required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const docRef = adminDb.collection('tenantsAnalyticsConfig').doc(tenantId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return NextResponse.json({ error: 'Tenant already configured' }, { status: 400 });
    }

    const newConfig = {
      tenantId,
      domain,
      googleAnalyticsId: googleAnalyticsId || '',
      enabled: enabled !== undefined ? enabled : true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    await docRef.set(newConfig);

    return NextResponse.json({ success: true, tenant: newConfig }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving tenant analytics config:', error);
    return NextResponse.json({ error: 'Failed to save tenant config' }, { status: 500 });
  }
}

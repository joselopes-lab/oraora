import { NextResponse, NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/index.server';

export async function GET(req: NextRequest) {
  // 1. Validate Secret
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.MIGRATION_ADMIN_SECRET || secret !== process.env.MIGRATION_ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized (Invalid Secret)' }, { status: 401 });
  }

  // 2. Validate User Authentication and Admin Role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized (No Token)' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check for custom admin claim
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: 'Unauthorized (Not Admin)' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized (Invalid Token)' }, { status: 401 });
  }

  // 3. Migration Logic
  try {
    const leadsSnapshot = await adminDb.collection('leads').get();
    let updatedCount = 0;

    for (const leadDoc of leadsSnapshot.docs) {
      const responsesSnapshot = await leadDoc.ref.collection('networkResponses').count().get();
      const count = responsesSnapshot.data().count;

      await leadDoc.ref.update({ 'network.totalResponses': count });
      updatedCount++;
    }

    return NextResponse.json({ message: `Migration complete. Updated ${updatedCount} leads.` });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

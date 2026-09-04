import { adminDb } from '@/firebase/index.server';
import { generateCanalProXml } from '@/lib/feeds/canalpro-xml-generator';
import { isPropertyLinkedToProject } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(req: NextRequest, { params }: { params: { brokerId: string } }) {
  const { brokerId } = params;
  const token = req.nextUrl.searchParams.get('token');

  // 1. Security Check
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userSnap = await adminDb.collection('users').doc(brokerId).get();
  const userData = userSnap.data();

  if (!userData || userData.canalProToken !== token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Fetch Properties
  const [propSnap, brokerPropSnap] = await Promise.all([
    adminDb.collection('properties').where('brokerId', '==', brokerId).where('publishToCanalPro', '==', true).where('isActive', '==', true).get(),
    adminDb.collection('brokerProperties').where('brokerId', '==', brokerId).where('publishToCanalPro', '==', true).where('isActive', '==', true).get()
  ]);

  const propertiesMap = new Map();
  propSnap.docs.forEach(doc => propertiesMap.set(doc.id, { id: doc.id, ...doc.data() }));
  brokerPropSnap.docs.forEach(doc => {
    if (!propertiesMap.has(doc.id)) {
      propertiesMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  // 3. Filter and Deduplicate (include defense-in-depth for construtora properties)
  const properties = Array.from(propertiesMap.values()).filter(prop => !isPropertyLinkedToProject(prop));

  // 4. Generate XML
  const xml = generateCanalProXml(properties);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

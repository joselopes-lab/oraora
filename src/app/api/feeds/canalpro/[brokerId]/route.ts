import { adminDb } from '@/firebase/index.server';
import { generateCanalProXml } from '@/lib/feeds/canalpro-xml-generator';
import { isPropertyLinkedToProject } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ brokerId: string }> | { brokerId: string } }) {
  const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
  const { brokerId } = resolvedParams;
  const token = req.nextUrl.searchParams.get('token');

  console.log(`[CanalPro Feed] brokerId recebido: ${brokerId}`);

  // 1. Security Check
  if (!token) {
    console.log(`[CanalPro Feed] Token validado: false (token ausente)`);
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userSnap = await adminDb.collection('users').doc(brokerId).get();
  const userData = userSnap.data();

  const tokenValidated = Boolean(userData && userData.canalProToken === token);
  console.log(`[CanalPro Feed] Token validado: ${tokenValidated}`);

  if (!tokenValidated) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Fetch all brokerProperties for this broker (initial query)
  const brokerPropSnap = await adminDb.collection('brokerProperties')
    .where('brokerId', '==', brokerId)
    .get();

  const initialDocs = brokerPropSnap.docs;
  const initialCount = initialDocs.length;
  console.log(`[CanalPro Feed] Quantidade encontrada na consulta inicial: ${initialCount}`);

  // 3. Count with publishToCanalPro === true
  const publishedDocs = initialDocs.filter(doc => {
    const data = doc.data();
    return data.publishToCanalPro === true;
  });
  const publishedCount = publishedDocs.length;
  console.log(`[CanalPro Feed] Quantidade com publishToCanalPro === true: ${publishedCount}`);

  // 4. Count after status filters (not inactive or archived)
  const statusFilteredDocs = publishedDocs.filter(doc => {
    const data = doc.data();
    const isActive = data.isActive !== false && data.status !== 'inactive' && data.status !== 'arquivado';
    return isActive;
  });
  const statusCount = statusFilteredDocs.length;
  console.log(`[CanalPro Feed] Quantidade após filtros de status: ${statusCount}`);

  // 5. Count after anti-construtora validation (!isPropertyLinkedToProject)
  const validProperties: any[] = [];
  statusFilteredDocs.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    if (isPropertyLinkedToProject(data)) {
      console.log(`[CanalPro Feed] Imóvel rejeitado: vinculado a projeto/construtora`);
      return;
    }
    validProperties.push({ id, ...data });
  });
  const antiConstrutoraCount = validProperties.length;
  console.log(`[CanalPro Feed] Quantidade após validação anti-construtora: ${antiConstrutoraCount}`);

  // 6. Final count sent to XML
  const finalCount = validProperties.length;
  console.log(`[CanalPro Feed] Quantidade final enviada ao XML: ${finalCount}`);

  // 7. Generate XML
  const xml = generateCanalProXml(validProperties);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

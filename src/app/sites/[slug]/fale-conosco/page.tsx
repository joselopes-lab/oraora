import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import { getBrokerData } from '../../utils.server';
import { FieldValue } from 'firebase-admin/firestore';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

export default async function BrokerContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  // Incrementa contador de acessos
  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao rastrear acesso:", e);
  }

  const layoutId = (broker as any).layoutId;

  // --- ORAORA PAGE LOADER 1.0 ---
  const ContactPage = getThemePage(layoutId, 'contact');

  return <ContactPage broker={broker as any} />;
}

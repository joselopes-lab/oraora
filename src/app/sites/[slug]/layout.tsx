
import type { Metadata } from 'next';
import { getBrokerData } from '../utils.server';
import { BrokerTrackingLoader } from '@/components/privacy/BrokerTrackingLoader';
import CampaignCaptureInitializer from '@/components/CampaignCaptureInitializer';
import BrokerAiChatWidget from '../components/BrokerAiChatWidget';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

/**
 * @fileOverview Layout principal para os sites dos corretores (Tenancy).
 * Gerencia o Favicon dinâmico e o título padrão do site baseado nas configurações do corretor.
 * Injeta o carregador de scripts de tracking e o hook de captura de campanhas.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const broker = await getBrokerData(slug) as any;

  if (!broker) {
    return {
      title: 'Oraora',
    };
  }

  // Prioriza o siteTitle configurado pelo corretor, senão usa o nome da marca
  const title = broker.siteTitle || broker.brandName || 'Oraora';
  const favicon = broker.faviconUrl || '/favicon.ico';

  return {
    title: {
      default: title,
      template: `%s | ${broker.brandName || 'Oraora'}`,
    },
    icons: {
      icon: [
        { url: favicon },
        { url: favicon, sizes: '32x32', type: 'image/png' },
        { url: favicon, sizes: '16x16', type: 'image/png' },
      ],
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default async function BrokerLayout({ params, children }: { params: Promise<{ slug: string }>, children: React.ReactNode }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug) as any;

  // Normalização do WhatsApp/Telefone para o widget
  const rawPhone = broker?.whatsapp || broker?.phone || broker?.telefone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  return (
    <>
      <CampaignCaptureInitializer />
      <BrokerTrackingLoader 
        gaId={broker?.googleAnalyticsId} 
        gtmId={broker?.gtmId} 
        pixelId={broker?.metaPixelId} 
      />
      {children}
      <BrokerAiChatWidget 
        slug={slug} 
        brokerName={broker?.brandName} 
        brokerPhone={cleanPhone} 
        oralinkAiEnabled={broker?.oralink?.oralinkAiAssistantEnabled ?? false}
      />
    </>
  );
}

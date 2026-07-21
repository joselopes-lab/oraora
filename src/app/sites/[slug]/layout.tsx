
import type { Metadata } from 'next';
import { getBrokerData } from '../utils.server';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

/**
 * @fileOverview Layout principal para os sites dos corretores (Tenancy).
 * Gerencia o Favicon dinâmico e o título padrão do site baseado nas configurações do corretor.
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

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

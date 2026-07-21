import ImoveisClientPage from './ImoveisClientPage';
import type { Metadata } from 'next';

/**
 * @fileOverview Server Component para a rota /imoveis.
 * Centraliza metadados e configuração de página no servidor para conformidade com Next.js 15.
 */

export const metadata: Metadata = {
  title: 'Imóveis | Oraora',
  description: 'Explore nosso catálogo completo de apartamentos, casas e coberturas. Encontre o imóvel ideal para morar ou investir.',
};

export default function Page() {
  return <ImoveisClientPage />;
}

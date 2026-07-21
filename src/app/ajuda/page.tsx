import AjudaClientPage from './AjudaClientPage';
import type { Metadata } from 'next';

/**
 * @fileOverview Server Component para a rota /ajuda.
 * Gerencia metadados e viewport no servidor para conformidade com Next.js 15.
 */

export const metadata: Metadata = {
  title: 'Ajuda | Oraora',
  description: 'Tire suas dúvidas sobre como encontrar, anunciar ou gerenciar imóveis no ecossistema Oraora.',
};

export default function Page() {
  return <AjudaClientPage />;
}

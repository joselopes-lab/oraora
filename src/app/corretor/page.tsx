import CorretorClientPage from './CorretorClientPage';
import type { Metadata } from 'next';

/**
 * @fileOverview Server Component para a rota /corretor.
 * Gerencia metadados e viewport do lado do servidor para evitar erros no App Hosting.
 */

export const metadata: Metadata = {
  title: 'Para Corretores | Oraora',
  description: 'A plataforma SaaS de inteligência imobiliária definitiva para corretores de imóveis de alta performance.',
};

export default function Page() {
  return <CorretorClientPage />;
}

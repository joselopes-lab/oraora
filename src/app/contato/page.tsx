import ContatoClientPage from "./ContatoClientPage";
import type { Metadata } from 'next';

/**
 * @fileOverview Server Component para a rota /contato.
 */

export const metadata: Metadata = {
  title: 'Contato | Oraora',
  description: 'Fale com nosso time de consultores ou suporte técnico. Estamos prontos para atender você.',
};

export default function Page() {
  return <ContatoClientPage />;
}

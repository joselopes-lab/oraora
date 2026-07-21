import SobrePageClient from "./SobrePageClient";
import type { Metadata } from 'next';

/**
 * @fileOverview Server Component para a rota /sobre.
 * Define metadados no servidor para SEO e performance de build.
 */

export const metadata: Metadata = {
  title: 'Sobre | Oraora',
  description: 'Conheça o ecossistema Oraora, a tecnologia que está transformando a forma como conectamos sonhos a novos endereços.',
};

export default function Page() {
  return <SobrePageClient />;
}

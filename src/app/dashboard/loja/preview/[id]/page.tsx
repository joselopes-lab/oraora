
import { Metadata } from 'next';
import ThemePreviewClient from './ThemePreviewClient';

/**
 * @fileOverview Server Component para a rota de Preview de Temas.
 */

export const metadata: Metadata = {
  title: 'Preview de Tema | Oraora',
  description: 'Visualize este layout com seus próprios dados antes de ativá-lo.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThemePreviewClient themeId={id} />;
}

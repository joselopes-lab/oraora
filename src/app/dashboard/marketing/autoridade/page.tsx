
import { Metadata } from 'next';
import AutoridadeClientPage from './AutoridadeClientPage';

export const metadata: Metadata = {
  title: 'Autoridade Digital | Marketing Oraora',
  description: 'Configure sua área de atuação e especialidades para turbinar seu SEO e presença digital.',
};

export default function Page() {
  return <AutoridadeClientPage />;
}

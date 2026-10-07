import CorretorClientPage from './CorretorClientPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Para Corretores | OraOra — Cada venda constrói a próxima',
  description: 'O OraOra ajuda você a transformar o trabalho que faz hoje em estrutura para continuar construindo seu negócio amanhã. Cada venda constrói a próxima.',
  openGraph: {
    title: 'OraOra | Cada venda constrói a próxima',
    description: 'Transforme o trabalho diário de atendimento e vendas em patrimônio digital e estrutura permanente para o seu negócio imobiliário.',
    url: 'https://oraora.com.br/corretor',
    siteName: 'OraOra',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OraOra | Cada venda constrói a próxima',
    description: 'O trabalho do corretor precisa construir alguma coisa. Conheça o OraOra.',
  }
};

export default function Page() {
  return <CorretorClientPage />;
}

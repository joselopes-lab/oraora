import React from 'react';
import Hero from '@/components/o-mercado-tem-rosto/Hero';
import Manifesto from '@/components/o-mercado-tem-rosto/Manifesto';
import Inversao from '@/components/o-mercado-tem-rosto/Inversao';
import CorretoresGrid from '@/components/o-mercado-tem-rosto/CorretoresGrid';
import CampanhaOOH from '@/components/o-mercado-tem-rosto/CampanhaOOH';
import ComoFunciona from '@/components/o-mercado-tem-rosto/ComoFunciona';
import PorQueFazemos from '@/components/o-mercado-tem-rosto/PorQueFazemos';
import ChamadaParticipacao from '@/components/o-mercado-tem-rosto/ChamadaParticipacao';
import FormularioParticipacao from '@/components/o-mercado-tem-rosto/FormularioParticipacao';
import FooterEditorial from '@/components/o-mercado-tem-rosto/FooterEditorial';

export const metadata = {
  title: 'O Mercado Tem Rosto | OraOra',
  description: 'Uma campanha do OraOra para reconhecer os profissionais que fazem o mercado imobiliário acontecer todos os dias.',
};

export default function MercadoTemRostoPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 selection:bg-[#2bf20d] selection:text-zinc-950">
      <Hero />
      <Manifesto />
      <Inversao />
      <CorretoresGrid />
      <CampanhaOOH />
      <ComoFunciona />
      <PorQueFazemos />
      <ChamadaParticipacao />
      <FormularioParticipacao />
      <FooterEditorial />
    </main>
  );
}

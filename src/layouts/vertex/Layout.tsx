'use client';

import React from 'react';
import { LayoutProps } from '../sdk.types';
import * as Vertex from './components';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { useNavigation } from '@/lib/navigation/navigationService';
import Link from 'next/link';

/**
 * @fileOverview Layout.tsx - Vertex Homepage Experience
 * 
 * Montagem oficial da Homepage do Tema Vertex seguindo o SDK 1.0.
 * Utiliza exclusivamente os componentes do Vertex Design System.
 */

export default function VertexLayout({ 
  broker, 
  properties, 
  content, 
  theme, 
  seo, 
  settings 
}: LayoutProps) {
  
  const nav = useNavigation(broker.slug);

  // Extração de dados da IA (content) com fallbacks seguros
  const heroContent = {
    tagline: content.heroTagline || "Curadoria Exclusiva",
    title: content.heroTitle || "A nova definição de <span class='text-primary'>viver bem</span>.",
    subtitle: content.heroSubtitle || "Ativos imobiliários de alto padrão selecionados para investidores de alta performance.",
    imageUrl: content.heroImageUrl || 'https://picsum.photos/seed/vertex-hero/800/1000'
  };

  const stats = [
    { label: 'Imóveis Vendidos', value: content.statsSold || '150', suffix: '+' },
    { label: 'Anos de Mercado', value: content.statsExperience || '10', suffix: '+' },
    { label: 'Satisfação', value: content.statsSatisfaction || '4.9', suffix: '/5' },
    { label: 'Atendimentos', value: content.statsSupport || '12', suffix: 'k' },
  ];

  const aboutContent = {
    title: content.aboutTitle || "Consultoria Pessoal e Estratégica",
    text: content.aboutText || "Transformamos a complexidade do mercado imobiliário em uma experiência fluida e segura. Nossa inteligência de dados aliada à curadoria humana garante o melhor deal para o seu patrimônio.",
    imageUrl: content.aboutImageUrl || 'https://picsum.photos/seed/vertex-about/800/1000',
    quote: content.aboutQuote || "Excelência não é um ato, mas um hábito presente em cada detalhe da nossa negociação."
  };

  const ctaContent = {
    title: content.ctaTitle || "Pronto para o próximo nível?",
    subtitle: content.ctaSubtitle || "Agende uma consultoria agora e receba um dossiê personalizado de oportunidades."
  };

  // Configuração de Estilos Dinâmicos (CSS Variables)
  const dynamicStyles = {
    '--primary': theme.primary || '80 99% 49%',
    '--secondary': theme.secondary || '110 16% 8%',
    '--background': theme.background || '0 0% 100%',
    '--foreground': theme.foreground || '110 16% 8%',
    '--accent': theme.accent || '97 78% 56%',
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="vertex-theme min-h-screen bg-background text-foreground font-display selection:bg-primary selection:text-secondary">
      {/* 1. Header */}
      <Vertex.VertexHeader broker={broker} />

      {/* 2. Hero Fullscreen */}
      <Vertex.VertexHero 
        tagline={heroContent.tagline}
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        imageUrl={heroContent.imageUrl}
      />

      {/* 3. Busca Premium */}
      <div className="relative z-30 -mt-10 mb-10">
        <Vertex.VertexSearch />
      </div>

      {/* 4. Estatísticas */}
      <Vertex.VertexSection className="bg-slate-50 dark:bg-slate-900/50">
        <Vertex.VertexStats stats={stats} />
      </Vertex.VertexSection>

      {/* 5. Imóveis em Destaque */}
      <Vertex.VertexSection 
        tagline={content.featuredTagline || "Portfólio"}
        title={content.featuredTitle || "Ativos Selecionados"}
        description={content.featuredSubtitle || "Oportunidades de alta liquidez e design assinado."}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.slice(0, 6).map((prop) => (
            <Vertex.VertexPropertyCard 
              key={prop.id} 
              property={prop} 
              href={nav.property(prop.informacoesbasicas.slug || prop.id)}
            />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
            <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] border-2 hover:bg-primary hover:text-secondary hover:border-primary transition-all">
                <Link href={nav.search()}>Ver Catálogo Completo</Link>
            </Button>
        </div>
      </Vertex.VertexSection>

      {/* 6. Construtoras Parceiras */}
      <Vertex.VertexSection 
        tagline="Rede"
        title="Parcerias de Valor"
        description="Conectamos você aos maiores incorporadores do país."
        className="bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Vertex.VertexBuilderCard name="Vanguard" propertyCount={12} />
          <Vertex.VertexBuilderCard name="Plaenge" propertyCount={8} />
          <Vertex.VertexBuilderCard name="Cyrela" propertyCount={15} />
        </div>
      </Vertex.VertexSection>

      {/* 7. Regiões Atendidas */}
      <Vertex.VertexSection 
        tagline="Localização"
        title="Regiões de Performance"
        description="Foco total nos bairros com maior índice de valorização e qualidade de vida."
        centered
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {['Altiplano', 'Cabo Branco', 'Manaíra', 'Bessa'].map((bairro) => (
             <div key={bairro} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col items-center gap-3 group hover:border-primary transition-all cursor-pointer">
               <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">location_on</span>
               <span className="font-bold text-slate-900 uppercase tracking-tighter">{bairro}</span>
             </div>
           ))}
        </div>
      </Vertex.VertexSection>

      {/* 8. Sobre o Corretor */}
      <Vertex.VertexSection className="bg-slate-50 dark:bg-slate-900/50">
        <Vertex.VertexAbout 
          title={aboutContent.title}
          text={aboutContent.text}
          imageUrl={aboutContent.imageUrl}
          quote={aboutContent.quote}
        />
      </Vertex.VertexSection>

      {/* 9. Depoimentos */}
      <Vertex.VertexSection 
        tagline="Feedback"
        title="Experiência do Cliente"
        centered
      >
        <Vertex.VertexTestimonials 
          items={[
            { name: "Luciano Barros", role: "Investidor", text: "A curadoria do Vertex me permitiu encontrar ativos que sequer estavam no mercado aberto." },
            { name: "Beatriz Mello", role: "Moradora", text: "O atendimento superou minhas expectativas. Senti que estava sendo cuidada por um consultor de fato." },
            { name: "Marcos Paulo", role: "CEO Tech", text: "Rapidez, transparência e tecnologia. O que todo corretor deveria ser, o Vertex entrega." }
          ]}
        />
      </Vertex.VertexSection>

      {/* 10. CTA Principal */}
      <Vertex.VertexSection>
        <Vertex.VertexCTA 
          title={ctaContent.title}
          subtitle={ctaContent.subtitle}
        />
      </Vertex.VertexSection>

      {/* 11. Footer */}
      <Vertex.VertexFooter broker={broker} />

      {/* Widget Global */}
      <WhatsAppWidget brokerId={broker.id} source="home" />
    </div>
  );
}

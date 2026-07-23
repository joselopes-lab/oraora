'use client';
/**
 * @fileOverview Layout.tsx - Aura Layout (SDK 1.0 Compliant)
 * 
 * Responsável apenas pela renderização. Recebe Props Oficiais.
 */

import React from 'react';
import { LayoutProps } from '../sdk.types';
import { Button } from "@/components/ui/button";
import { UrbanPadraoHeader } from '../urban-padrao/components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../urban-padrao/components/UrbanPadraoFooter';
import { WhatsAppWidget } from '../urban-padrao/components/WhatsAppWidget';
import { useNavigation } from '@/lib/navigation/navigationService';
import Link from 'next/link';

export default function AuraLayout({ 
  broker, 
  properties, 
  content, 
  theme, 
  seo, 
  settings 
}: LayoutProps) {
  
  const nav = useNavigation(broker.slug);

  // Converte cores para variáveis CSS seguindo o padrão legível pelo UrbanPadraoHeader/Footer
  // enquanto o layout Aura não tem seus próprios componentes de navegação.
  const dynamicStyles = {
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--background': theme.background,
    '--foreground': theme.foreground,
    '--accent': theme.accent,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="aura-layout min-h-screen bg-background text-foreground font-body">
      {/* Reutilizando Header Legado conforme SDK */}
      <UrbanPadraoHeader broker={broker as any} />
      
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="space-y-4 mb-12">
            <h1 className="text-5xl font-black tracking-tight" dangerouslySetInnerHTML={{ __html: content.heroTitle || 'Layout Aura' }} />
            <p className="text-xl text-muted-foreground">{content.heroSubtitle || 'Este layout segue a nova arquitetura SDK 1.0.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {properties.slice(0, 3).map(prop => (
                <Link key={prop.id} href={nav.property(prop.informacoesbasicas.slug || prop.id)} className="bg-card p-4 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-video relative rounded-2xl overflow-hidden mb-4 bg-muted">
                        <img src={prop.midia[0]} alt={prop.informacoesbasicas.nome} className="object-cover w-full h-full" />
                    </div>
                    <h3 className="font-bold">{prop.informacoesbasicas.nome}</h3>
                    <p className="text-primary font-black mt-2">
                        {prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </Link>
            ))}
        </div>

        <div className="mt-20 p-10 bg-secondary rounded-[3rem] text-secondary-foreground">
            <h2 className="text-3xl font-bold mb-4">{seo.slogan || 'Pronto para o próximo nível?'}</h2>
            <p className="opacity-70 mb-8">{seo.description}</p>
            <Button asChild className="bg-primary text-primary-foreground font-bold px-8 h-12 rounded-xl border-none cursor-pointer">
                <Link href={nav.contact()}>Agendar Consultoria</Link>
            </Button>
        </div>
      </main>

      <UrbanPadraoFooter broker={broker as any} />
      <WhatsAppWidget brokerId={broker.id} source="home" />
    </div>
  );
}

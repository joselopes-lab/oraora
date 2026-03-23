
'use client';

import React, { useContext, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthContext, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { OnboardingContext } from '../DashboardCore';

type Property = {
    id: string;
};

export default function AtivacaoPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const onboardingContext = useContext(OnboardingContext);

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user?.uid && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user?.uid, userProfile?.userType]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<any>(brokerDocRef);

  const portfolioDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'portfolios', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

  const brokerPropertiesQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: avulsoProperties, isLoading: areAvulsoLoading } = useCollection<Property>(brokerPropertiesQuery);

  const setupSteps = useMemo(() => {
    const isStepDone = (id: number) => {
      if (!userProfile || !brokerProfile) return false;
      switch (id) {
        case 1: return !!brokerProfile.onboardingCompleted;
        case 2: return !!brokerProfile.logoUrl;
        case 3: return !!brokerProfile.layoutId;
        case 4: return !!brokerProfile.primaryColor && brokerProfile.primaryColor !== '111 89% 50%';
        case 5: return (portfolio?.propertyIds?.length ?? 0) > 0;
        case 6: return (avulsoProperties?.length ?? 0) > 0;
        case 7: return !!brokerProfile.oralink;
        default: return false;
      }
    };

    return [
      { id: 1, title: 'Onboarding', description: 'Configure seus dados básicos e gere o conteúdo do seu site através da nossa IA.', icon: 'rocket_launch', action: () => onboardingContext?.openOnboarding(), completed: isStepDone(1) },
      { id: 2, title: 'Minha marca', description: 'Faça o upload da sua logo para o topo e rodapé do seu novo portal imobiliário.', icon: 'branding_watermark', href: '/dashboard/meu-site', completed: isStepDone(2) },
      { id: 3, title: 'Layout do site', description: 'Escolha entre nossos templates premium o design que melhor representa seu estilo.', icon: 'grid_view', href: '/dashboard/loja', completed: isStepDone(3) },
      { id: 4, title: 'Cores do site', description: 'Personalize a paleta de cores para alinhar a interface visual com a sua identidade de marca.', icon: 'palette', href: '/dashboard/meu-site/cores', completed: isStepDone(4) },
      { id: 5, title: 'Imóveis', description: 'Selecione imóveis de construtoras parceiras para compor sua vitrine digital de destaques.', icon: 'apartment', href: '/dashboard/imoveis', completed: isStepDone(5) },
      { id: 6, title: 'Cadastrar avulso', description: 'Cadastre seus próprios imóveis captados para ter um portfólio único e exclusivo.', icon: 'add_home', href: '/dashboard/avulso', completed: isStepDone(6) },
      { id: 7, title: 'Oralink', description: 'Configure seu cartão de visitas digital interativo para facilitar o contato com leads.', icon: 'link', href: '/dashboard/oralink', completed: isStepDone(7) },
    ];
  }, [brokerProfile, portfolio, avulsoProperties, onboardingContext, userProfile]);

  if (!isReady || isBrokerLoading || isPortfolioLoading || areAvulsoLoading) {
    return <div className="p-10 text-center">Carregando guia de ativação...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Guia de Ativação</h1>
        <p className="text-slate-500 mt-1">Confira o passo a passo completo para colocar sua imobiliária digital em operação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {setupSteps.map((step) => (
          <div key={step.id} className={cn(
            "p-6 rounded-2xl border transition-all flex flex-col gap-4 group relative",
            step.completed ? "border-slate-800 bg-slate-950 shadow-lg" : "bg-white border-slate-100 shadow-soft"
          )}>
            <div className="flex items-center justify-between">
              <div className={cn(
                "size-12 rounded-xl flex items-center justify-center transition-colors",
                step.completed ? "bg-primary/20 text-primary" : "bg-gray-50 text-primary group-hover:bg-primary group-hover:text-black"
              )}>
                <span className="material-symbols-outlined text-2xl">
                  {step.completed ? 'check_circle' : step.icon}
                </span>
              </div>
              <span className={cn(
                "text-2xl font-black transition-colors",
                step.completed ? "text-slate-800" : "text-gray-100"
              )}>
                0{step.id}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn("font-bold text-sm uppercase tracking-tight", step.completed ? "text-white" : "text-text-main")}>{step.title}</h3>
                {step.completed && (
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-100 px-2 py-0.5 rounded">Concluído</span>
                )}
              </div>
              <p className={cn("text-xs leading-relaxed", step.completed ? "text-slate-200" : "text-slate-500")}>{step.description}</p>
            </div>
            {step.href ? (
              <Button asChild variant={step.completed ? "ghost" : "outline"} className={cn(
                "mt-auto w-full h-11 rounded-xl font-bold transition-all",
                step.completed ? "text-green-600 hover:bg-slate-900" : "border-gray-100 hover:bg-primary hover:border-primary hover:text-black"
              )}>
                <Link href={step.href}>{step.completed ? 'Revisar Configuração' : 'Ir para Configuração'}</Link>
              </Button>
            ) : (
              <Button 
                onClick={step.action} 
                variant={step.completed ? "ghost" : "outline"} 
                className={cn(
                  "mt-auto w-full h-11 rounded-xl font-bold transition-all",
                  step.completed ? "text-green-600 hover:bg-slate-900" : "border-gray-100 hover:bg-primary hover:border-primary hover:text-black"
                )}
              >
                {step.completed ? 'Ver Novamente' : 'Iniciar Agora'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

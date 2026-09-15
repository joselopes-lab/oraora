import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const ActivationPanel = ({ userProfile }: { userProfile: any }) => {
  const [progresso, setProgresso] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);
  const firestore = useFirestore();
  const router = useRouter();

  if (userProfile?.userType !== 'broker') {
    return null;
  }

  useEffect(() => {
    if (userProfile?.id) {
      const savedState = localStorage.getItem(`activation-panel-state:${userProfile.id}`);
      if (savedState !== null) {
        setIsOpen(savedState === 'true');
      }
    }
  }, [userProfile?.id]);

  const handleToggleOpen = (open: boolean) => {
    setIsOpen(open);
    if (userProfile?.id) {
      localStorage.setItem(`activation-panel-state:${userProfile.id}`, String(open));
    }
  };

  useEffect(() => {
    if (!firestore || !userProfile?.id) return;

    let brokerData: any = {};
    let portfolioData: any = {};
    let avulsoData: any[] = [];

    const updateProgress = () => {
      const isStepDone = (id: number) => {
        switch (id) {
          case 1: return !!brokerData.onboardingCompleted;
          case 2: return !!brokerProfileLogo(); // matches brokerProfile.logoUrl
          case 3: return !!brokerData.layoutId;
          case 4: return !!brokerData.primaryColor && brokerData.primaryColor !== '111 89% 50%';
          case 5: return (portfolioData?.propertyIds?.length ?? 0) > 0;
          case 6: return (avulsoData?.length ?? 0) > 0;
          case 7: return !!brokerData.oralink;
          default: return false;
        }
      };

      function brokerProfileLogo() {
        return brokerData.logoUrl;
      }

      const etapas = [
        { id: 'onboarding', label: 'Onboarding', concluida: isStepDone(1), link: '#' },
        { id: 'marca', label: 'Minha marca', concluida: isStepDone(2), link: '/dashboard/meu-site' },
        { id: 'layout', label: 'Layout do site', concluida: isStepDone(3), link: '/dashboard/loja' },
        { id: 'cores', label: 'Cores do site', concluida: isStepDone(4), link: '/dashboard/meu-site/cores' },
        { id: 'imoveis', label: 'Imóveis', concluida: isStepDone(5), link: '/dashboard/imoveis' },
        { id: 'avulso', label: 'Cadastrar avulso', concluida: isStepDone(6), link: '/dashboard/avulso' },
        { id: 'oralink', label: 'Oralink', concluida: isStepDone(7), link: '/dashboard/oralink' }
      ];

      const concluidas = etapas.filter(e => e.concluida).length;
      setProgresso({ etapas, concluidas, total: etapas.length });
    };

    const unsubBroker = onSnapshot(doc(firestore, 'brokers', userProfile.id), (docSnap) => {
      brokerData = docSnap.exists() ? docSnap.data() : {};
      updateProgress();
    });

    const unsubPortfolio = onSnapshot(doc(firestore, 'portfolios', userProfile.id), (docSnap) => {
      portfolioData = docSnap.exists() ? docSnap.data() : {};
      updateProgress();
    });

    const qAvulso = query(collection(firestore, 'brokerProperties'), where('brokerId', '==', userProfile.id));
    const unsubAvulso = onSnapshot(qAvulso, (snapshot) => {
      avulsoData = snapshot.docs;
      updateProgress();
    });

    return () => {
      unsubBroker();
      unsubPortfolio();
      unsubAvulso();
    };
  }, [firestore, userProfile]);

  if (!progresso) return null;

  // Se todas as etapas estiverem concluídas (7/7), o painel deixa de ser renderizado automaticamente
  if (progresso.concluidas >= progresso.total) {
    return null;
  }

  const porcentagem = Math.round((progresso.concluidas / progresso.total) * 100);

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg" onClick={() => handleToggleOpen(true)}>
        ⚡ Ativação {porcentagem}%
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">⚡ ATIVAÇÃO</h3>
        <Button variant="ghost" size="sm" onClick={() => handleToggleOpen(false)}>−</Button>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${porcentagem}%` }}></div>
      </div>
      <p className="text-sm mb-4 text-slate-600 dark:text-slate-400">{progresso.concluidas} de {progresso.total} etapas concluídas</p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {progresso.etapas.map((etapa: any) => (
          <div key={etapa.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded transition-colors" onClick={() => {
            if (etapa.link !== '#') router.push(etapa.link);
          }}>
            {etapa.concluida ? <span className="text-green-500 font-bold">✓</span> : <span className="text-slate-400">○</span>}
            <span className={etapa.concluida ? "text-slate-500 dark:text-slate-400 line-through text-sm" : "font-medium text-slate-900 dark:text-white text-sm"}>{etapa.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

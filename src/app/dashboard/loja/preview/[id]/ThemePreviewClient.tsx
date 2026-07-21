'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useAuthContext, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase,
  useFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getTheme } from '@/layouts/registry';
import { LayoutProps } from '@/layouts/sdk.types';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToastAction } from "@/components/ui/toast";

/**
 * @fileOverview ThemePreviewClient - O motor de visualização e ativação.
 * 
 * ATUALIZAÇÃO ARQUITETURAL: 
 * Implementada resolução de Broker de Demonstração para permitir que Super Admins
 * visualizem os temas sem possuir um perfil na coleção 'brokers'.
 */

type Viewport = 'desktop' | 'notebook' | 'tablet' | 'mobile';

interface ThemePreviewClientProps {
  themeId: string;
}

// Fallback final em memória para evitar crashes se o banco de dados estiver totalmente vazio
const MOCK_BROKER_SAFETY = {
    id: 'demo-id',
    brandName: 'Oraora Imóveis (Demonstração)',
    slug: 'demo-site',
    logoUrl: 'https://images.unsplash.com/photo-1619551734325-81aaf323686c?w=200&h=80&fit=crop',
    primaryColor: '111 89% 50%',
    secondaryColor: '110 16% 8%',
    homepage: {
        heroTitle: "Bem-vindo à <span class='text-primary'>Excelência</span>",
        heroSubtitle: "Este é um ambiente de demonstração para visualização de temas.",
        heroTagline: "Visualização Administrativa",
        aboutTitle: "Sobre a Plataforma",
        aboutText: "Esta é uma pré-visualização utilizando dados de demonstração.",
    }
};

export default function ThemePreviewClient({ themeId }: ThemePreviewClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, isReady } = useAuthContext();
  const { firestore } = useFirebase();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // 1. Obter Definição do Tema (Técnica)
  const themeDefinition = useMemo(() => getTheme(themeId), [themeId]);
  const ThemeComponent = themeDefinition.component;

  // 2. Coletar Dados do Corretor Logado (Primary Try)
  const brokerDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: brokerData, isLoading: isBrokerLoading } = useDoc<any>(brokerDocRef);

  // 3. Fallback para Admin: Buscar primeiro broker da base para demonstração
  const demoBrokerQuery = useMemoFirebase(
      () => (firestore && !isBrokerLoading && !brokerData && userProfile?.userType === 'admin' 
        ? query(collection(firestore, 'brokers'), limit(1)) 
        : null),
      [firestore, isBrokerLoading, !!brokerData, userProfile?.userType]
  );
  const { data: demoBrokers, isLoading: isDemoLoading } = useCollection<any>(demoBrokerQuery);

  // 4. RESOLUÇÃO FINAL DO BROKER (O segredo da estabilidade)
  const resolvedBroker = useMemo(() => {
      if (brokerData) return brokerData;
      if (demoBrokers && demoBrokers.length > 0) return demoBrokers[0];
      return MOCK_BROKER_SAFETY;
  }, [brokerData, demoBrokers]);

  // 5. Coletar Imóveis baseados no BROKER RESOLVIDO
  const portfolioDocRef = useMemoFirebase(
    () => (firestore && resolvedBroker?.id ? doc(firestore, 'portfolios', resolvedBroker.id) : null),
    [firestore, resolvedBroker?.id]
  );
  const { data: portfolio } = useDoc<any>(portfolioDocRef);

  const avulsoPropsQuery = useMemoFirebase(
    () => (firestore && resolvedBroker?.id ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', resolvedBroker.id)) : null),
    [firestore, resolvedBroker?.id]
  );
  const { data: avulsoProperties } = useCollection<any>(avulsoPropsQuery);

  const [portfolioProperties, setPortfolioProperties] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  useEffect(() => {
    async function fetchPortfolio() {
      if (!firestore || !portfolio?.propertyIds?.length) {
          setPortfolioProperties([]);
          return;
      }
      setIsLoadingPortfolio(true);
      try {
        const ids = portfolio.propertyIds.slice(0, 30);
        const q = query(collection(firestore, 'properties'), where('__name__', 'in', ids));
        const snap = await getDocs(q);
        setPortfolioProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
          console.error("Error fetching portfolio for preview:", e);
      } finally {
        setIsLoadingPortfolio(false);
      }
    }
    fetchPortfolio();
  }, [firestore, portfolio]);

  const allProperties = useMemo(() => {
    const combined = [...(avulsoProperties || []), ...portfolioProperties];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values());
  }, [avulsoProperties, portfolioProperties]);

  // --- CORE ACTIVATION LOGIC ---
  const handleConfirmActivation = async () => {
    // A ativação só é permitida se o usuário for o dono do broker (ou se implementarmos ativação por admin depois)
    if (!user?.uid || !firestore || !brokerDocRef || userProfile?.userType === 'admin') {
        if (userProfile?.userType === 'admin') {
            toast({ title: "Modo Protegido", description: "Administradores não podem ativar temas para si mesmos via preview." });
            setIsConfirmModalOpen(false);
        }
        return;
    }
    
    setIsActivating(true);
    const targetThemeId = themeDefinition.id;

    try {
      await setDocumentNonBlocking(brokerDocRef, { 
        layoutId: targetThemeId 
      }, { merge: true });

      toast({
        title: "Layout Ativado!",
        description: `Seu site agora está utilizando o tema ${themeDefinition.manifest.name}.`,
        action: (
          <ToastAction altText="Ver Site" asChild>
            <Link href={`/sites/${resolvedBroker?.slug}`} target="_blank" className="flex items-center gap-2">
              <ExternalLink className="size-3" /> Ver Site
            </Link>
          </ToastAction>
        ),
      });

      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error("Error activating theme:", error);
      toast({
        variant: "destructive",
        title: "Erro na ativação",
        description: "Não foi possível aplicar o novo tema. Tente novamente.",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const isLoading = !isReady || isBrokerLoading || isDemoLoading || isLoadingPortfolio;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-widest text-[10px]">Preparando Preview estratégico...</p>
      </div>
    );
  }

  // Prepara as props no padrão SDK 1.0 ou Legado
  const sdkProps: LayoutProps = {
    broker: {
      id: resolvedBroker?.id || '',
      brandName: resolvedBroker?.brandName || 'Sua Marca',
      slug: resolvedBroker?.slug || 'preview',
      logoUrl: resolvedBroker?.logoUrl,
      footerLogoUrl: resolvedBroker?.footerLogoUrl,
      faviconUrl: resolvedBroker?.faviconUrl,
      creci: resolvedBroker?.creci,
      whatsappUrl: resolvedBroker?.whatsappUrl,
      instagramUrl: resolvedBroker?.instagramUrl,
      linkedinUrl: resolvedBroker?.linkedinUrl,
    },
    properties: allProperties as any,
    content: resolvedBroker?.homepage || {},
    theme: {
      primary: resolvedBroker?.primaryColor,
      secondary: resolvedBroker?.secondaryColor,
      accent: resolvedBroker?.accentColor,
      background: resolvedBroker?.backgroundColor,
      foreground: resolvedBroker?.foregroundColor,
    },
    seo: {
      title: resolvedBroker?.siteTitle,
      slogan: resolvedBroker?.footerSlogan,
      description: resolvedBroker?.homepage?.heroSubtitle,
    },
    settings: {
      enabledTransactions: resolvedBroker?.businessSettings?.enabledTransactions || ['sale', 'rent'],
    },
    version: themeDefinition.manifest.version
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        {/* PREVIEW TOOLBAR */}
        <header className="h-16 shrink-0 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 z-[110] shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase">PV</div>
              <div className="text-left">
                  <h2 className="text-white text-xs font-black uppercase tracking-tight">Modo Preview</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      {userProfile?.userType === 'admin' ? `DEMO: ${resolvedBroker.brandName}` : `TEMA: ${themeDefinition.manifest.name}`}
                  </p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
            {/* Device Toggles */}
            <div className="hidden md:flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
              <button 
                  onClick={() => setViewport('desktop')}
                  className={cn("size-9 rounded-lg flex items-center justify-center transition-all", viewport === 'desktop' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-white")}
              >
                  <Monitor className="size-4" />
              </button>
              <button 
                  onClick={() => setViewport('notebook')}
                  className={cn("size-9 rounded-lg flex items-center justify-center transition-all", viewport === 'notebook' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-white")}
              >
                  <Laptop className="size-4" />
              </button>
              <button 
                  onClick={() => setViewport('tablet')}
                  className={cn("size-9 rounded-lg flex items-center justify-center transition-all", viewport === 'tablet' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-white")}
              >
                  <Tablet className="size-4" />
              </button>
              <button 
                  onClick={() => setViewport('mobile')}
                  className={cn("size-9 rounded-lg flex items-center justify-center transition-all", viewport === 'mobile' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-white")}
              >
                  <Smartphone className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest"
            >
              Sair
            </Button>
            {userProfile?.userType !== 'admin' && (
                <AlertDialogTrigger asChild>
                <Button 
                    className="bg-primary text-slate-900 font-black text-xs uppercase tracking-widest px-8 h-10 rounded-xl shadow-glow border-none"
                >
                    Aplicar Tema
                </Button>
                </AlertDialogTrigger>
            )}
          </div>
        </header>

        {/* VIEWPORT CANVAS */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 md:p-8 lg:p-12 flex justify-center items-start custom-scrollbar">
          <div 
            className={cn(
              "bg-white transition-all duration-500 ease-in-out shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden",
              viewport === 'desktop' && "w-full max-w-[1440px] rounded-none",
              viewport === 'notebook' && "w-[1280px] rounded-none",
              viewport === 'tablet' && "w-[768px] rounded-2xl",
              viewport === 'mobile' && "w-[375px] rounded-[3rem] border-[12px] border-slate-900"
            )}
            style={{ minHeight: viewport === 'mobile' ? '667px' : '100%' }}
          >
            {/* Layout Injection */}
            {themeDefinition.isLegacy ? (
              <ThemeComponent broker={resolvedBroker} properties={allProperties} />
            ) : (
              <ThemeComponent {...sdkProps} />
            )}
            
            {/* Scroll Overlay Indicator */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5"></div>
          </div>
        </div>

        {/* Activation Modal */}
        <AlertDialogContent className="bg-slate-900 border-white/5 text-white max-w-md">
          <AlertDialogHeader>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CheckCircle2 className="size-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Ativar Novo Visual?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm leading-relaxed text-left">
              Você está prestes a alterar o visual do seu site para o tema <strong className="text-white">{themeDefinition.manifest.name}</strong>. 
              <br/><br/>
              Todo o seu conteúdo (imóveis, biografia e fotos) permanecerá exatamente igual. Você poderá trocar de tema novamente quando desejar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-12 font-bold">
              Cancelar
            </AlertDialogCancel>
            <Button 
              onClick={handleConfirmActivation}
              disabled={isActivating}
              className="bg-primary text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl h-12 px-8 shadow-glow border-none"
            >
              {isActivating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Ativando...
                </>
              ) : (
                "Ativar Tema Agora"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #020617; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

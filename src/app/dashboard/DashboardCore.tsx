'use client';

import Link from "next/link";
import { UserMenu } from "./user-info";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { UserProfile } from "@/firebase/auth-provider";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Progress } from "@/components/ui/progress";
import { generateSiteContent } from '@/ai/flows/generate-site-content-flow';

// Context to share onboarding state
export const OnboardingContext = createContext<{
  openOnboarding: () => void;
} | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};

const AIChatWidget = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Olá! Bom dia. Como posso ajudar no seu desempenho hoje? Notei que você tem 3 visitas importantes agendadas.',
            time: '09:12'
        },
    ]);
    const [inputValue, setInputValue] = useState('');

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const currentTime = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        setMessages(prev => [...prev, { sender: 'user', text: inputValue, time: currentTime }]);
        setInputValue('');

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Entendido. Processando sua solicitação...', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <div
                id="chatWindow"
                className={cn(
                    "w-[420px] h-[600px] bg-white rounded-2xl flex flex-col shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto",
                    "transition-all duration-300 ease-out",
                    isChatOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none hidden'
                )}
            >
              <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Assistente Oraora AI</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Online agora</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" onClick={toggleChat}>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.map((message, index) => (
                    message.sender === 'bot' ? (
                        <div key={index} className="flex flex-col items-start max-w-[85%]">
                          <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <p className="text-sm text-gray-800 leading-relaxed">{message.text}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 ml-1">{message.time}</span>
                        </div>
                    ) : (
                        <div key={index} className="flex flex-col items-end ml-auto max-w-[85%]">
                          <div className="bg-primary p-3 rounded-tr-none shadow-sm">
                            <p className="text-sm text-secondary font-medium leading-relaxed">{message.text}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 mr-1">{message.time}</span>
                        </div>
                    )
                ))}
              </div>
              <footer className="p-4 bg-white">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-gray-400" 
                    placeholder="Pergunte qualquer coisa..." 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2 p-2 bg-secondary text-primary rounded-lg hover:bg-black transition-colors cursor-pointer">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </button>
                </form>
              </footer>
            </div>

            <button
                className={cn(
                    "w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform group cursor-pointer pointer-events-auto",
                    isChatOpen && 'hidden'
                )}
                onClick={toggleChat}
            >
                <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
            </button>
        </div>
    );
};

export default function DashboardCore({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: UserProfile;
}) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;
  
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Local state for the location input being typed
  const [locationInput, setLocationInput] = useState('');

  // --- Onboarding Briefing State ---
  const [briefingData, setBriefingData] = useState({
    name: userProfile.username || '',
    yearsExperience: '',
    locations: [] as string[],
    propertyTypes: [] as string[],
    audiences: [] as string[],
    differential: '',
    valueProposition: '',
    services: [] as string[],
    process: '',
    postSales: 'sim',
    salesVolume: '',
    certifications: '',
    testimonials: 'nao',
    testimonialLink: '',
    marketPosition: 'Especialista',
    professionalStrength: '',
  });

  // --- Final Contact Info State ---
  const [contactInfo, setContactInfo] = useState({
    name: userProfile.username || '',
    email: userProfile.email || '',
    phone: '',
    whatsapp: '',
    creci: '',
    instagram: '',
  });

  const handleAddLocation = () => {
    if (locationInput.trim()) {
      setBriefingData(prev => ({
        ...prev,
        locations: [...prev.locations, locationInput.trim()]
      }));
      setLocationInput('');
    }
  };

  const removeLocation = (index: number) => {
    setBriefingData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const togglePropertyType = (type: string) => {
    setBriefingData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type) 
        ? prev.propertyTypes.filter(t => t !== type) 
        : [...prev.propertyTypes, type]
    }));
  };

  const toggleAudience = (type: string) => {
    setBriefingData(prev => ({
      ...prev,
      audiences: prev.audiences.includes(type) 
        ? prev.audiences.filter(t => t !== type) 
        : [...prev.audiences, type]
    }));
  };

  const toggleService = (svc: string) => {
    setBriefingData(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc]
    }));
  };

  const openOnboarding = () => {
    setOnboardingStep(1);
    setIsOnboardingOpen(true);
  };

  const handleFinishOnboarding = async () => {
    if (!firestore || !userProfile.id) return;
    setIsFinishing(true);
    
    try {
      // 1. Salvar dados de contato e básicos
      const userRef = doc(firestore, 'users', userProfile.id);
      await setDoc(userRef, {
        username: contactInfo.name,
        phone: contactInfo.phone,
        whatsapp: contactInfo.whatsapp,
      }, { merge: true });

      const brokerRef = doc(firestore, 'brokers', userProfile.id);
      await setDoc(brokerRef, {
        brandName: contactInfo.name,
        creci: contactInfo.creci,
        whatsappUrl: `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`,
        instagramUrl: contactInfo.instagram ? `https://instagram.com/${contactInfo.instagram.replace('@', '')}` : '',
      }, { merge: true });

      // 2. Chamar IA para gerar conteúdo (Home, Sobre, Serviços, Contato)
      const aiGeneratedContent = await generateSiteContent(briefingData);

      // 3. Salvar conteúdo gerado pela IA
      await setDoc(brokerRef, {
        homepage: aiGeneratedContent.homepage,
        urbanPadraoSobre: aiGeneratedContent.urbanPadraoSobre,
        urbanPadraoServicos: aiGeneratedContent.urbanPadraoServicos,
        oraoraContato: aiGeneratedContent.oraoraContato,
        onboardingCompleted: true,
        onboardingBriefing: briefingData // Salva o briefing para consulta
      }, { merge: true });

      // 4. Avançar para tela de celebração
      setOnboardingStep(7);
      
    } catch (error) {
      console.error("Erro no onboarding:", error);
      toast({
        variant: "destructive",
        title: "Erro ao finalizar",
        description: "Não foi possível completar o onboarding. Tente novamente.",
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  const personalBrokerRef = useMemoFirebase(
    () => (firestore && userProfile.id ? doc(firestore, 'brokers', userProfile.id) : null),
    [firestore, userProfile.id]
  );
  const { data: personalBrokerData } = useDoc<any>(personalBrokerRef);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  const navLinkClasses = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors h-full flex items-center relative gap-2 cursor-pointer whitespace-nowrap",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0 hover:after:w-full"
    );
  }
  
  const dropdownTriggerClasses = (paths: string[]) => {
    const isActive = paths.some(p => pathname.startsWith(p));
    return cn(
      "text-text-secondary hover:text-text-main font-medium text-sm transition-colors flex items-center gap-2 h-full relative cursor-pointer whitespace-nowrap outline-none",
      "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
      isActive ? "text-text-main font-semibold after:w-full" : "after:w-0 hover:after:w-full"
    );
  }

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      <div className="w-full bg-white border-b border-[#f2f5f0] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10 h-full">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={128} height={32} className="h-6 w-auto" style={{ width: 'auto' }} />
            </Link>
            <nav className="hidden md:flex items-center gap-6 h-full">
                {userProfile.userType === 'broker' && (
                  <>
                    <Link className={navLinkClasses("/dashboard", true)} href="/dashboard">
                      <span className="material-symbols-outlined text-[20px]">grid_view</span>
                      Dashboard
                    </Link>
                    
                    <div onMouseEnter={() => handleMouseEnter('clientes')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'clientes'} onOpenChange={(open) => setOpenMenu(open ? 'clientes' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/leads", "/dashboard/clientes", "/dashboard/personas"])}>
                          <span className="material-symbols-outlined text-[20px]">group</span>
                          Clientes
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('clientes')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/leads">Funil de Vendas</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/clientes">Clientes Ativos</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/personas">Personas</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('portfolio')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'portfolio'} onOpenChange={(open) => setOpenMenu(open ? 'portfolio' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/imoveis", "/dashboard/minha-carteira", "/dashboard/avulso"])}>
                          <span className="material-symbols-outlined text-[20px]">apartment</span>
                          Portfólio
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('portfolio')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/imoveis">Imóveis de Construtoras</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/minha-carteira">Minha Carteira</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/avulso">Imóveis Próprios</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div onMouseEnter={() => handleMouseEnter('negocios')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'negocios'} onOpenChange={(open) => setOpenMenu(open ? 'negocios' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/agenda", "/dashboard/propostas", "/dashboard/financeiro", "/dashboard/jornada"])}>
                          <span className="material-symbols-outlined text-[20px]">business_center</span>
                          Negócios
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('negocios')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/jornada">Jornada de Venda</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/agenda">Agenda</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/propostas">Propostas</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/financeiro">Financeiro</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div onMouseEnter={() => handleMouseEnter('crescimento')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'crescimento'} onOpenChange={(open) => setOpenMenu(open ? 'crescimento' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/meu-site", "/dashboard/marketing", "/dashboard/loja", "/dashboard/oralink", "/dashboard/ativacao"])}>
                          <span className="material-symbols-outlined text-[20px]">trending_up</span>
                          Crescimento
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('crescimento')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/meu-site">Meu Site</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/oralink">Oralink</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/marketing">Marketing</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/loja">Loja</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/ativacao">Guia de Ativação</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link className={navLinkClasses("/dashboard/suporte")} href="/dashboard/suporte">
                      <span className="material-symbols-outlined text-[20px]">help</span>
                      Suporte
                    </Link>
                  </>
                )}
                
                {userProfile.userType === 'admin' && (
                  <>
                    <div onMouseEnter={() => handleMouseEnter('inteligencia')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'inteligencia'} onOpenChange={(open) => setOpenMenu(open ? 'inteligencia' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard", "/dashboard/admin/leads", "/dashboard/personas"])}>
                          <span className="material-symbols-outlined text-[20px]">psychology</span>
                          Inteligência
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('inteligencia')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard">Visão Geral</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/leads">Leads</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/personas">Personas</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('rede')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'rede'} onOpenChange={(open) => setOpenMenu(open ? 'rede' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/users", "/dashboard/construtoras"])}>
                          <span className="material-symbols-outlined text-[20px]">lan</span>
                          Rede
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('rede')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/users">Usuários</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/construtoras">Construtoras</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link className={navLinkClasses("/dashboard/imoveis")} href="/dashboard/imoveis">
                      <span className="material-symbols-outlined text-[20px]">inventory</span>
                      Ativos
                    </Link>

                    <div onMouseEnter={() => handleMouseEnter('monetizacao')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'monetizacao'} onOpenChange={(open) => setOpenMenu(open ? 'monetizacao' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/planos", "/dashboard/loja"])}>
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                          Monetização
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('monetizacao')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/planos">Planos</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/loja">Loja</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('atendimento')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'atendimento'} onOpenChange={(open) => setOpenMenu(open ? 'atendimento' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/tickets", "/dashboard/admin/comunicados"])}>
                          <span className="material-symbols-outlined text-[20px]">support_agent</span>
                          Atendimento
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('atendimento')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/tickets">Suporte</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/comunicados">Comunicados</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div onMouseEnter={() => handleMouseEnter('plataforma')} onMouseLeave={handleMouseLeave} className="h-full">
                      <DropdownMenu open={openMenu === 'plataforma'} onOpenChange={(open) => setOpenMenu(open ? 'plataforma' : null)}>
                        <DropdownMenuTrigger className={dropdownTriggerClasses(["/dashboard/admin/site", "/dashboard/admin/sitemap"])}>
                          <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                          Plataforma
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" onMouseEnter={() => handleMouseEnter('plataforma')} onMouseLeave={handleMouseLeave}>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/site/inicio">Editor do Site</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/dashboard/admin/sitemap">Sitemap</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {userProfile.userType === 'broker' && (
              <Dialog open={isOnboardingOpen} onOpenChange={(open) => {
                if (!isFinishing) {
                  setIsOnboardingOpen(open);
                  if(!open) setOnboardingStep(1);
                }
              }}>
                {!personalBrokerData?.onboardingCompleted && (
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white border-gray-200 hover:bg-primary hover:border-primary group/onboarding font-bold py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-text-secondary group-hover/onboarding:text-white transition-colors">rocket_launch</span>
                      <span className="text-text-secondary group-hover/onboarding:text-white transition-colors">Onboarding</span>
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="max-w-2xl p-0 border-none shadow-2xl flex flex-col h-[90vh] max-h-[90vh] bg-white overflow-hidden">
                  <VisuallyHidden>
                    <DialogHeader>
                      <DialogTitle>Onboarding Oraora</DialogTitle>
                      <DialogDescription>Configuração inicial do sistema.</DialogDescription>
                    </DialogHeader>
                  </VisuallyHidden>
                  
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {onboardingStep === 1 && (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 p-8 md:p-10 flex flex-col gap-6 bg-white overflow-y-auto min-h-0">
                          <div className="text-center space-y-3">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                              Bem-vindo ao <span className="text-primary">Oraora!</span>
                            </h1>
                            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-lg mx-auto font-body">
                              Vamos configurar seus detalhes de contato, ajustes do sistema e o conteúdo do seu site em poucos minutos para você começar a vender mais.
                            </p>
                          </div>
                          
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-slate-100 shrink-0 bg-black">
                            <iframe
                              src="https://www.youtube.com/embed/yxHzZuXlJDg"
                              title="Oraora Onboarding"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            ></iframe>
                          </div>

                          <div className="flex flex-col gap-4 mt-2">
                            <Button onClick={() => setOnboardingStep(2)} className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold py-6 rounded-xl transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 group text-lg">
                                Começar Onboarding
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Button>
                            <p className="text-center text-slate-400 text-sm font-body">
                              Leva menos de 5 minutos. Você também pode pular e fazer isso depois.
                            </p>
                          </div>
                        </div>
                        <div className="h-2 w-full flex shrink-0">
                          <div className="h-full flex-1 bg-primary"></div>
                          <div className="h-full flex-1 bg-slate-900"></div>
                          <div className="h-full flex-1 bg-primary"></div>
                          <div className="h-full flex-1 bg-slate-900"></div>
                          <div className="h-full flex-1 bg-primary"></div>
                        </div>
                      </div>
                    )}

                    {onboardingStep === 2 && (
                      <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="flex items-center justify-center size-8 bg-primary rounded-lg">
                              <span className="material-symbols-outlined text-slate-900 font-bold">real_estate_agent</span>
                            </div>
                            <h2 className="text-lg font-bold leading-tight tracking-tight">Onboarding de Corretor</h2>
                          </div>
                        </header>
                        <div className="flex flex-col gap-3 p-8 pb-2 shrink-0">
                          <div className="flex gap-6 justify-between items-end">
                            <div>
                              <p className="text-primary font-bold text-sm uppercase tracking-wider">Passo 1 de 5</p>
                              <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mt-1">Sobre Você</h1>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">20% concluído</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: '20%' }}></div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">1. Quantos anos você atua como corretor?</label>
                              <input 
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3" 
                                placeholder="Ex: 5" 
                                type="number"
                                value={briefingData.yearsExperience}
                                onChange={e => setBriefingData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">2. Em quais cidades ou bairros você atua?</label>
                              <div className="relative">
                                <input 
                                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 pr-10" 
                                  placeholder="Digite e pressione Enter" 
                                  type="text"
                                  value={locationInput}
                                  onChange={e => setLocationInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddLocation();
                                    }
                                  }}
                                />
                                <button 
                                  type="button" 
                                  onClick={handleAddLocation}
                                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                  add_circle
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {briefingData.locations.map((loc, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-slate-900 border border-primary/20 text-xs font-bold">
                                    {loc}
                                    <button onClick={() => removeLocation(idx)} className="material-symbols-outlined text-[14px] hover:text-red-500">close</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">3. Qual tipo de imóvel você mais trabalha? (Selecione todos que se aplicam)</label>
                            <div className="flex flex-wrap gap-2">
                              {['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'].map(type => (
                                <button 
                                  key={type}
                                  type="button"
                                  onClick={() => togglePropertyType(type)}
                                  className={cn(
                                    "px-4 py-2 rounded-full border-2 transition-all font-medium text-sm",
                                    briefingData.propertyTypes.includes(type) 
                                      ? "border-primary bg-primary/10 text-slate-900 dark:text-slate-100" 
                                      : "border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-400"
                                  )}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">4. Qual seu público principal? (Selecione todos que se aplicam)</label>
                            <div className="flex flex-wrap gap-2">
                              {['Investidores', 'Famílias', 'Primeiro Imóvel', 'Alto Padrão'].map(type => (
                                <button 
                                  key={type}
                                  type="button"
                                  onClick={() => toggleAudience(type)}
                                  className={cn(
                                    "px-4 py-2 rounded-full border-2 transition-all font-medium text-sm",
                                    briefingData.audiences.includes(type) 
                                      ? "border-primary bg-primary/10 text-slate-900 dark:text-slate-100" 
                                      : "border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-400"
                                  )}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 text-left">
                            <div className="flex items-center gap-2">
                              <label className="text-slate-700 dark:text-slate-300 font-medium text-sm text-left">5. Qual seu maior diferencial como corretor?</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">help</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                  <div className="space-y-2 text-left">
                                    <h4 className="font-bold text-sm text-primary">Exemplos de Diferenciais:</h4>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                                      <li>Especialista em documentação técnica e jurídica.</li>
                                      <li>Uso de drones e tour virtual 3D em todos os anúncios.</li>
                                      <li>Consultoria baseada em análise de valorização de mercado.</li>
                                      <li>Expertise em leilões e oportunidades off-market.</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <textarea 
                              className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 resize-none" 
                              placeholder="Descreva suas habilidades únicas..." 
                              rows={2}
                              value={briefingData.differential}
                              onChange={e => setBriefingData(prev => ({ ...prev, differential: e.target.value }))}
                            ></textarea>
                          </div>
                          <div className="flex flex-col gap-2 text-left">
                            <div className="flex items-center gap-2">
                              <label className="text-slate-700 dark:text-slate-300 font-medium text-sm text-left">6. Por que um cliente deveria escolher você?</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">help</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                  <div className="space-y-2 text-left">
                                    <h4 className="font-bold text-sm text-primary">Exemplos de Proposta de Valor:</h4>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                                      <li>Atendimento 24h e suporte total pós-venda.</li>
                                      <li>Mais de 100 famílias auxiliadas na região.</li>
                                      <li>Transparência radical em todas as etapas da negociação.</li>
                                      <li>Conexão direta com as maiores construtoras e investidores.</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <textarea 
                              className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 resize-none" 
                              placeholder="Sua proposta de valor para o cliente..." 
                              rows={2}
                              value={briefingData.valueProposition}
                              onChange={e => setBriefingData(prev => ({ ...prev, valueProposition: e.target.value }))}
                            ></textarea>
                          </div>
                        </div>
                        <footer className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                          <button onClick={() => setOnboardingStep(1)} className="text-slate-500 dark:text-slate-400 font-bold px-6 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            Voltar
                          </button>
                          <button onClick={() => setOnboardingStep(3)} className="bg-primary hover:brightness-105 text-slate-900 font-bold px-10 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                            Próximo
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </button>
                        </footer>
                      </div>
                    )}

                    {onboardingStep === 3 && (
                      <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="flex items-center justify-center size-8 bg-primary rounded-lg">
                              <span className="material-symbols-outlined text-slate-900 font-bold">rocket_launch</span>
                            </div>
                            <h2 className="text-lg font-bold leading-tight tracking-tight">Onboarding</h2>
                          </div>
                        </header>
                        <div className="flex flex-col gap-3 p-6 pb-2 shrink-0">
                          <div className="flex gap-6 justify-between items-end">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Passo 2 de 5</p>
                              <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Seu Trabalho</h1>
                            </div>
                            <p className="text-slate-900 dark:text-slate-100 text-sm font-bold">40%</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">
                          <section className="space-y-4 text-left">
                            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-semibold leading-snug">7. Quais serviços você oferece?</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {['Venda', 'Captação', 'Consultoria', 'Avaliação'].map((svc) => (
                                <label key={svc} className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/50 transition-colors">
                                  <input 
                                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent" 
                                    type="checkbox" 
                                    checked={briefingData.services.includes(svc)}
                                    onChange={() => toggleService(svc)}
                                  />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">{svc}</span>
                                </label>
                              ))}
                            </div>
                          </section>
                          <section className="space-y-4 text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-semibold leading-snug">8. Como funciona seu atendimento até o fechamento da venda?</h3>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">help</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                  <div className="space-y-2 text-left">
                                    <h4 className="font-bold text-sm text-primary">Exemplos de Processo:</h4>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                                      <li>Qualificação inicial e busca personalizada de imóveis.</li>
                                      <li>Visitas acompanhadas com análise técnica da região.</li>
                                      <li>Suporte na negociação e análise jurídica completa da documentação.</li>
                                      <li>Acompanhamento contínuo até o registro da escritura.</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <textarea 
                              className="w-full rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-transparent p-4 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-primary focus:ring-0 transition-colors" 
                              placeholder="Descreva brevemente seu processo..." 
                              rows={4}
                              value={briefingData.process}
                              onChange={e => setBriefingData(prev => ({ ...prev, process: e.target.value }))}
                            ></textarea>
                          </section>
                          <section className="space-y-4 pb-4 text-left">
                            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-semibold leading-snug">9. Você acompanha o cliente no pós-venda?</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                <input 
                                  className="h-5 w-5 border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent" 
                                  name="posvenda" 
                                  type="radio" 
                                  value="sim" 
                                  checked={briefingData.postSales === 'sim'}
                                  onChange={e => setBriefingData(prev => ({ ...prev, postSales: e.target.value }))}
                                />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Sim, acompanho</span>
                              </label>
                              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                <input 
                                  className="h-5 w-5 border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent" 
                                  name="posvenda" 
                                  type="radio" 
                                  value="nao" 
                                  checked={briefingData.postSales === 'nao'}
                                  onChange={e => setBriefingData(prev => ({ ...prev, postSales: e.target.value }))}
                                />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Não acompanho</span>
                              </label>
                            </div>
                          </section>
                        </div>
                        <footer className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                          <button onClick={() => setOnboardingStep(2)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            Voltar
                          </button>
                          <button onClick={() => setOnboardingStep(4)} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer">
                            Próximo
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                          </button>
                        </footer>
                      </div>
                    )}

                    {onboardingStep === 4 && (
                      <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="bg-primary p-2 rounded-lg text-slate-900">
                              <span className="material-symbols-outlined block text-2xl">verified_user</span>
                            </div>
                            <h2 className="text-lg font-bold leading-tight tracking-tight">Onboarding do Corretor</h2>
                          </div>
                        </header>
                        <div className="flex flex-col gap-3 p-6 pb-2 shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Passo 3 de 5</span>
                            <span className="text-sm font-bold text-primary">60%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: '60%' }}></div>
                          </div>
                          <p className="mt-4 text-2xl font-bold">Autoridade (Passo 3 de 5)</p>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">
                          <div className="space-y-3">
                            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 text-left">
                              10. Quantos imóveis já vendeu (aproximadamente)?
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">sell</span>
                              <input 
                                className="w-full pl-12 pr-4 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                                placeholder="Ex: 50" 
                                type="number"
                                value={briefingData.salesVolume}
                                onChange={e => setBriefingData(prev => ({ ...prev, salesVolume: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 text-left">
                              11. Possui certificações ou especializações?
                            </label>
                            <textarea 
                              className="w-full p-4 min-h-[120px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
                              placeholder="Liste suas principais certificações como CRECI, especializações em luxo, etc."
                              value={briefingData.certifications}
                              onChange={e => setBriefingData(prev => ({ ...prev, certifications: e.target.value }))}
                            ></textarea>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 text-left">
                              12. Tem depoimentos de clientes?
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <label className="relative flex items-center justify-center p-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:border-primary/50 transition-all group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <input 
                                  className="hidden peer" 
                                  name="testimonials" 
                                  type="radio" 
                                  value="sim"
                                  checked={briefingData.testimonials === 'sim'}
                                  onChange={e => setBriefingData(prev => ({ ...prev, testimonials: e.target.value }))}
                                />
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary">check_circle</span>
                                  <span className="font-medium">Sim</span>
                                </div>
                              </label>
                              <label className="relative flex items-center justify-center p-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:border-primary/50 transition-all group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <input 
                                  className="hidden peer" 
                                  name="testimonials" 
                                  type="radio" 
                                  value="nao" 
                                  checked={briefingData.testimonials === 'nao'}
                                  onChange={e => setBriefingData(prev => ({ ...prev, testimonials: e.target.value }))}
                                />
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary">cancel</span>
                                  <span className="font-medium">Não</span>
                                </div>
                              </label>
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 text-left">
                              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Se sim, cole um link (LinkedIn, Google My Business, etc)</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">link</span>
                                <input 
                                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none" 
                                  placeholder="https://g.page/seu-perfil/review" 
                                  type="url"
                                  value={briefingData.testimonialLink}
                                  onChange={e => setBriefingData(prev => ({ ...prev, testimonialLink: e.target.value }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <footer className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                          <button onClick={() => setOnboardingStep(3)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            Voltar
                          </button>
                          <button onClick={() => setOnboardingStep(5)} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer">
                            Próximo
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                          </button>
                        </footer>
                      </div>
                    )}

                    {onboardingStep === 5 && (
                      <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-slate-900 dark:text-primary">
                              <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Onboarding</h2>
                          </div>
                        </header>
                        <div className="flex flex-col gap-3 p-6 pb-2 shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Passo 4 de 5</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">80%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-2 rounded-full bg-primary" style={{ width: '80%' }}></div>
                          </div>
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-4 text-left">Posicionamento (Passo 4 de 5)</h1>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8 text-left">
                          <div className="space-y-4">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">13. Como você quer ser visto no mercado?</h3>
                            <div className="grid grid-cols-1 gap-3">
                              {['Especialista', 'Consultor', 'Corretor Premium', 'Outro'].map((pos) => (
                                <label key={pos} className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                  <input 
                                    className="h-5 w-5 border-2 border-slate-300 dark:border-slate-700 bg-transparent text-primary focus:ring-primary checked:border-primary" 
                                    name="market_position" 
                                    type="radio" 
                                    checked={briefingData.marketPosition === pos}
                                    onChange={() => setBriefingData(prev => ({ ...prev, marketPosition: pos }))}
                                  />
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{pos}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4 pb-4 text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">14. Qual seu maior ponto forte profissional?</h3>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">help</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                  <div className="space-y-2 text-left">
                                    <h4 className="font-bold text-sm text-primary">Exemplos de Pontos Fortes:</h4>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                                      <li>Especialista em fechamentos rápidos e decisivos.</li>
                                      <li>Grande rede de contatos com investidores estrangeiros.</li>
                                      <li>Domínio completo de técnicas de marketing digital imobiliário.</li>
                                      <li>Habilidade superior em mediar conflitos e negociações complexas.</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <textarea 
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-slate-100 outline-none transition-all" 
                              placeholder="Ex: Minha capacidade de negociação e atendimento personalizado..." 
                              rows={4}
                              value={briefingData.professionalStrength}
                              onChange={e => setBriefingData(prev => ({ ...prev, professionalStrength: e.target.value }))}
                            ></textarea>
                          </div>
                        </div>
                        <footer className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                          <button onClick={() => setOnboardingStep(4)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Voltar
                          </button>
                          <button onClick={() => setOnboardingStep(6)} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold text-sm hover:brightness-105 active:scale-95 transition-all shadow-sm cursor-pointer">
                            Próximo
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                          </button>
                        </footer>
                      </div>
                    )}

                    {onboardingStep === 6 && (
                      <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/20 text-slate-900 dark:text-slate-100">
                              <span className="material-symbols-outlined">assignment_turned_in</span>
                            </div>
                            <h2 className="text-lg font-bold leading-tight">Onboarding</h2>
                          </div>
                        </header>
                        <div className="flex flex-col gap-3 p-6 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 text-left">
                          <div className="flex gap-6 justify-between items-center">
                            <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Passo 5 de 5</p>
                            <p className="text-slate-900 dark:text-slate-100 text-sm font-bold">100%</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Finalizando seu perfil</p>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 p-6 text-left">
                          <div className="flex flex-col gap-2">
                            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Informações Finais</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Confirme seus dados de contato e credenciais profissionais para ativar sua conta.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Nome Completo */}
                            <div className="md:col-span-2">
                              <label className="flex flex-col gap-2">
                                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Nome Completo</span>
                                <div className="relative">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                                  <input 
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                    placeholder="Seu nome completo" 
                                    value={contactInfo.name}
                                    onChange={e => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                              </label>
                            </div>
                            {/* Email */}
                            <div className="md:col-span-2">
                              <label className="flex flex-col gap-2">
                                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Email Profissional</span>
                                <div className="relative">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                  <input 
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                    placeholder="exemplo@email.com" 
                                    type="email" 
                                    value={contactInfo.email}
                                    onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                                  />
                                </div>
                              </label>
                            </div>
                            {/* Telefone Comercial */}
                            <label className="flex flex-col gap-2">
                              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Telefone Comercial</span>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">call</span>
                                  <input 
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                    placeholder="(00) 0000-0000"
                                    value={contactInfo.phone}
                                    onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                                  />
                                </div>
                            </label>
                            {/* WhatsApp */}
                            <label className="flex flex-col gap-2">
                              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">WhatsApp</span>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">chat</span>
                                <input 
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                  placeholder="(00) 00000-0000"
                                  value={contactInfo.whatsapp}
                                  onChange={e => setContactInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                                />
                              </div>
                            </label>
                            {/* CRECI */}
                            <label className="flex flex-col gap-2">
                              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">CRECI</span>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">badge</span>
                                <input 
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                  placeholder="000000-F"
                                  value={contactInfo.creci}
                                  onChange={e => setContactInfo(prev => ({ ...prev, creci: e.target.value }))}
                                />
                              </div>
                            </label>
                            {/* Instagram */}
                            <label className="flex flex-col gap-2">
                              <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Instagram</span>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">photo_camera</span>
                                <input 
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                  placeholder="@usuario"
                                  value={contactInfo.instagram}
                                  onChange={e => setContactInfo(prev => ({ ...prev, instagram: e.target.value }))}
                                />
                              </div>
                            </label>
                          </div>
                        </div>
                        <footer className="flex items-center justify-between p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          {!isFinishing && (
                            <button onClick={() => setOnboardingStep(5)} className="flex items-center gap-2 px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-all ml-0 mr-auto">
                              <span className="material-symbols-outlined text-lg">arrow_back</span>
                              Voltar
                            </button>
                          )}
                          <button 
                            onClick={handleFinishOnboarding} 
                            disabled={isFinishing}
                            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-70 ml-auto"
                          >
                            {isFinishing ? (
                              <>
                                Gerando seu Site...
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                              </>
                            ) : (
                              <>
                                Finalizar Cadastro
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                              </>
                            )}
                          </button>
                        </footer>
                      </div>
                    )}

                    {onboardingStep === 7 && (
                      <div className="flex flex-col h-full bg-white relative animate-in fade-in zoom-in duration-500 overflow-hidden">
                        {/* Confetti Animation Background */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="absolute size-2 rounded-sm animate-fall"
                              style={{
                                backgroundColor: ['#c3e738', '#1a1a1a', '#e2e8f0', '#a3e635'][Math.floor(Math.random() * 4)],
                                left: `${Math.random() * 100}%`,
                                top: `-20px`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                                opacity: 0.6
                              }}
                            />
                          ))}
                        </div>

                        <div className="relative z-10 flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center gap-8">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-lg shadow-primary/20 animate-pop">
                            <svg className="h-10 w-10 text-slate-900" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                          </div>
                          
                          <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Parabéns!</h1>
                            <p className="text-slate-500 text-lg max-w-md mx-auto px-4">
                              Seu onboarding foi concluído com sucesso. Sua estrutura digital Oraora já está pronta para uso.
                            </p>
                          </div>

                          <div className="w-full max-w-md grid gap-4 text-left px-6 py-8 bg-slate-50/50 border-y border-slate-100">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <span className="material-symbols-outlined text-slate-900">verified</span>
                              </div>
                              <div className="text-left">
                                <h3 className="font-bold text-slate-900">Perfil Ativo</h3>
                                <p className="text-xs text-slate-500">Seus dados profissionais foram validados.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <span className="material-symbols-outlined text-slate-900">bolt</span>
                              </div>
                              <div className="text-left">
                                <h3 className="font-bold text-slate-900">Ferramentas Prontas</h3>
                                <p className="text-xs text-slate-500">Acesse seu dashboard e comece a vender.</p>
                              </div>
                            </div>
                          </div>

                          <Button asChild className="w-full max-w-md h-14 bg-primary hover:bg-primary-hover text-slate-900 font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                            <Link href="/dashboard">
                              Ir para o Dashboard
                              <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                          </Button>
                          
                          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                            Experiência Premium Oraora
                          </p>
                        </div>
                        
                        <style jsx>{`
                          @keyframes confetti-fall {
                            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                          }
                          .animate-fall {
                            animation: confetti-fall 3s linear infinite;
                          }
                          @keyframes celebrate-pop {
                            0% { transform: scale(0.8); opacity: 0; }
                            100% { transform: scale(1); opacity: 1; }
                          }
                          .animate-pop {
                            animation: celebrate-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                          }
                        `}</style>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <UserMenu />
          </div>
        </div>
      </div>
       <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-8 pb-32">
        {children}
      </main>
      <footer className="mt-auto border-t border-[#f2f5f0] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-text-secondary text-xs font-normal">© 2024 Oraora Tecnologia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/politica-de-privacidade">Privacidade</Link>
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/termos-de-uso">Termos de Uso</Link>
            <Link className="text-text-secondary text-xs font-medium hover:text-text-main transition-colors" href="/ajuda">Help</Link>
          </div>
        </div>
      </footer>
      {userProfile.userType === 'admin' && <AIChatWidget />}
    </OnboardingContext.Provider>
  );
}

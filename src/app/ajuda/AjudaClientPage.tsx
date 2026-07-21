'use client';

import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuthContext, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from 'firebase/auth';
import { useState, useEffect, Suspense } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { doc } from "firebase/firestore";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Wallet, 
  Network, 
  TrendingUp, 
  Sparkles,
  HelpCircle,
  Rocket,
  Search,
  Grid
} from 'lucide-react';

export default function AjudaClientPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ logoUrl?: string; footerSlogan?: string }>(siteContentRef);

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false);
    router.push(`/imoveis?${queryString}`);
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden w-full flex flex-col min-h-screen text-left">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
            <div className="flex items-center">
                <div className="lg:hidden">
                  {isClient && (
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main outline-none border-none bg-transparent cursor-pointer">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 flex flex-col bg-white">
                            <SheetHeader>
                              <VisuallyHidden>
                                <SheetTitle>Menu Principal</SheetTitle>
                                <SheetDescription>Navegue pelas seções do site ou acesse sua conta.</SheetDescription>
                              </VisuallyHidden>
                            </SheetHeader>
                            <div className="p-6 border-b">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-2 p-4 text-lg font-semibold text-left">
                                <Link href="/imoveis" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                                </Link>
                                <Link href="/corretor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Para Corretores
                                </Link>
                                <Link href="/sobre" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">info</span>Sobre
                                </Link>
                                <Link href="/contato" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">mail</span>Contato
                                </Link>
                                 <Link href="/ajuda" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">help</span>Ajuda
                                </Link>
                            </nav>
                            <div className="mt-auto p-6 space-y-4 border-t">
                                {user ? (
                                    <>
                                      <div className='flex items-center gap-3'>
                                        <Avatar>
                                          <AvatarImage src={user.photoURL || ''} />
                                          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                          <div className="text-left">
                                              <p className="text-sm font-bold text-foreground">{user.displayName}</p>
                                               <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                      </div>
                                      <Button asChild className="w-full h-12 text-base">
                                        <Link href={dashboardUrl}>Acessar Painel</Link>
                                      </Button>
                                       <Button variant="outline" className="w-full h-12 text-base" onClick={handleLogout}>Sair</Button>
                                    </>
                                ) : (
                                    <>
                                    <Button asChild variant="outline" className="w-full h-12 text-base">
                                        <Link href="/radar">
                                            <span className="material-symbols-outlined text-base mr-2">radar</span>
                                            Meu Radar
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full h-12 text-base">
                                        <Link href="/login">
                                           Sou Corretor
                                        </Link>
                                    </Button>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                  )}
                </div>
                <Link className="hidden lg:flex items-center gap-3" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                </Link>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link className="flex items-center gap-3 lg:hidden" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                </Link>
                <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                    <Link className="text-text-main transition hover:text-primary" href="/imoveis">Imóveis</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/corretor">Para Corretores</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/sobre">Sobre</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/contato">Contato</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/ajuda">Ajuda</Link>
                </nav>
            </div>

            <div className="flex items-center justify-end">
                <div className="hidden lg:flex items-center gap-2 md:gap-4">
                    {!isReady ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    ) : user && userProfile ? (
                        <div className="flex items-center gap-4">
                            <Button asChild>
                                <Link href={dashboardUrl} className='flex items-center gap-2'>
                                    <span className="material-symbols-outlined text-base">grid_view</span>
                                    Acessar Painel
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={handleLogout} className='flex items-center gap-2'>
                                <span className="material-symbols-outlined text-base">logout</span>
                                Sair
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-10 rounded-full px-6 transition">
                                <Link href="/login" className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                                    Corretor
                                </Link>
                            </Button>
                            <Button asChild className="h-10 rounded-full px-6 text-sm font-bold transition">
                                <Link href="/radar">
                                    <span className="material-symbols-outlined text-base mr-2">radar</span>
                                    Meu Radar
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 lg:hidden">
                  {isClient && (
                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main outline-none border-none bg-transparent cursor-pointer">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Busca de Imóveis</DialogTitle>
                                <DialogDescription>
                                    Utilize os filtros abaixo para encontrar o imóvel dos seus sonhos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                                    <SearchFilters onSearch={handleSearch} />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>
                  )}
                    <Link href="/radar" className="flex size-10 items-center justify-center text-text-main">
                        <span className="material-symbols-outlined">radar</span>
                    </Link>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-1 py-16 md:py-24 text-left bg-slate-50/50">
          <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-green-700 text-[10px] font-black uppercase tracking-widest mb-4">
                    Suporte & Documentação
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Central de <span className="text-primary italic">Ajuda</span></h1>
                  <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">Tudo o que você precisa saber para operar a plataforma e acelerar suas vendas no ecossistema Oraora.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Navegação Rápida Lateral */}
                  <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-32 h-fit text-left">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-3">Tópicos</p>
                        <a href="#primeiros-passos" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Rocket className="size-4" /> Início Rápido
                        </a>
                        <a href="#gestao-clientes" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Users className="size-4" /> Clientes
                        </a>
                        <a href="#gestao-imoveis" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Building2 className="size-4" /> Imóveis
                        </a>
                        <a href="#negocios" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Briefcase className="size-4" /> Negócios
                        </a>
                        <a href="#financeiro" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Wallet className="size-4" /> Financeiro
                        </a>
                        <a href="#rede-radar" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <Network className="size-4" /> Rede & Radar
                        </a>
                        <a href="#crescimento-site" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-primary transition-all">
                            <TrendingUp className="size-4" /> Crescimento
                        </a>
                    </div>
                  </aside>

                  <div className="lg:col-span-9 space-y-20">
                      
                      {/* Sessão 1: Início Rápido */}
                      <section id="primeiros-passos" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-slate-900">
                                <Rocket className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Primeiros Passos</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="onboarding" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Como funciona o Onboarding Inicial?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    O Onboarding é sua porta de entrada. Nele, você preenche um briefing detalhado sobre sua carreira. Nossa <strong>Inteligência Artificial</strong> utiliza esses dados para gerar automaticamente todo o conteúdo textual do seu site pessoal, desde a biografia até a descrição dos seus serviços, garantindo autoridade desde o primeiro minuto.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="ativacao" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">O que é a Academia Oraora?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Localizada no menu <strong>Crescimento &rsaquo; Academia Oraora</strong>, esta ferramenta monitora sua evolução na plataforma. Ela mostra quais etapas faltam para que seu ecossistema digital esteja 100% configurado (Logo, Cores, Imóveis e Oralink).
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 2: Gestão de Clientes */}
                      <section id="gestao-clientes" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                                <Users className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Clientes</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="funil" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Como utilizar o Funil de Vendas?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    O funil é um quadro Kanban onde você visualiza a saúde comercial do seu negócio. Você pode arrastar os cartões de clientes entre as etapas (Novos, Contato, Qualificados, etc). O sistema registra automaticamente o tempo que cada lead permanece em cada estágio para gerar métricas de performance.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="personas" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">O que são as Personas?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Personas são perfis ideais de investidores ou compradores. Ao vincular uma Persona a um cliente, você ativa o <strong>Match Engine do Radar</strong>. A plataforma passará a sugerir automaticamente imóveis da rede que combinam com os critérios técnicos (preço, bairro, quartos) daquela persona.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 3: Gestão de Imóveis */}
                      <section id="gestao-imoveis" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                <Building2 className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Imóveis</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="carteira" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Qual a diferença entre Minha Carteira e Meus Imóveis?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed text-left">
                                    <ul className="space-y-3 list-disc pl-4">
                                        <li><strong>Minha Carteira:</strong> São imóveis de construtoras parceiras que você selecionou como seus favoritos para exibir em destaque no seu site pessoal.</li>
                                        <li><strong>Meus Imóveis:</strong> São captações avulsas e exclusivas que você cadastrou manualmente no sistema.</li>
                                        <li><strong>Construtoras:</strong> Catálogo global de empreendimentos parceiros disponíveis para você vender.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 4: Negócios */}
                      <section id="negocios" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                                <Briefcase className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Negócios e Vendas</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="jornada" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Como funciona a Jornada de Venda?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    A Jornada é o dossiê vivo de uma negociação específica. Nela você centraliza documentos do cliente, registra propostas enviadas, acompanha o status do financiamento bancário e calcula sua comissão final. É o cérebro da sua operação de fechamento.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="agenda" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Gestão de Agenda</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Sincronize suas visitas, reuniões e tarefas em um só lugar. Você pode vincular cada evento a um cliente específico para manter o histórico de interações sempre atualizado.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 5: Financeiro */}
                      <section id="financeiro" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                                <Wallet className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestão Financeira</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="fluxo" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Controle de Fluxo de Caixa</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Registre todas as suas receitas (comissões recebidas ou previstas) e despesas (marketing, transporte, softwares). O sistema gera gráficos automáticos e permite que você defina metas mensais para acompanhar seu progresso.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 6: Rede e Radar */}
                      <section id="rede-radar" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-slate-900 rounded-xl flex items-center justify-center text-primary">
                                <Network className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Rede & Radar Inteligente</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="radar" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">O que é o Radar de Oportunidades?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    É a nossa ferramenta de <strong>Matchmaking</strong>. Ele cruza as necessidades dos seus clientes com os imóveis disponíveis em toda a rede Oraora. Quando houver um match de alta compatibilidade, você receberá um alerta para propor uma parceria.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="solicitacoes" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Como funcionam as Solicitações da Rede?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Se você tem um cliente com uma busca específica que não encontrou em lugar nenhum, você pode publicar uma "Solicitação na Rede". Toda a comunidade de corretores verá os critérios técnicos e poderá oferecer opções "off-market" diretamente para você.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                      {/* Sessão 7: Crescimento e Tecnologia */}
                      <section id="crescimento-site" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                <Sparkles className="size-5" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Crescimento e Tecnologia</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="oralink" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">O que é o Oralink?</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    É o seu cartão de visitas digital interativo. Ele centraliza seus links sociais, contatos e uma vitrine de imóveis. O Oralink gera um <strong>QR Code em alta definição</strong> que você pode imprimir, permitindo que o cliente acesse seu portfólio instantaneamente.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="mercado" className="border-none bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
                                <AccordionTrigger className="hover:no-underline font-bold text-slate-900 py-6 text-left">Inteligência de Mercado (IA)</AccordionTrigger>
                                <AccordionContent className="text-slate-500 pb-6 leading-relaxed">
                                    Nossa IA analisa relatórios oficiais de mercado para extrair preços médios por bairro e tendências de valorização. Você pode usar esses dados para gerar scripts de venda e provar matematicamente para o seu investidor o potencial do imóvel.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                      </section>

                  </div>
              </div>

              {/* Footer de Contato Direto */}
              <div className="mt-32 p-10 rounded-[3rem] bg-black text-white relative overflow-hidden text-center border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px]"></div>
                  <div className="relative z-10 max-w-2xl mx-auto">
                    <HelpCircle className="size-12 text-primary mx-auto mb-6" />
                    <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">Ainda tem dúvidas técnicas?</h3>
                    <p className="text-slate-400 mb-10 text-lg">Nosso time de suporte especializado está disponível para te ajudar a configurar sua operação.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild className="bg-primary text-black font-black h-14 px-10 rounded-2xl relative z-10 hover:scale-[1.02] transition-all border-none cursor-pointer">
                            <Link href="/dashboard/suporte/novo">Abrir Ticket de Suporte</Link>
                        </Button>
                        <Button asChild variant="outline" className="bg-white/5 text-white border-white/10 h-14 px-10 rounded-2xl relative z-10 hover:bg-white/10 transition-all">
                            <Link href="/contato">Falar com Consultor</Link>
                        </Button>
                    </div>
                  </div>
              </div>
          </div>
      </main>

      <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-8 w-auto" />
                    </div>
                    {isSiteDataLoading ? (
                      <div className="space-y-2 max-w-xs">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <div
                        className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: siteData?.footerSlogan || 'Conectando pessoas aos seus sonhos. A plataforma mais moderna para comprar, vender e alugar imóveis no Brasil.' }}
                      />
                    )}
                </div>
            </div>
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
            </div>
        </div>
      </footer>
      <WhatsAppWidget brokerId="oraora-main-site" />
    </div>
  );
}
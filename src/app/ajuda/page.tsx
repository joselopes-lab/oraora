
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
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { doc } from "firebase/firestore";


export default function HelpPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false); // Close the modal
    router.push(`/imoveis?${queryString}`);
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden w-full flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
            {/* Left side items */}
            <div className="flex items-center">
                 {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
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
                                    <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
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
                                          <div>
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
                </div>
                 {/* Desktop Logo */}
                <Link className="hidden lg:flex items-center gap-3" href="/">
                    <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                </Link>
            </div>

            {/* Center items */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Mobile Logo */}
                <Link className="flex items-center gap-3 lg:hidden" href="/">
                    <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                </Link>
                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                    <Link className="text-text-main transition hover:text-primary" href="/imoveis">Imóveis</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/corretor">Para Corretores</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/sobre">Sobre</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/contato">Contato</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/ajuda">Ajuda</Link>
                </nav>
            </div>

            {/* Right side items */}
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
                {/* Mobile Icons */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
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
                                <SearchFilters onSearch={handleSearch} />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Link href="/radar" className="flex size-10 items-center justify-center text-text-main">
                        <span className="material-symbols-outlined">radar</span>
                    </Link>
                </div>
            </div>
        </div>
      </header>
      <main>
        <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-28 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-white to-transparent dark:from-accent/10 dark:via-background dark:to-transparent"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-sm">
                support_agent
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Central de Suporte
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight mb-6 font-headline">
              Como podemos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-green-600">
                ajudar você
              </span>{" "}
              hoje?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto font-light">
              Encontre tutoriais, guias passo a passo e respostas para suas
              dúvidas sobre o Oraora.
            </p>
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-card rounded-2xl shadow-soft border border-border p-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <span className="material-symbols-outlined text-muted-foreground text-2xl ml-4">
                  search
                </span>
                <Input
                  className="w-full h-12 px-4 text-lg bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground outline-none"
                  placeholder="Busque por 'importar leads', 'configurar site'..."
                  type="text"
                />
                <Button className="h-10 px-6 rounded-xl font-bold text-sm">
                  Buscar
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <span className="text-gray-400">Sugestões:</span>
                <a
                  className="hover:text-primary underline decoration-primary/50"
                  href="#"
                >
                  Configurar Domínio
                </a>
                <a
                  className="hover:text-primary underline decoration-primary/50"
                  href="#"
                >
                  Integração WhatsApp
                </a>
                <a
                  className="hover:text-primary underline decoration-primary/50"
                  href="#"
                >
                  Planos
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-10">
              Navegue por tópicos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Primeiros Passos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Configure sua conta, complete seu perfil e comece a vender.
                  </p>
                </div>
              </Link>
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">domain</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Gestão de Imóveis
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Cadastro, edição de fotos, localização e status dos imóveis.
                  </p>
                </div>
              </Link>
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">contacts</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    CRM e Leads
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Funil de vendas, gestão de clientes e follow-up automático.
                  </p>
                </div>
              </Link>
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">web</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Meu Site
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Personalização de templates, domínio próprio e SEO.
                  </p>
                </div>
              </Link>
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">
                    integration_instructions
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Integrações
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Conecte com portais imobiliários, WhatsApp e Facebook.
                  </p>
                </div>
              </Link>
              <Link
                href="#"
                className="group p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Faturamento
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Gerencie sua assinatura, métodos de pagamento e notas fiscais.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-foreground mb-4 font-headline">
                Dúvidas Frequentes
              </h2>
              <p className="text-muted-foreground">
                Respostas rápidas para as perguntas mais comuns da nossa
                comunidade.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-all">
                <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                  Como faço para alterar minha senha?
                </AccordionTrigger>
                <AccordionContent className="pt-4 text-muted-foreground leading-relaxed text-sm">
                  Você pode alterar sua senha acessando{" "}
                  <strong>Configurações &gt; Perfil &gt; Segurança</strong>.
                  Caso tenha esquecido sua senha atual, utilize a opção "Esqueci
                  minha senha" na tela de login.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-all">
                <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                  Como importar meus leads de uma planilha?
                </AccordionTrigger>
                <AccordionContent className="pt-4 text-muted-foreground leading-relaxed text-sm">
                  Vá até a aba <strong>CRM &gt; Importar</strong>. Baixe nosso
                  modelo CSV padrão, preencha com seus dados e faça o upload. O
                  sistema fará a leitura automática e notificará quando a
                  importação estiver concluída.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-all">
                <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                  O Oraora funciona offline?
                </AccordionTrigger>
                <AccordionContent className="pt-4 text-muted-foreground leading-relaxed text-sm">
                  Atualmente o Oraora necessita de conexão com a internet
                  para sincronizar dados em tempo real e garantir que suas
                  informações estejam sempre atualizadas em todos os
                  dispositivos.
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="item-4" className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-all">
                <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                 Como funciona o cancelamento?
                </AccordionTrigger>
                <AccordionContent className="pt-4 text-muted-foreground leading-relaxed text-sm">
                 Você pode cancelar sua assinatura a qualquer momento através do painel financeiro. Não há multas de fidelidade e seu acesso permanecerá ativo até o fim do ciclo de cobrança vigente.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="py-24 bg-background relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.4] pointer-events-none dark:bg-grid-pattern-dark"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">
                Suporte Premium
              </span>
              <h2 className="text-3xl font-black text-foreground sm:text-4xl mb-4 font-headline">
                Ainda precisa de ajuda?
              </h2>
              <p className="text-lg text-muted-foreground">
                Nossa equipe de especialistas está pronta para resolver seu
                problema.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-muted/30 p-8 rounded-3xl border border-border text-center hover:border-primary transition-colors duration-300 relative group">
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-green-600">
                    Online
                  </span>
                </div>
                <div className="mx-auto size-16 rounded-full bg-card shadow-sm flex items-center justify-center mb-6 text-green-600">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Chat ao Vivo
                </h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Converse em tempo real com nosso suporte técnico. <br />
                  Seg-Sex, 08h às 18h.
                </p>
                <Button className="w-full h-12 rounded-xl font-bold text-sm">
                  Iniciar Conversa
                </Button>
              </div>
              <div className="bg-card p-8 rounded-3xl border border-border text-center hover:border-gray-300 transition-colors duration-300">
                <div className="mx-auto size-16 rounded-full bg-muted/50 flex items-center justify-center mb-6 text-muted-foreground">
                  <span className="material-symbols-outlined text-3xl">mail</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Abrir Ticket
                </h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Para questões mais complexas, envie um e-mail detalhado.
                  Respondemos em até 24h.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold text-sm"
                >
                  Enviar E-mail
                </Button>
              </div>
              <div className="bg-card p-8 rounded-3xl border border-border text-center hover:border-gray-300 transition-colors duration-300">
                <div className="mx-auto size-16 rounded-full bg-muted/50 flex items-center justify-center mb-6 text-muted-foreground">
                  <span className="material-symbols-outlined text-3xl">forum</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Comunidade
                </h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Troque experiências e tire dúvidas com outros corretores que
                  usam o Oraora.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold text-sm"
                >
                  Acessar Fórum
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                 <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-8 w-auto" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simplificando a vida do corretor imobiliário com tecnologia de
                ponta e suporte humanizado.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-6">Imóveis</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a className="hover:text-primary transition-colors" href="/imoveis">Comprar</a></li>
                <li><a className="hover:text-primary transition-colors" href="/imoveis">Lançamentos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-6">Institucional</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link className="hover:text-primary transition-colors" href="/sobre">Sobre</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/contato">Contato</Link></li>
                <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-6">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-primary transition-colors" href="/termos-de-uso">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">
                    Política de Privacidade
                  </Link>
                </li>
                 <li><a className="hover:text-primary transition-colors" href="#">Política de Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26
            </p>
            <div className="flex gap-6">
              <a
                className="text-gray-400 hover:text-primary transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined">mail</span>
              </a>
              <a
                className="text-gray-400 hover:text-primary transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined">language</span>
              </a>
              <a
                className="text-gray-400 hover:text-primary transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </a>
               <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200">
                <Link href="/login" className="flex items-center gap-2">
                    <span className="material-symbols-outlined">manage_accounts</span>
                    Área do corretor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

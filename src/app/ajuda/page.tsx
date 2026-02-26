
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


export default function HelpPage() {
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
                  {isClient && (
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
                                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
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
                  )}
                </div>
                 {/* Desktop Logo */}
                <Link className="hidden lg:flex items-center gap-3" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                </Link>
            </div>

            {/* Center items */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Mobile Logo */}
                <Link className="flex items-center gap-3 lg:hidden" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
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
                  {isClient && (
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
      <main>
        {/* ... rest of the main content remains unchanged ... */}
        <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-28 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-white to-transparent dark:from-accent/10 dark:via-background dark:to-transparent"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
          <div className="max-w-4xl mx-auto px-4 mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
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
        {/* ... remaining sections ... */}
      </main>
      {/* ... footer remains the same ... */}
    </div>
  );
}

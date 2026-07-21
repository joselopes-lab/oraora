'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import ImoveisPageContent from './ImoveisPageContent';
import { useAuthContext, useAuth, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { doc, collection, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Property = {
    id: string;
    localizacao: {
      estado: string;
    };
};

export default function ImoveisClientPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();
  const auth = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const firestore = useFirestore();
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
  );
  const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ logoUrl?: string, footerSlogan?: string }>(siteContentRef);

  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true)) : null),
    [firestore]
  );
  const { data: properties } = useCollection<Property>(propertiesQuery);

  const availableStates = useMemo(() => {
    if (!properties) return [];
    return Array.from(new Set(properties.map(p => p.localizacao.estado))).filter(Boolean);
  }, [properties]);

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };
  
  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false);
    router.push(`/imoveis?${queryString}`);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
            <div className="flex items-center">
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main outline-none">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 flex flex-col bg-white">
                            <SheetHeader>
                              <VisuallyHidden>
                                <SheetTitle>Menu Principal</SheetTitle>
                                <SheetDescription>Navegue pelas seções do site.</SheetDescription>
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
                            </nav>
                            <div className="mt-auto p-6 space-y-4 border-t">
                                {user ? (
                                    <>
                                      <div className='flex items-center gap-3 text-left'>
                                        <Avatar>
                                          <AvatarImage src={user.photoURL || ''} />
                                          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                          <div>
                                              <p className="text-sm font-bold text-foreground">{user.displayName}</p>
                                               <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                      </div>
                                      <Button asChild className="w-full h-12 text-base"><Link href={dashboardUrl}>Acessar Painel</Link></Button>
                                       <Button variant="outline" className="w-full h-12 text-base" onClick={handleLogout}>Sair</Button>
                                    </>
                                ) : (
                                    <>
                                    <Button asChild variant="outline" className="w-full h-12 text-base"><Link href="/radar"><span className="material-symbols-outlined text-base mr-2">radar</span> Meu Radar</Link></Button>
                                    <Button asChild className="w-full h-12 text-base"><Link href="/login">Sou Corretor</Link></Button>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
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
                            <Button asChild><Link href={dashboardUrl} className='flex items-center gap-2'><span className="material-symbols-outlined text-base">grid_view</span> Acessar Painel</Link></Button>
                            <Button variant="outline" onClick={handleLogout} className='flex items-center gap-2'><span className="material-symbols-outlined text-base">logout</span> Sair</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-10 rounded-full px-6 transition">
                                <Link href="/login" className="flex items-center gap-2"><span className="material-symbols-outlined text-base">manage_accounts</span> Corretor</Link>
                            </Button>
                            <Button asChild className="h-10 rounded-full px-6 text-sm font-bold transition">
                                <Link href="/radar"><span className="material-symbols-outlined text-base mr-2">radar</span> Meu Radar</Link>
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 lg:hidden">
                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main outline-none">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Busca de Imóveis</DialogTitle>
                                <DialogDescription>Utilize os filtros abaixo para encontrar o imóvel dos seus sonhos.</DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                                    <SearchFilters onSearch={handleSearch} availableStates={availableStates} />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Link href="/radar" className="flex size-10 items-center justify-center text-text-main"><span className="material-symbols-outlined">radar</span></Link>
                </div>
            </div>
        </div>
      </header>
      <div className="flex flex-1">
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><p>Carregando catálogo...</p></div>}>
          <ImoveisPageContent />
        </Suspense>
      </div>
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
    </div>
  );
}

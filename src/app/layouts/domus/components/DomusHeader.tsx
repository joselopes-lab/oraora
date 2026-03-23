'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import SearchFilters from '@/components/SearchFilters';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Broker = {
  brandName: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  creci?: string;
  homepage?: {
    ctaButtonText?: string;
    ctaButtonBgColor?: string;
    ctaButtonTextColor?: string;
    ctaButtonIcon?: string;
  }
};

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function DomusHeader({ broker }: { broker: Broker }) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false); // Fecha o modal
    router.push(`/sites/${broker.slug}/search?${queryString}`);
  };

  const ctaText = broker.homepage?.ctaButtonText || 'Fale Conosco';
  const ctaBgColor = broker.homepage?.ctaButtonBgColor ? hslToHex(broker.homepage.ctaButtonBgColor) : (broker.primaryColor ? hslToHex(broker.primaryColor) : '#8cf91f');
  const ctaTextColor = broker.homepage?.ctaButtonTextColor ? hslToHex(broker.homepage.ctaButtonTextColor) : (broker.secondaryColor ? hslToHex(broker.secondaryColor) : '#000000');
  const ctaIcon = broker.homepage?.ctaButtonIcon || 'chat_bubble';

  const dynamicSheetStyles: React.CSSProperties = {
    '--primary': broker.primaryColor || '111 89% 50%',
    '--ring': broker.primaryColor || '111 89% 50%',
  } as React.CSSProperties;

  return (
    <header className="sticky top-0 z-50 w-full glass-header h-16 flex items-center shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/sites/${broker.slug}`} className="flex items-center gap-3 group cursor-pointer">
            {broker.logoUrl ? (
              <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain" style={{ width: 'auto' }} />
            ) : (
              <>
                <div className="size-8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">architecture</span>
                </div>
                <h2 className="text-[#161811] dark:text-white text-lg font-semibold tracking-tighter uppercase">{broker.brandName}</h2>
              </>
            )}
          </Link>
          {broker.creci && (
            <div className="hidden lg:block border-l border-black/10 dark:border-white/10 pl-4 ml-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRECI: {broker.creci}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-10">
          <nav className="hidden md:flex items-center gap-8">
            <Link className="nav-link" href={`/sites/${broker.slug}`}>Início</Link>
            <Link className="nav-link" href={`/sites/${broker.slug}/search`}>Imóveis</Link>
            <Link className="nav-link" href={`/sites/${broker.slug}/explorar-no-mapa`}>Explorar no Mapa</Link>
            <Link className="nav-link" href={`/sites/${broker.slug}/sobre`}>Sobre</Link>
            <Link className="nav-link" href={`/sites/${broker.slug}/fale-conosco`}>Contato</Link>
          </nav>
          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-6">
            {isMounted ? (
              <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors cursor-pointer outline-none">
                    <span className="material-symbols-outlined text-[22px]">search</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Busca de Imóveis</DialogTitle>
                    <DialogDescription>
                      Utilize os filtros abaixo para encontrar o imóvel ideal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <SearchFilters onSearch={handleSearch} />
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <button className="flex items-center justify-center text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors cursor-pointer outline-none">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
            )}
            
            <Link 
                href={`/sites/${broker.slug}/fale-conosco`} 
                className="hidden sm:flex items-center justify-center gap-2 rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-lg transition-all"
                style={{ 
                    backgroundColor: ctaBgColor, 
                    color: ctaTextColor,
                    boxShadow: `0 4px 15px -5px ${ctaBgColor}BF`
                }}
            >
              <span className="material-symbols-outlined text-lg">{ctaIcon}</span>
              {ctaText}
            </Link>

            <div className="md:hidden flex items-center gap-3">
              {isMounted && (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-white/5 text-text-main dark:text-white outline-none">
                      <span className="material-symbols-outlined">menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent style={dynamicSheetStyles} side="right" className="p-0 flex flex-col bg-white dark:bg-background-dark border-l border-slate-100 dark:border-white/5">
                      <SheetHeader className="p-6 border-b border-slate-100 dark:border-white/5">
                        <VisuallyHidden>
                            <SheetTitle>Menu Principal</SheetTitle>
                            <SheetDescription>Navegue pelas seções do site.</SheetDescription>
                        </VisuallyHidden>
                        <Link href={`/sites/${broker.slug}`} onClick={() => setIsMobileMenuOpen(false)}>
                            {broker.logoUrl ? (
                              <Image src={broker.logoUrl} alt="Logo" width={120} height={30} className="h-[30px] w-auto object-contain" />
                            ) : (
                              <h2 className="text-xl font-bold uppercase tracking-tighter">{broker.brandName}</h2>
                            )}
                        </Link>
                      </SheetHeader>
                      <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
                          <Link href={`/sites/${broker.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined">home</span>Início
                          </Link>
                           <Link href={`/sites/${broker.slug}/search`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                          </Link>
                          <Link href={`/sites/${broker.slug}/explorar-no-mapa`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined">map</span>Explorar no Mapa
                          </Link>
                          <Link href={`/sites/${broker.slug}/sobre`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined">badge</span>Sobre
                          </Link>
                          <Link href={`/sites/${broker.slug}/fale-conosco`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined">mail</span>Contato
                          </Link>
                      </nav>
                      <div className="mt-auto p-6 space-y-4 border-t border-slate-100 dark:border-white/5">
                          <Button
                            asChild
                            className="w-full h-12 text-base font-bold rounded-xl"
                            style={{
                              backgroundColor: ctaBgColor,
                              color: ctaTextColor
                            }}
                          >
                            <Link href={`/sites/${broker.slug}/fale-conosco`} onClick={() => setIsMobileMenuOpen(false)}>
                              <span className="material-symbols-outlined mr-2">{ctaIcon}</span>
                              {ctaText}
                            </Link>
                          </Button>
                      </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

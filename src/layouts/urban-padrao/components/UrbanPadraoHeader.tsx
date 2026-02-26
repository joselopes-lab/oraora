'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  slug: string;
  primaryColor?: string;
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
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);

    const sNormalized = s / 100;
    const lNormalized = l / 100;

    const a = sNormalized * Math.min(lNormalized, 1 - lNormalized);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = lNormalized - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function UrbanPadraoHeader({ broker }: { broker: Broker }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinkClasses = (path: string) =>
    cn(
      "text-sm font-medium transition-colors",
      pathname === path
        ? "text-secondary font-bold border-b-2 border-secondary pb-1"
        : "text-text-main hover:text-secondary"
    );

  const ctaText = broker.homepage?.ctaButtonText || 'Fale Comigo';
  const ctaBgColor = broker.homepage?.ctaButtonBgColor ? hslToHex(broker.homepage.ctaButtonBgColor) : (broker.primaryColor ? hslToHex(broker.primaryColor) : '#8cf91f');
  const ctaTextColor = broker.homepage?.ctaButtonTextColor ? hslToHex(broker.homepage.ctaButtonTextColor) : '#000000';
  const ctaIcon = broker.homepage?.ctaButtonIcon || 'chat_bubble';
  
  const dynamicSheetStyles: React.CSSProperties = {
    '--primary': broker.primaryColor || '111 89% 50%',
    '--ring': broker.primaryColor || '111 89% 50%',
  } as React.CSSProperties;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#f0f2f4]">
      <div className="layout-container flex h-full flex-col mx-auto max-w-[1280px]">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3 text-text-main hover:opacity-80 transition-opacity cursor-pointer">
            <Link href={`/sites/${broker.slug}`} className="flex items-center gap-3">
              {broker.logoUrl ? (
                <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain rounded-lg" style={{ width: 'auto' }} />
              ) : (
                <Image src={defaultLogo || ""} alt="Logo" width={120} height={30} className="h-10 w-auto" style={{ width: 'auto' }} />
              )}
            </Link>
            {broker.creci && <div className="hidden lg:block border-l border-gray-200 pl-4 ml-1"><p className="text-xs font-semibold text-text-muted">CRECI: {broker.creci}</p></div>}
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <Link className={navLinkClasses(`/sites/${broker.slug}`)} href={`/sites/${broker.slug}`}>Início</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/search`)} href={`/sites/${broker.slug}/search`}>Imóveis</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/explorar-no-mapa`)} href={`/sites/${broker.slug}/explorar-no-mapa`}>Explorar no Mapa</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/servicos`)} href={`/sites/${broker.slug}/servicos`}>Serviços</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/sobre`)} href={`/sites/${broker.slug}/sobre`}>Sobre Mim</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center justify-center h-10 px-6 rounded-full border border-[#e5e7eb] hover:bg-gray-50 transition-colors text-sm font-semibold">
              Login
            </button>
            <Link href={`/sites/${broker.slug}/fale-conosco`} 
                className="hidden lg:flex items-center justify-center h-10 px-6 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105"
                style={{ 
                    backgroundColor: ctaBgColor, 
                    color: ctaTextColor,
                    boxShadow: `0 4px 15px -5px ${ctaBgColor}BF`
                }}
            >
              <span className="mr-2">{ctaText}</span>
              <span className="material-symbols-outlined text-[18px]">{ctaIcon}</span>
            </Link>

            <div className="lg:hidden flex items-center gap-2">
              <Link 
                  href={`/sites/${broker.slug}/fale-conosco`} 
                  className="flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold shadow-lg transition-all"
                  style={{ 
                      backgroundColor: ctaBgColor, 
                      color: ctaTextColor,
                      boxShadow: `0 4px 15px -5px ${ctaBgColor}BF`
                  }}
              >
                <span className="material-symbols-outlined text-[20px]">{ctaIcon}</span>
              </Link>
              {isClient && (
               <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-text-main">
                      <span className="material-symbols-outlined">menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent style={dynamicSheetStyles} side="right" className="p-0 flex flex-col bg-white">
                      <SheetHeader className="p-6 border-b">
                        <VisuallyHidden>
                            <SheetTitle>Menu Principal</SheetTitle>
                            <SheetDescription>Navegue pelas seções do site.</SheetDescription>
                        </VisuallyHidden>
                        <Link href={`/sites/${broker.slug}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Image src={broker.logoUrl || defaultLogo || ""} alt="Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                        </Link>
                      </SheetHeader>
                      <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
                          <Link href={`/sites/${broker.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">home</span>Início
                          </Link>
                           <Link href={`/sites/${broker.slug}/search`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                          </Link>
                          <Link href={`/sites/${broker.slug}/explorar-no-mapa`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">map</span>Mapa
                          </Link>
                          <Link href={`/sites/${broker.slug}/servicos`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">concierge</span>Serviços
                          </Link>
                          <Link href={`/sites/${broker.slug}/sobre`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">badge</span>Sobre Mim
                          </Link>
                      </nav>
                      <div className="mt-auto p-6 space-y-4 border-t">
                          <Button
                            asChild
                            className="w-full h-12 text-base font-bold"
                            style={{
                              backgroundColor: ctaBgColor,
                              color: ctaTextColor
                            }}
                          >
                            <Link href={`/sites/${broker.slug}/fale-conosco`}>
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

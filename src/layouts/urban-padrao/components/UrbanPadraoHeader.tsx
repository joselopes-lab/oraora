'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useNavigation } from '@/lib/navigation/navigationService';

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
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        const channel = Math.round(255 * color);
        const hex = channel.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function UrbanPadraoHeader({ broker }: { broker: Broker }) {
  const pathname = usePathname();
  const nav = useNavigation(broker.slug);
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
        <div className="flex items-center justify-between px-6 py-2 lg:px-10 h-20 md:h-28 text-left">
          <div className="flex items-center gap-3 text-text-main hover:opacity-80 transition-opacity cursor-pointer h-full">
            <Link href={nav.home()} className="flex items-center h-full">
              {broker.logoUrl ? (
                <Image 
                  src={broker.logoUrl} 
                  alt={`Logo de ${broker.brandName}`} 
                  width={800} 
                  height={200} 
                  className="h-auto max-h-[35px] md:max-h-[50px] w-auto object-contain object-left" 
                  style={{ width: 'auto', height: 'auto' }} 
                  priority 
                />
              ) : (
                <Image 
                  src={defaultLogo || ""} 
                  alt="Logo" 
                  width={400} 
                  height={150} 
                  className="h-auto max-h-[35px] md:max-h-[45px] w-auto object-contain object-left" 
                  style={{ width: 'auto', height: 'auto' }} 
                  priority 
                />
              )}
            </Link>
            {broker.creci && <div className="hidden lg:block border-l border-gray-200 pl-4 ml-1"><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">CRECI: {broker.creci}</p></div>}
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <Link className={navLinkClasses(nav.home())} href={nav.home()}>Início</Link>
            <Link className={navLinkClasses(nav.search())} href={nav.search()}>Imóveis</Link>
            <Link className={navLinkClasses(nav.map())} href={nav.map()}>Explorar no Mapa</Link>
            <Link className={navLinkClasses(nav.services())} href={nav.services()}>Serviços</Link>
            <Link className={navLinkClasses(nav.about())} href={nav.about()}>Sobre Mim</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:flex items-center justify-center h-10 px-6 rounded-full border border-[#e5e7eb] hover:bg-gray-50 transition-colors text-sm font-semibold">
              Login
            </Link>
            <Link href={nav.contact()} 
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
                  href={nav.contact()} 
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
                  <SheetContent style={dynamicSheetStyles} side="right" className="p-0 flex flex-col bg-white text-left">
                      <SheetHeader className="p-6 border-b text-left">
                        <span className="sr-only">
                            <SheetTitle>Menu Principal</SheetTitle>
                            <SheetDescription>Navegue pelas seções do site.</SheetDescription>
                        </span>
                        <Link href={nav.home()} onClick={() => setIsMobileMenuOpen(false)}>
                            <Image src={broker.logoUrl || defaultLogo || ""} alt="Logo" width={160} height={40} className="h-[30px] w-auto object-contain" style={{ width: 'auto' }} />
                        </Link>
                      </SheetHeader>
                      <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
                          <Link href={nav.home()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">home</span>Início
                          </Link>
                           <Link href={nav.search()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                          </Link>
                          <Link href={nav.map()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">map</span>Mapa
                          </Link>
                          <Link href={nav.services()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined">concierge</span>Serviços
                          </Link>
                          <Link href={nav.about()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
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
                            <Link href={nav.contact()} onClick={() => setIsMobileMenuOpen(false)}>
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

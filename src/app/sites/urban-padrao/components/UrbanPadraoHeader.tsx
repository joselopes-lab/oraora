
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  slug: string;
};

export function UrbanPadraoHeader({ broker }: { broker: Broker }) {
  const pathname = usePathname();

  const navLinkClasses = (path: string) =>
    cn(
      "text-sm font-medium transition-colors",
      pathname === path
        ? "text-secondary font-bold border-b-2 border-secondary pb-1"
        : "hover:text-secondary"
    );


  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#f0f2f4]">
      <div className="layout-container flex h-full flex-col mx-auto max-w-[1280px]">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3 text-text-main hover:opacity-80 transition-opacity cursor-pointer">
            <Link href={`/sites/${broker.slug}`} className="flex items-center gap-3">
              {broker.logoUrl ? (
                <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={40} height={40} className="h-10 w-auto object-contain rounded-lg" />
              ) : (
                <div className="flex items-center justify-center size-10 rounded-lg bg-black text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>real_estate_agent</span>
                </div>
              )}
              <h2 className="text-xl font-bold tracking-tight">{broker.brandName}</h2>
            </Link>
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <Link className={navLinkClasses(`/sites/${broker.slug}`)} href={`/sites/${broker.slug}`}>Início</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/search`)} href={`/sites/${broker.slug}/search`}>Imóveis</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/servicos`)} href={`/sites/${broker.slug}/servicos`}>Serviços</Link>
            <Link className={navLinkClasses(`/sites/${broker.slug}/sobre`)} href={`/sites/${broker.slug}/sobre`}>Sobre Mim</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center justify-center h-10 px-6 rounded-full border border-[#e5e7eb] hover:bg-gray-50 transition-colors text-sm font-semibold">
              Login
            </button>
            <Link href={`/sites/${broker.slug}/fale-conosco`} className="flex items-center justify-center h-10 px-6 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105">
              <span className="mr-2">Fale Comigo</span>
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

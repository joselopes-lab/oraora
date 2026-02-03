'use client';
import Link from 'next/link';
import Image from 'next/image';

type Broker = {
  brandName: string;
  slug: string;
  logoUrl?: string;
};

export function DomusHeader({ broker }: { broker: Broker }) {
  return (
    <header className="sticky top-0 z-50 w-full glass-header h-16 flex items-center shadow-sm">
      <div className="max-w-[1280px] mx-auto px-6 w-full flex items-center justify-between">
        <Link href={`/sites/${broker.slug}`} className="flex items-center gap-3 group cursor-pointer">
          {broker.logoUrl ? (
            <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain" />
          ) : (
            <>
              <div className="size-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">architecture</span>
              </div>
              <h2 className="text-[#161811] dark:text-white text-lg font-semibold tracking-tighter uppercase">{broker.brandName}</h2>
            </>
          )}
        </Link>
        <div className="flex items-center gap-10">
          <nav className="hidden md:flex items-center gap-8">
            <a className="nav-link" href={`/sites/${broker.slug}`}>Início</a>
            <a className="nav-link" href="#">Imóveis</a>
            <a className="nav-link" href="#">Sobre</a>
            <a className="nav-link" href="#">Contato</a>
          </nav>
          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-6">
            <button className="flex items-center justify-center text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
            <button className="hidden sm:flex items-center justify-center gap-2 rounded-full h-10 px-6 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_rgba(195,231,56,0.4)] transition-all">
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              Fale Conosco
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

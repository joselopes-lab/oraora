'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import SearchFilters from '@/components/SearchFilters';

type Broker = {
  brandName: string;
  slug: string;
  logoUrl?: string;
  creci?: string;
};

export function DomusHeader({ broker }: { broker: Broker }) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false); // Fecha o modal
    router.push(`/sites/${broker.slug}/search?${queryString}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-header h-16 flex items-center shadow-sm">
      <div className="max-w-[1280px] mx-auto px-6 w-full flex items-center justify-between">
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
            <Link className="nav-link" href={`/sites/${broker.slug}/sobre`}>Sobre</Link>
            <Link className="nav-link" href={`/sites/${broker.slug}/fale-conosco`}>Contato</Link>
          </nav>
          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-6">
            <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center justify-center text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors cursor-pointer">
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
            <Link href={`/sites/${broker.slug}/fale-conosco`} className="hidden sm:flex items-center justify-center gap-2 rounded-full h-10 px-6 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_rgba(195,231,56,0.4)] transition-all">
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              Fale Conosco
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

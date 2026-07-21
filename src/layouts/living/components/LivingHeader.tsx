'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useNavigation } from '@/lib/navigation/navigationService';

type Broker = {
  brandName: string;
  slug: string;
  logoUrl?: string;
};

export function LivingHeader({ broker }: { broker: Broker }) {
  const nav = useNavigation(broker.slug);

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-black/30 backdrop-blur-md border-b border-white/10 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <Link href={nav.home()} className="flex items-center gap-3 group">
                {broker.logoUrl ? (
                <Image src={broker.logoUrl} alt={broker.brandName} width={120} height={40} className="h-10 w-auto object-contain" style={{ width: 'auto' }} />
                ) : (
                <span className="material-symbols-outlined text-primary text-3xl">home_work</span>
                )}
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link className="hover:text-white transition-colors" href={nav.home()}>Home</Link>
            <Link className="hover:text-white transition-colors" href={nav.about()}>Sobre</Link>
            <Link className="hover:text-white transition-colors" href={nav.search()}>Imóveis</Link>
            <Link className="hover:text-white transition-colors" href={nav.contact()}>Contato</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href={nav.search()} className="p-2 text-slate-300 hover:text-white">
              <span className="material-symbols-outlined">search</span>
            </Link>
            <Link className="bg-primary hover:bg-indigo-700 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2" href={nav.contact()}>
              <span className="material-symbols-outlined text-sm">add_circle</span>
                Fale Conosco
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

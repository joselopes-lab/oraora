'use client';
import Link from 'next/link';
import Image from 'next/image';

type Broker = {
  brandName: string;
  slug: string;
  logoUrl?: string;
};

export function LivingHeader({ broker }: { broker: Broker }) {
  // A simple header for now. Can be enhanced later.
  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            {broker.logoUrl ? (
              <Image src={broker.logoUrl} alt={broker.brandName} width={40} height={40} className="h-10 w-auto object-contain" />
            ) : (
              <span className="material-symbols-outlined text-primary text-3xl">home_work</span>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a className="hover:text-white transition-colors" href={`/sites/${broker.slug}`}>Home</a>
            <a className="hover:text-white transition-colors" href="#">Sobre</a>
            <a className="hover:text-white transition-colors" href={`/sites/${broker.slug}/search`}>Imóveis</a>
            <a className="hover:text-white transition-colors" href="#">Contato</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-300 hover:text-white">
              <span className="material-symbols-outlined">search</span>
            </button>
            <a className="bg-primary hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2" href="#">
              <span className="material-symbols-outlined text-sm">add_circle</span>
                    Add Property
                </a>
          </div>
        </div>
      </div>
    </header>
  );
}

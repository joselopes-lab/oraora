'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useNavigation } from '@/lib/navigation/navigationService';

type Broker = {
  brandName: string;
  footerSlogan?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  logoUrl?: string;
  slug: string;
};

export function LivingFooter({ broker }: { broker: Broker }) {
  const nav = useNavigation(broker.slug);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-24 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">home_work</span>
                <span className="text-2xl font-extrabold tracking-tight text-white">{broker.brandName}</span>
              </div>
              <p className="text-slate-400 mb-8 max-w-sm">
                {broker.footerSlogan || 'Conectando você aos melhores imóveis de luxo.'}
              </p>
              <div className="flex gap-4">
                {broker.instagramUrl && <a className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all" href={broker.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <span className="text-[10px] font-bold">IG</span>
                </a>}
                 {broker.linkedinUrl && <a className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all" href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <span className="text-[10px] font-bold">IN</span>
                </a>}
                 {broker.whatsappUrl && <a className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all" href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </a>}
              </div>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6">Explorar</h5>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link className="hover:text-primary transition-colors" href={nav.home()}>Início</Link></li>
                <li><Link className="hover:text-primary transition-colors" href={nav.search()}>Imóveis</Link></li>
                <li><Link className="hover:text-primary transition-colors" href={nav.about()}>Sobre Mim</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6">Categorias</h5>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link className="hover:text-primary transition-colors" href={nav.search('type=Apartamento')}>Apartamentos</Link></li>
                <li><Link className="hover:text-primary transition-colors" href={nav.search('type=Casa')}>Casas</Link></li>
                <li><Link className="hover:text-primary transition-colors" href={nav.search('type=Terreno')}>Lotes</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6">Contato</h5>
              <ul className="space-y-4 text-slate-400 text-sm">
                {broker.footerContactEmail && <li><a className="hover:text-primary transition-colors" href={`mailto:${broker.footerContactEmail}`}>{broker.footerContactEmail}</a></li>}
                {broker.footerContactPhone && <li><a className="hover:text-primary transition-colors" href={`tel:${broker.footerContactPhone}`}>{broker.footerContactPhone}</a></li>}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2025 {broker.brandName}. All rights reserved.</p>
            <div className="flex gap-8">
              <Link className="hover:text-primary" href={nav.terms()}>Termos</Link>
              <Link className="hover:text-primary" href={nav.privacy()}>Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
  );
}

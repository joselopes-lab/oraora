'use client';
import Image from 'next/image';
import Link from 'next/link';

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
};

export function LivingFooter({ broker }: { broker: Broker }) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-24 pb-12">
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
                  <span className="material-symbols-outlined text-sm">camera_alt</span>
                </a>}
                 {broker.linkedinUrl && <a className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all" href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <span className="text-xs font-bold">in</span>
                </a>}
                 {broker.whatsappUrl && <a className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all" href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </a>}
              </div>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6">Explore</h5>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a className="hover:text-primary transition-colors" href="#">Comprar</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Alugar</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Lançamentos</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Anunciar</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6">Sobre</h5>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a className="hover:text-primary transition-colors" href="#">Nossa História</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Nossos Corretores</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
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
            <p>© 2024 {broker.brandName}. All rights reserved.</p>
            <div className="flex gap-8">
              <Link className="hover:text-primary" href="/termos-de-uso">Termos</Link>
              <Link className="hover:text-primary" href="/politica-de-privacidade">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
  );
}

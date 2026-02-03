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

export function DomusFooter({ broker }: { broker: Broker }) {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-[#f3f4f0] dark:border-white/5 py-16">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {broker.logoUrl ? (
                <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-primary flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-background-dark text-lg font-bold">architecture</span>
                    </div>
                    <h2 className="text-[#161811] dark:text-white text-lg font-bold tracking-tight">{broker.brandName}</h2>
                </div>
              )}
            </div>
            <p className="text-[#161811]/60 dark:text-white/60 text-sm max-w-sm">
              {broker.footerSlogan || 'Conectando você aos melhores imóveis.'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#161811]/40 dark:text-white/40 uppercase tracking-widest mb-6">Contato</h4>
            <ul className="flex flex-col gap-3 text-sm">
              {broker.footerContactEmail && <li><a href={`mailto:${broker.footerContactEmail}`} className="text-[#161811]/80 dark:text-white/80 hover:text-primary transition-colors">{broker.footerContactEmail}</a></li>}
              {broker.footerContactPhone && <li><a href={`tel:${broker.footerContactPhone}`} className="text-[#161811]/80 dark:text-white/80 hover:text-primary transition-colors">{broker.footerContactPhone}</a></li>}
              {broker.footerContactAddress && <li className="text-[#161811]/60 dark:text-white/60">{broker.footerContactAddress}</li>}
            </ul>
          </div>
          <div>
             <h4 className="text-sm font-bold text-[#161811]/40 dark:text-white/40 uppercase tracking-widest mb-6">Siga-me</h4>
            <div className="flex gap-4">
              {broker.instagramUrl && <a href={broker.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors text-sm font-bold">Instagram</a>}
              {broker.linkedinUrl && <a href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors text-sm font-bold">LinkedIn</a>}
              {broker.whatsappUrl && <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[#161811]/60 dark:text-white/60 hover:text-primary transition-colors text-sm font-bold">WhatsApp</a>}
            </div>
          </div>
        </div>
        <div className="border-t border-[#f3f4f0] dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#161811]/40 dark:text-white/40 text-xs">© 2024 {broker.brandName}. Todos os direitos reservados. {broker.creci && `| ${broker.creci}`}</p>
          <div className="flex gap-6 text-xs font-medium text-[#161811]/60 dark:text-white/60">
            <Link className="hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link>
            <Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

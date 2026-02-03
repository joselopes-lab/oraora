
'use client';
import Link from 'next/link';
import Image from 'next/image';

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

export function UrbanPadraoFooter({ broker }: { broker: Broker }) {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-gray-800">
      <div className="layout-container max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
               {broker.logoUrl ? (
                <Image src={broker.logoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain rounded-lg" />
              ) : (
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded bg-primary text-black">
                        <span className="material-symbols-outlined text-lg">real_estate_agent</span>
                    </div>
                    <h3 className="text-xl font-bold">{broker.brandName}</h3>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {broker.footerSlogan || 'Excelência em imóveis de luxo. Transformando sonhos em realidade com segurança e sofisticação.'}
            </p>
            <div className="flex gap-4 mt-2">
              {broker.instagramUrl && <a href={broker.instagramUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all" aria-label="Instagram">
                <span className="text-xs font-bold">IG</span>
              </a>}
              {broker.linkedinUrl && <a href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all" aria-label="LinkedIn">
                <span className="text-xs font-bold">LI</span>
              </a>}
              {broker.whatsappUrl && <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all" aria-label="WhatsApp">
                <span className="text-xs font-bold">WA</span>
              </a>}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Links Rápidos</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link className="hover:text-primary transition-colors" href="#">Início</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Imóveis</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Lançamentos</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Sobre Mim</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Imóveis</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link className="hover:text-primary transition-colors" href="#">Apartamentos</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Casas de Condomínio</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Coberturas</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Terrenos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Contato</h4>
            <ul className="flex flex-col gap-3 text-gray-400 text-sm">
              {broker.footerContactEmail && <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                {broker.footerContactEmail}
              </li>}
              {broker.footerContactPhone && <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">phone</span>
                {broker.footerContactPhone}
              </li>}
              {broker.footerContactAddress && <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">pin_drop</span>
                {broker.footerContactAddress}
              </li>}
              {broker.creci && <li className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700">{broker.creci}</span>
              </li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2024 {broker.brandName}. Todos os direitos reservados.</p>
          <div className="flex gap-6 items-center">
            <Link className="hover:text-white transition-colors" href="#">Política de Privacidade</Link>
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors bg-gray-800 px-3 py-1.5 rounded-md">Acesso Restrito</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

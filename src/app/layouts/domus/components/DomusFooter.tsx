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
  const whatsappLink = broker.whatsappUrl ? broker.whatsappUrl.replace('wa.me.com.br', 'wa.me') : '#';

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
            <h4 className="text-sm font-bold text-[#161811]/40 dark:text-white/40 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <li><Link className="text-[#161811]/80 dark:text-white/80 hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link></li>
              <li><Link className="text-[#161811]/80 dark:text-white/80 hover:text-primary transition-colors" href="/politica-de-privacidade">Política de Privacidade</Link></li>
            </ul>
          </div>
          <div>
             <h4 className="text-sm font-bold text-[#161811]/40 dark:text-white/40 uppercase tracking-widest mb-6">Siga-me</h4>
            <div className="flex gap-4">
              {broker.instagramUrl && (
                <a 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:border-primary hover:text-black transition-all" 
                  href={broker.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {broker.linkedinUrl && (
                <a 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:border-primary hover:text-black transition-all" 
                  href={broker.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}
              {whatsappLink && (
                <a 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:border-primary hover:text-black transition-all" 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.234 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.588-1.48L.057 24zM12.02 2.14c-5.46 0-9.89 4.43-9.89 9.89 0 1.77.46 3.44 1.25 4.9L2.14 22l5.14-1.34c1.4.78 3.01 1.25 4.74 1.25h.01c5.46 0 9.89-4.43 9.89-9.89s-4.43-9.89-9.89-9.89zM12.02 20.28h-.01c-1.47 0-2.9-.39-4.18-1.09l-.3-.18-3.12.82.83-3.05-.2-.31c-.78-1.29-1.25-2.77-1.25-4.39 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.24 8.23zM16.48 18.06c-.3-.15-1.76-0.87-2.03-0.97s-.47-.15-.67 0.15-0.77 0.97-0.94 1.17s-0.34 0.22-0.64 0.070c-0.3-0.15-1.25-0.46-2.38-1.47s-1.74-2.28-1.95-2.67-0.05-0.61 0.12-0.81c0.15-0.17 0.33-0.45 0.5-0.66s0.33-0.33 0.5-0.55c0.17-0.22 0.08-0.42-0.04-0.57s-0.67-1.61-0.92-2.2c-0.25-0.59-0.5-0.51-0.69-0.52h-0.6c-0.19 0-0.49 0.07-0.74 0.37s-0.87 0.85-0.87 2.07 0.87 2.4 1 2.55c0.13 0.15 1.77 2.76 4.28 3.78 0.59 0.23 1.05 0.37 1.41 0.47 0.61 0.17 1.17 0.15 1.61 0.09 0.48-0.06 1.46-0.6 1.67-1.18s0.21-1.09 0.14-1.18-0.25-0.15-0.55-0.3z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-[#f3f4f0] dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <p className="text-[#161811]/40 dark:text-white/40 text-xs">© 2024 {broker.brandName}. Todos os direitos reservados. {broker.creci && `| ${broker.creci}`}</p>
            <div className="flex gap-6 text-xs font-medium text-[#161811]/60 dark:text-white/60">
              <Link className="hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link>
              <Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">Privacidade</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#161811]/40 dark:text-white/40 text-xs">
            <span>Criado por:</span>
            <a 
              href="https://6000-firebase-studio-1767094630353.cluster-l2bgochoazbomqgfmlhuvdvgiy.cloudworkstations.dev/corretor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image 
                src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" 
                alt="Oraora" 
                width={80} 
                height={20} 
                className="h-4 w-auto grayscale opacity-60 dark:invert" 
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

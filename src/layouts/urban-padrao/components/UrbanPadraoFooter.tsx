'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, doc, getDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type Broker = {
  id: string;
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
  footerLogoUrl?: string;
  slug: string;
};

type Property = {
  caracteristicasimovel: {
    tipo?: string;
  };
};

export function UrbanPadraoFooter({ broker }: { broker: Broker }) {
  const firestore = useFirestore();
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !broker.id) {
      setIsLoading(false);
      return;
    }

    const fetchTypes = async () => {
      setIsLoading(true);
      try {
        const allTypes = new Set<string>();

        // 1. Fetch from brokerProperties
        const brokerPropsQuery = query(collection(firestore, 'brokerProperties'), where('brokerId', '==', broker.id), where('isVisibleOnSite', '==', true));
        const brokerPropsSnap = await getDocs(brokerPropsQuery);
        brokerPropsSnap.forEach(doc => {
          const data = doc.data() as Property;
          if (data.caracteristicasimovel?.tipo) {
            allTypes.add(data.caracteristicasimovel.tipo);
          }
        });

        // 2. Fetch from portfolio
        const portfolioRef = doc(firestore, 'portfolios', broker.id);
        const portfolioSnap = await getDoc(portfolioRef);
        if (portfolioSnap.exists()) {
          const propertyIds = portfolioSnap.data()?.propertyIds || [];
          if (propertyIds.length > 0) {
            // Batching for 'in' query
            for (let i = 0; i < propertyIds.length; i += 30) {
              const batchIds = propertyIds.slice(i, i + 30);
              const portfolioPropsQuery = query(collection(firestore, 'properties'), where('__name__', 'in', batchIds), where('isVisibleOnSite', '==', true));
              const portfolioPropsSnap = await getDocs(portfolioPropsQuery);
              portfolioPropsSnap.forEach(doc => {
                const data = doc.data() as Property;
                if (data.caracteristicasimovel?.tipo) {
                  allTypes.add(data.caracteristicasimovel.tipo);
                }
              });
            }
          }
        }
        setPropertyTypes(Array.from(allTypes).sort());
      } catch(error) {
        console.error("Error fetching property types for footer:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypes();
  }, [firestore, broker.id]);


  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-gray-800">
      <div className="layout-container max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
               {broker.footerLogoUrl ? (
                <Image src={broker.footerLogoUrl} alt={`Logo de ${broker.brandName}`} width={160} height={40} className="h-10 w-auto object-contain" />
              ) : broker.logoUrl ? (
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>}
              {broker.linkedinUrl && <a href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>}
              {broker.whatsappUrl && <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all" aria-label="WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.234 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.588-1.48L.057 24zM12.02 2.14c-5.46 0-9.89 4.43-9.89 9.89 0 1.77.46 3.44 1.25 4.9L2.14 22l5.14-1.34c1.4.78 3.01 1.25 4.74 1.25h.01c5.46 0 9.89-4.43 9.89-9.89s-4.43-9.89-9.89-9.89zM12.02 20.28h-.01c-1.47 0-2.9-.39-4.18-1.09l-.3-.18-3.12.82.83-3.05-.2-.31c-.78-1.29-1.25-2.77-1.25-4.39 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.24 8.23zM16.48 18.06c-.3-.15-1.76-0.87-2.03-0.97s-.47-.15-.67 0.15-0.77 0.97-0.94 1.17-0.34 0.22-0.64 0.070c-0.3-0.15-1.25-0.46-2.38-1.47s-1.74-2.28-1.95-2.67-0.05-0.61 0.12-0.81c0.15-0.17 0.33-0.45 0.5-0.66s0.33-0.33 0.5-0.55c0.17-0.22 0.08-0.42-0.04-0.57s-0.67-1.61-0.92-2.2c-0.25-0.59-0.5-0.51-0.69-0.52h-0.6c-0.19 0-0.49 0.07-0.74 0.37s-0.87 0.85-0.87 2.07 0.87 2.4 1 2.55c0.13 0.15 1.77 2.76 4.28 3.78 0.59 0.23 1.05 0.37 1.41 0.47 0.61 0.17 1.17 0.15 1.61 0.09 0.48-0.06 1.46-0.6 1.67-1.18s0.21-1.09 0.14-1.18-0.25-0.15-0.55-0.3z"/></svg>
              </a>}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Links Rápidos</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}`}>Início</Link></li>
              <li><Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}/search`}>Imóveis</Link></li>
              <li><Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}/explorar-no-mapa`}>Explorar no Mapa</Link></li>
              <li><Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}/servicos`}>Serviços</Link></li>
              <li><Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}/sobre`}>Sobre Mim</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Imóveis</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              {isLoading ? (
                <li><span className="text-gray-500">Carregando...</span></li>
              ) : propertyTypes.length > 0 ? (
                propertyTypes.map(type => (
                  <li key={type}>
                    <Link className="hover:text-primary transition-colors" href={`/sites/${broker.slug}/search?type=${encodeURIComponent(type)}`}>
                      {type}s
                    </Link>
                  </li>
                ))
              ) : (
                <li><span className="text-gray-500">Nenhuma categoria.</span></li>
              )}
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
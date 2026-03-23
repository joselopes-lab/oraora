import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  slug: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  oralink?: {
    displayName?: string;
    bio?: string;
    profileImageUrl?: string;
    links: { id: string; title: string; url: string; active: boolean; icon?: string }[];
    showPropertyShowcase: boolean;
    featuredPropertyIds?: string[];
    videoUrl?: string;
    showVideo?: boolean;
    backgroundColor?: string;
    textColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    cardTextColor?: string;
    footerTextColor?: string;
    statusTagBgColor?: string;
    statusTagTextColor?: string;
  };
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    status: string;
  };
  midia: string[];
  localizacao: {
    bairro: string;
    cidade: string;
  };
};

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

async function getBrokerData(slug: string): Promise<Broker | null> {
  const { firestore } = initializeFirebase();
  const brokersRef = collection(firestore, 'brokers');
  const q = query(brokersRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const brokerDoc = querySnapshot.docs[0];
  return { id: brokerDoc.id, ...brokerDoc.data() } as Broker;
}

async function getFeaturedProperties(brokerId: string, featuredIds?: string[]): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const results: Property[] = [];
  
  if (featuredIds && featuredIds.length > 0) {
    const pRef = collection(firestore, 'properties');
    const pQuery = query(pRef, where('__name__', 'in', featuredIds));
    const pSnap = await getDocs(pQuery);
    pSnap.forEach(d => results.push({ id: d.id, ...d.data() } as Property));

    const bpRef = collection(firestore, 'brokerProperties');
    const bpQuery = query(bpRef, where('__name__', 'in', featuredIds));
    const bpSnap = await getDocs(bpQuery);
    bpSnap.forEach(d => {
        if (!results.find(r => r.id === d.id)) {
            results.push({ id: d.id, ...d.data() } as Property);
        }
    });
    return results.sort((a, b) => (featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id)));
  }
  return [];
}

export default async function OralinkPublicPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const broker = await getBrokerData(slug);

  if (!broker) notFound();

  const oralink = broker.oralink || {
    displayName: broker.brandName,
    bio: 'Consultoria imobiliária personalizada.',
    links: [],
    showPropertyShowcase: true,
    featuredPropertyIds: [],
    videoUrl: '',
    showVideo: false,
  };

  const properties = await getFeaturedProperties(broker.id, oralink.featuredPropertyIds);
  const activeLinks = (oralink.links || []).filter(l => l.active && l.title && l.url);

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const videoEmbedUrl = getYoutubeEmbedUrl(oralink.videoUrl);
  
  // Custom Colors
  const bgHex = oralink.backgroundColor ? hslToHex(oralink.backgroundColor) : (broker.backgroundColor ? hslToHex(broker.backgroundColor) : '#fcfdfa');
  const textHex = oralink.textColor ? hslToHex(oralink.textColor) : (broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811');
  const btnBgHex = oralink.buttonBgColor ? hslToHex(oralink.buttonBgColor) : (broker.primaryColor ? hslToHex(broker.primaryColor) : '#c3e738');
  const btnTextHex = oralink.buttonTextColor ? hslToHex(oralink.buttonTextColor) : (broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811');
  const cardTextHex = oralink.cardTextColor ? hslToHex(oralink.cardTextColor) : (broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811');
  const footerTextHex = oralink.footerTextColor ? hslToHex(oralink.footerTextColor) : (broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811');
  const tagBgHex = oralink.statusTagBgColor ? hslToHex(oralink.statusTagBgColor) : (broker.primaryColor ? hslToHex(broker.primaryColor) : '#c3e738');
  const tagTextHex = oralink.statusTagTextColor ? hslToHex(oralink.statusTagTextColor) : (broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811');

  const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ backgroundColor: bgHex, color: textHex }}>
      <div className="max-w-[480px] mx-auto min-h-screen flex flex-col items-center px-6 py-12">
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <div className="relative w-28 h-28 flex-shrink-0 rounded-full border-[5px] p-1 mb-6 shadow-xl overflow-hidden bg-gray-100" style={{ borderColor: btnBgHex }}>
            {oralink.profileImageUrl ? (
              <Image src={oralink.profileImageUrl} alt="Avatar" fill className="object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="material-symbols-outlined text-5xl">person</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{oralink.displayName}</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-xs">{oralink.bio}</p>
        </div>

        {oralink.showVideo && videoEmbedUrl && (
          <div className="w-full mb-10 rounded-[2rem] overflow-hidden shadow-2xl aspect-video bg-black relative border border-gray-100/10">
            <iframe src={videoEmbedUrl} className="absolute inset-0 w-full h-full" allowFullScreen />
          </div>
        )}

        <div className="w-full space-y-4 mb-16">
          {activeLinks.map(link => (
            <a 
              key={link.id} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full text-center py-5 px-6 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-all active:scale-95"
              style={{ backgroundColor: btnBgHex, color: btnTextHex }}
            >
              {link.icon && <span className="material-symbols-outlined text-[22px]">{link.icon}</span>}
              <span>{link.title}</span>
            </a>
          ))}
        </div>

        {oralink.showPropertyShowcase && properties.length > 0 && (
          <div className="w-full mb-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3" style={{ color: textHex + '80' }}>
              <div className="w-6 h-0.5" style={{ backgroundColor: btnBgHex }}></div>
              Imóveis em Destaque
            </h4>
            <div className="grid grid-cols-1 gap-6">
              {properties.map(prop => (
                <Link 
                  key={prop.id} 
                  href={`/sites/${broker.slug}/imovel/${prop.id}`}
                  className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-soft hover:shadow-lg transition-all group"
                >
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image src={prop.midia?.[0] || 'https://picsum.photos/seed/prop/400/200'} alt={prop.informacoesbasicas.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4">
                      <span className="backdrop-blur text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest" style={{ backgroundColor: tagBgHex, color: tagTextHex }}>{prop.informacoesbasicas.status}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h5 className="font-bold text-base uppercase truncate mb-1" style={{ color: cardTextHex }}>{prop.informacoesbasicas.nome}</h5>
                    <div className="flex justify-between items-center">
                      <p className="text-xs opacity-60" style={{ color: cardTextHex }}>{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                      <p className="text-sm font-black" style={{ color: btnBgHex }}>{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href={`/sites/${broker.slug}/search`} className="text-xs font-bold opacity-60 hover:opacity-100 underline underline-offset-4" style={{ color: textHex }}>Ver catálogo completo</Link>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-6 mb-12">
            {broker.instagramUrl && (
                <a href={broker.instagramUrl} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform border border-gray-100">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
            )}
            {broker.linkedinUrl && (
                <a href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform border border-gray-100">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
            )}
            {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-[#25D366] shadow-sm hover:scale-110 transition-transform border border-gray-100">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.234 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.588-1.48L.057 24zM12.02 2.14c-5.46 0-9.89 4.43-9.89 9.89 0 1.77.46 3.44 1.25 4.9L2.14 22l5.14-1.34c1.4.78 3.01 1.25 4.74 1.25h.01c5.46 0 9.89-4.43 9.89-9.89s-4.43-9.89-9.89-9.89zM12.02 20.28h-.01c-1.47 0-2.9-.39-4.18-1.09l-.3-.18-3.12.82.83-3.05-.2-.31c-.78-1.29-1.25-2.77-1.25-4.39 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.24 8.23zM16.48 18.06c-.3-.15-1.76-0.87-2.03-0.97s-.47-.15-.67 0.15-0.77 0.97-0.94 1.17s-0.34 0.22-0.64 0.070c-0.3-0.15-1.25-0.46-2.38-1.47s-1.74-2.28-1.95-2.67-0.05-0.61 0.12-0.81c0.15-0.17 0.33-0.45 0.5-0.66s0.33-0.33 0.5-0.55c0.17-0.22 0.08-0.42-0.04-0.57s-0.67-1.61-0.92-2.2c-0.25-0.59-0.5-0.51-0.69-0.52h-0.6c-0.19 0-0.49 0.07-0.74 0.37s-0.87 0.85-0.87 2.07 0.87 2.4 1 2.55c0.13 0.15 1.77 2.76 4.28 3.78 0.59 0.23 1.05 0.37 1.41 0.47 0.61 0.17 1.17 0.15 1.61 0.09 0.48-0.06 1.46-0.6 1.67-1.18s0.21-1.09 0.14-1.18-0.25-0.15-0.55-0.3z"/></svg>
                </a>
            )}
        </div>

        <footer className="mt-auto py-10 flex flex-col items-center gap-4 border-t border-gray-100 w-full opacity-60" style={{ borderColor: textHex + '20' }}>
          <Link href="/corretor" target="_blank" className="flex flex-col items-center gap-3 hover:opacity-100 transition-opacity">
            <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora" width={100} height={25} className="h-5 w-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: footerTextHex }}>Tecnologia para Corretores</p>
          </Link>
          <p className="text-[9px] font-medium" style={{ color: footerTextHex }}>© 2025 Oraora Tecnologia. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

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
  };
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
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

  const dynamicStyles = {
    '--background': broker.backgroundColor || '0 0% 100%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '90 20% 97%',
  } as React.CSSProperties;

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
  const primaryHex = broker.primaryColor ? hslToHex(broker.primaryColor) : '#c3e738';
  const secondaryHex = broker.secondaryColor ? hslToHex(broker.secondaryColor) : '#141811';
  const textHex = broker.foregroundColor ? hslToHex(broker.foregroundColor) : '#141811';

  return (
    <div style={dynamicStyles} className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans transition-colors duration-300">
      <div className="max-w-[480px] mx-auto min-h-screen flex flex-col items-center px-6 py-12">
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <div className="relative size-28 rounded-full border-[5px] p-1 mb-6 shadow-xl overflow-hidden bg-gray-100" style={{ borderColor: primaryHex }}>
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
          <div className="w-full mb-10 rounded-[2rem] overflow-hidden shadow-2xl aspect-video bg-black relative border border-gray-100">
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
              style={{ backgroundColor: secondaryHex, color: '#fff' }}
            >
              {link.icon && <span className="material-symbols-outlined text-[22px]">{link.icon}</span>}
              <span>{link.title}</span>
            </a>
          ))}
          <Link 
            href={`/sites/${broker.slug}/fale-conosco`}
            className="flex items-center justify-center gap-3 w-full text-center py-5 px-6 rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-wider"
            style={{ backgroundColor: primaryHex, color: '#000' }}
          >
            <span className="material-symbols-outlined text-[22px]">calendar_today</span>
            <span>Agendar Consultoria</span>
          </Link>
        </div>

        {oralink.showPropertyShowcase && properties.length > 0 && (
          <div className="w-full mb-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3" style={{ color: textHex + '80' }}>
              <div className="w-6 h-0.5" style={{ backgroundColor: primaryHex }}></div>
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
                      <span className="backdrop-blur text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest" style={{ backgroundColor: primaryHex + 'E6' }}>{prop.informacoesbasicas.status}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h5 className="font-bold text-base uppercase truncate mb-1">{prop.informacoesbasicas.nome}</h5>
                    <div className="flex justify-between items-center">
                      <p className="text-xs opacity-60">{prop.localizacao.bairro}, {prop.localizacao.cidade}</p>
                      <p className="text-sm font-black" style={{ color: primaryHex }}>{prop.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href={`/sites/${broker.slug}/search`} className="text-xs font-bold opacity-60 hover:opacity-100 underline underline-offset-4">Ver catálogo completo</Link>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-6 mb-12">
            {broker.instagramUrl && (
                <a href={broker.instagramUrl} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
            )}
            {broker.linkedinUrl && (
                <a href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
            )}
            {broker.whatsappUrl && (
                <a href={broker.whatsappUrl} target="_blank" rel="noopener noreferrer" className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{color: '#25D366'}}>chat</span>
                </a>
            )}
        </div>

        <footer className="mt-auto py-10 flex flex-col items-center gap-4 border-t border-gray-100 w-full opacity-60">
          <Link href="/corretor" target="_blank" className="flex flex-col items-center gap-3 hover:opacity-100 transition-opacity">
            <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora" width={100} height={25} className="h-5 w-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Tecnologia para Corretores</p>
          </Link>
          <p className="text-[9px] font-medium">© 2025 Oraora Tecnologia. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

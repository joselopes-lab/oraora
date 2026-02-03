'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { arrayRemove, arrayUnion, doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';


// Placeholder data - replace with actual data from your backend
const opportunities = [
  { id: 1, name: 'Skyline Residence', location: 'Vila Olímpia, São Paulo', match: '98%', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWzh6uISTMq88anhDplYoQR9S-h9IIvtfBbvNce2Kskusv9xuhdgJr2J6r3aO9fB2j_8kt_UlJodvBD9fIZzA0DFKC87gnZp_XcxMbh0f77Ut66PR-MQQvbZbfKAZ8ZteK8HOmS9GbvXri44rEfGR-015SoTGlKQJfxq1boNgqhHDeAzcy3aqE1VcY3JEBOJVGbhT_VYeYZm1-ozBAb7UnlwaUhJetPhk61LXnylxJi9N1uw8G5OYxze0-cO3JSOeLi-HC57e7IuE' },
  { id: 2, name: 'Garden Loft', location: 'Pinheiros, São Paulo', match: '96%', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRYD_IGoPsQpW41FUkxaIeILdEmAi12EUF_swNMlbEkmAd7LbeIsLggawy1nBzyUDrC5ZJ6etwDvH1Xzwghojd0Epge24uDZJun_2S_lyDqqSgF7R_ZI32l45brtpFds1x8DXFcX_x1Oca2nRS0K0RH-56nwhYRWH-n0lmxOnWbx1_FYhCz4gJrVb0pTQf5G8dMpDPIq4FUZoyIFOwFvRelgeN1G3AUVh4DfiCBWGvo3MVOoJei14hx18YyCnWW4P44WC3dWxquvQ' },
  { id: 3, name: 'Modern Tower', location: 'Itaim Bibi, São Paulo', match: '94%', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAez8FAz62gnWRMukKkxefz3lXSIMf97w_E6VD2OSmiOSSfzl-JZhpbMIgP9Y_9xWlfEtbnaDGiXwWbSRAbA0w0QaFBWn9_Cu7IYTuc_LehxoBc55qxNs7R7-V9aWXiLRb4uMBAXNYAW8fsJxc8Xn_YeFGBJ8mWq13sQkPEKd8NRElZbE7SVYWtBcMsb-umkP-OhzjA23WQ5PSX-qrJtYmdZUwQHbWAE_t6p1FWQwSiexQbwy3U-gC5VJt89RC8qw-QvG9Dp-R0QXg' },
];

type Property = {
    id: string;
    informacoesbasicas: {
      nome: string;
      status: string;
      valor?: number;
      descricao?: string;
    };
    localizacao: {
      bairro: string;
      cidade: string;
      estado: string;
    };
    midia: string[];
    caracteristicasimovel: {
      tipo: string;
      quartos?: string[];
      tamanho?: string;
      vagas?: string;
    };
};

type RadarList = {
  propertyIds: string[];
};

export default function RadarDashboardPage() {
    const { user } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const propertiesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'properties')) : null), [firestore]);
    const { data: properties, isLoading } = useCollection<Property>(propertiesQuery);

    const radarListDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'radarLists', user.uid) : null),
        [user, firestore]
    );

    const { data: radarList } = useDoc<RadarList>(radarListDocRef);
    const savedPropertyIds = radarList?.propertyIds || [];

    const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            router.push('/radar');
            return;
        }

        if (!firestore) return;

        const docRef = doc(firestore, 'radarLists', user.uid);
        
        if (savedPropertyIds.includes(propertyId)) {
            setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
            toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
        } else {
            setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
            toast({ title: "Adicionado ao Radar!", description: "O imóvel foi salvo na sua lista de oportunidades." });
        }
    };
    
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-neutral-dark">Olá, {user?.displayName?.split(' ')[0]}! 👋</h1>
                    <p className="text-gray-500">Encontramos novas oportunidades baseadas no seu perfil hoje.</p>
                </div>
                <div className="bg-neutral-light p-4 pr-6 rounded-2xl flex items-center gap-4 border border-gray-100">
                    <div className="size-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Seu Perfil Atual</div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-neutral-dark">Investidor Urbano</span>
                            <a className="text-xs font-bold text-primary bg-neutral-dark px-2 py-0.5 rounded hover:bg-black transition-colors" href="#">EDITAR</a>
                        </div>
                    </div>
                </div>
            </div>
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Novas Oportunidades
                    </h2>
                    <div className="flex gap-2">
                        <button className="size-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-neutral-light transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-neutral-light transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                    {opportunities.map(opp => (
                        <div key={opp.id} className="min-w-[340px] group relative bg-neutral-dark rounded-3xl overflow-hidden aspect-[16/10]">
                            <img alt="Property" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" src={opp.image} />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-transparent to-transparent"></div>
                            <div className="absolute top-4 left-4">
                                <span className="bg-primary text-neutral-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Compatibilidade: {opp.match}</span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="text-white font-bold text-lg mb-1">{opp.name}</div>
                                <div className="text-gray-300 text-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {opp.location}
                                </div>
                            </div>
                            <button className="absolute bottom-6 right-6 size-10 bg-primary rounded-full flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined text-neutral-dark">arrow_forward</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">Imóveis Recomendados</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Filtrar por:</span>
                        <select className="text-sm font-semibold border-none bg-neutral-light rounded-lg focus:ring-primary focus:ring-1 py-1 pr-8 pl-3">
                            <option>Maior Match</option>
                            <option>Menor Preço</option>
                            <option>Recentes</option>
                        </select>
                    </div>
                </div>
                 {isLoading ? (
                  <p>Carregando imóveis...</p>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   {properties?.map(rec => {
                     const isSaved = savedPropertyIds.includes(rec.id);
                     return (
                        <div key={rec.id} className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-soft transition-all duration-300">
                            <div className="relative aspect-square">
                                <img alt={rec.informacoesbasicas.nome} className="w-full h-full object-cover" src={rec.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/400'} />
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                     <button onClick={(e) => handleRadarClick(e, rec.id)} className={cn("size-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors shadow-sm", isSaved && "text-primary bg-primary/20")}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>radar</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <div className="bg-primary/90 backdrop-blur text-neutral-dark text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        90% MATCH
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-neutral-dark group-hover:text-primary transition-colors truncate">{rec.informacoesbasicas.nome}</h3>
                                    {rec.informacoesbasicas.valor && <span className="font-bold text-neutral-dark">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.informacoesbasicas.valor)}</span>}
                                </div>
                                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {rec.localizacao.bairro}, {rec.localizacao.cidade}
                                </p>
                                <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <span className="material-symbols-outlined text-[18px]">bed</span>
                                        <span className="text-xs font-medium">{rec.caracteristicasimovel.quartos?.join(', ')} Dorms</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <span className="material-symbols-outlined text-[18px]">straighten</span>
                                        <span className="text-xs font-medium">{rec.caracteristicasimovel.tamanho}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <span className="material-symbols-outlined text-[18px]">directions_car</span>
                                        <span className="text-xs font-medium">{rec.caracteristicasimovel.vagas} Vagas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                   )})}
                </div>
                )}
                <div className="mt-12 flex justify-center">
                    <button className="px-8 py-3 bg-neutral-dark text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center gap-2 group">
                        Carregar mais sugestões
                        <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
                    </button>
                </div>
            </section>
        </>
    )
}

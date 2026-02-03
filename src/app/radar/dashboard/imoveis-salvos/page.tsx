'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, arrayRemove } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

export default function SavedPropertiesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const radarListDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'radarLists', user.uid) : null),
        [user, firestore]
    );
    const { data: radarList, isLoading: isRadarListLoading } = useDoc<RadarList>(radarListDocRef);

    const propertyIds = radarList?.propertyIds || [];

    const propertiesQuery = useMemoFirebase(
        () => (firestore && propertyIds.length > 0 ? query(collection(firestore, 'properties'), where('__name__', 'in', propertyIds)) : null),
        [firestore, propertyIds]
    );
    
    const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);
    
    const isLoading = isRadarListLoading || arePropertiesLoading;

    const handleRemoveFromRadar = (e: React.MouseEvent, propertyId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || !firestore) return;

        const docRef = doc(firestore, 'radarLists', user.uid);
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Link className="hover:text-primary transition-colors" href="/radar/dashboard">Radar</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-neutral-dark">Imóveis Salvos</span>
                    </nav>
                    <h1 className="text-4xl font-bold tracking-tight text-neutral-dark">Meus Imóveis Salvos</h1>
                    <p className="text-gray-500 mt-2">Aqui estão os imóveis que você marcou como interessantes.</p>
                </div>
            </div>

            {isLoading && (
                <div className="text-center p-10">
                    <p>Carregando seus imóveis salvos...</p>
                </div>
            )}
            
            {!isLoading && (!properties || properties.length === 0) && (
                 <div className="text-center py-24 bg-neutral-light/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
                    <h3 className="text-xl font-bold mt-4">Nenhum imóvel salvo ainda</h3>
                    <p className="text-gray-500 mt-2">Navegue pelos imóveis e clique no ícone do Radar para salvá-los aqui.</p>
                    <Button asChild className="mt-6">
                        <Link href="/imoveis">Explorar Imóveis</Link>
                    </Button>
                </div>
            )}

            {!isLoading && properties && properties.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   {properties.map(rec => (
                        <div key={rec.id} className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-soft transition-all duration-300">
                            <div className="relative aspect-square">
                                <Image alt={rec.informacoesbasicas.nome} className="w-full h-full object-cover" src={rec.midia?.[0] || 'https://picsum.photos/seed/placeholder/400/400'} width={400} height={400} />
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                     <button onClick={(e) => handleRemoveFromRadar(e, rec.id)} className="size-9 bg-primary/20 backdrop-blur rounded-full flex items-center justify-center text-primary hover:bg-primary/30 transition-colors shadow-sm">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>radar</span>
                                    </button>
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
                   ))}
                </div>
            )}
        </div>
    );
}
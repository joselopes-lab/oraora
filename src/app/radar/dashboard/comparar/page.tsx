'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Updated types to include necessary fields from Firestore
type Property = {
    id: string;
    informacoesbasicas: {
        nome: string;
        status: string;
        valor?: number;
    };
    localizacao: {
        bairro: string;
    };
    midia: string[];
    caracteristicasimovel: {
        tamanho?: string;
        quartos?: string[];
        vagas?: string;
    };
};

type RadarList = {
  propertyIds: string[];
};


export default function ComparePage() {
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
        () => (firestore && propertyIds.length > 0 ? query(collection(firestore, 'properties'), where('__name__', 'in', propertyIds.slice(0, 10))) : null),
        [firestore, propertyIds]
    );
    
    const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);

    const isLoading = isRadarListLoading || arePropertiesLoading;

    const handleDelete = (propertyId: string) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, 'radarLists', user.uid);
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({
            title: "Imóvel Removido!",
            description: "O imóvel foi removido da sua lista de comparação.",
        });
    };

    const attributes = [
        { icon: 'straighten', label: 'Área Privativa' },
        { icon: 'bed', label: 'Dormitórios' },
        { icon: 'bathtub', label: 'Banheiros' },
        { icon: 'directions_car', label: 'Vagas' },
        { icon: 'location_on', label: 'Bairro' },
        { icon: 'bolt', label: 'Compatibilidade' }
    ];
    
    // We can only compare up to 3 properties + 1 empty slot.
    const propertiesToCompare = properties ? properties.slice(0, 3) : [];

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Link className="hover:text-primary transition-colors" href="/radar/dashboard">Radar</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-neutral-dark">Comparador</span>
                    </nav>
                    <h1 className="text-4xl font-bold tracking-tight text-neutral-dark">Comparar Imóveis</h1>
                </div>
                <Button className="px-6 py-3 bg-primary text-neutral-dark font-bold rounded-2xl hover:shadow-glow transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">print</span>
                    Imprimir Comparativo
                </Button>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-x-auto">
                {isLoading ? (
                    <div className="text-center p-20">Carregando imóveis salvos...</div>
                ) : (
                <div className="grid grid-cols-4 min-w-[1200px]">
                    <div className="col-span-1 border-r border-gray-50 flex flex-col">
                        <div className="h-[420px] p-8 flex flex-col justify-end">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-neutral-dark">Atributos</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Analise detalhadamente cada característica técnica dos imóveis selecionados.</p>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            {attributes.map(attr => (
                                <div key={attr.label} className="comparison-row h-16 flex items-center px-8 border-t border-gray-50">
                                    <div className={`flex items-center gap-3 text-gray-500 ${attr.icon === 'bolt' ? 'text-primary' : ''}`}>
                                        <span className="material-symbols-outlined text-lg">{attr.icon}</span>
                                        <span className={`text-sm font-semibold uppercase tracking-wider ${attr.icon === 'bolt' ? 'text-neutral-dark' : ''}`}>{attr.label}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="h-24 flex items-center px-8 border-t border-gray-50">
                            </div>
                        </div>
                    </div>
                    {propertiesToCompare.map(property => (
                        <div key={property.id} className="col-span-1 border-r border-gray-50">
                            <div className="p-6 h-[420px] flex flex-col">
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                                    <Image alt={property.informacoesbasicas.nome} className="w-full h-full object-cover" src={property.midia?.[0] || 'https://placehold.co/400x300'} fill />
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <button onClick={() => handleDelete(property.id)} className="size-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-dark mb-1">{property.informacoesbasicas.nome}</h3>
                                <div className="text-2xl font-black text-neutral-dark">{property.informacoesbasicas.valor ? property.informacoesbasicas.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consulte'}</div>
                                <div className="mt-auto">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Ref: {property.id.substring(0,6).toUpperCase()}</div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50 font-bold">{property.caracteristicasimovel.tamanho || 'N/A'}</div>
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50 font-bold">{property.caracteristicasimovel.quartos?.join(', ') || 'N/A'}</div>
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50 font-bold">{property.caracteristicasimovel.vagas || 'N/A'}</div>
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50 font-bold">{property.caracteristicasimovel.vagas || 'N/A'}</div> {/* Placeholder for Banheiros */}
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50 font-bold">{property.localizacao.bairro}</div>
                                <div className="comparison-row h-16 flex items-center justify-center border-t border-gray-50">
                                    <span className="bg-primary/20 text-neutral-dark text-xs font-black px-3 py-1 rounded-full">98% MATCH</span>
                                </div>
                                <div className="h-24 flex items-center justify-center border-t border-gray-50 px-6">
                                    <Button asChild className="w-full py-3 bg-neutral-dark text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
                                      <Link href={`/imoveis/${property.id}`}>Ver Detalhes</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - propertiesToCompare.length) }).map((_, index) => (
                      <div key={`empty-${index}`} className="col-span-1 border-r border-gray-50">
                          <div className="p-6 h-[420px] flex flex-col items-center justify-center">
                              <button className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-primary hover:text-neutral-dark transition-all flex flex-col items-center justify-center gap-2 group">
                                  <span className="material-symbols-outlined text-4xl group-hover:rotate-90 transition-transform">add</span>
                                  Adicionar imóvel para comparar
                              </button>
                          </div>
                      </div>
                    ))}
                </div>
                )}
            </div>
        </>
    );
}
    
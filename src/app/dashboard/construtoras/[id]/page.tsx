
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

type User = {
  userType: 'admin' | 'broker' | 'constructor';
};

type Constructor = {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    publicEmail?: string;
    instagram?: string;
    logoUrl?: string;
};

type Property = {
  id: string;
  builderId: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    slug?: string;
  };
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[];
    tamanho?: string;
  };
};

type Portfolio = {
  brokerId: string;
  propertyIds: string[];
}

function PropertyCard({ property, canEdit }: { property: Property; canEdit: boolean }) {
    const getStatusVariant = (status: string) : "default" | "secondary" | "destructive" | "outline" | null | undefined => {
        switch (status) {
            case 'Lançamento': return 'default';
            case 'Em Construção': return 'secondary';
            case 'Pronto para Morar': return 'outline';
            default: return 'outline';
        }
    };

    const quartosLabel = () => {
        if (!property.caracteristicasimovel.quartos || property.caracteristicasimovel.quartos.length === 0) {
            return null;
        }
        if (property.caracteristicasimovel.quartos.length === 1 && property.caracteristicasimovel.quartos[0] === '1') {
            return '1 Quarto';
        }
        const joinedQuartos = property.caracteristicasimovel.quartos.join(', ');
        return `${joinedQuartos} Quartos`;
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-24 h-32 sm:h-20 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-card-border">
                {property.midia?.[0] ? (
                    <Image alt={property.informacoesbasicas.nome} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src={property.midia[0]} width={96} height={80} />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300 text-3xl">image</span></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getStatusVariant(property.informacoesbasicas.status)} className="text-[10px] font-bold uppercase tracking-wide">{property.informacoesbasicas.status}</Badge>
                    <span className="text-xs text-text-secondary">Ref: {property.id.substring(0, 6).toUpperCase()}</span>
                </div>
                 <Link href={`/dashboard/imoveis/${property.id}`} className="text-base font-bold text-text-main truncate hover:text-primary transition-colors">{property.informacoesbasicas.nome}</Link>
                <p className="text-sm text-text-secondary truncate">{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                    {property.caracteristicasimovel.quartos && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span> {quartosLabel()}</span>}
                    {property.caracteristicasimovel.tamanho && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">straighten</span> {property.caracteristicasimovel.tamanho}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-card-border">
                <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none py-2 sm:py-1.5 px-3 rounded-lg text-sm font-medium">
                    <Link href={`/dashboard/imoveis/${property.id}`}>Detalhes</Link>
                </Button>
                {canEdit && (
                    <Button asChild variant="ghost" size="icon" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors">
                        <Link href={`/dashboard/imoveis/editar/${property.id}`}><span className="material-symbols-outlined">edit</span></Link>
                    </Button>
                )}
            </div>
        </div>
    )
}


export default function ConstructorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { toast } = useToast();
    const [allInPortfolio, setAllInPortfolio] = useState(false);

    const userDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const constructorDocRef = useMemoFirebase(() => (firestore && id ? doc(firestore, 'constructors', id) : null), [firestore, id]);
    const { data: constructorData, isLoading: isConstructorLoading } = useDoc<Constructor>(constructorDocRef);

    const propertiesQuery = useMemoFirebase(() => (firestore && id ? query(collection(firestore, 'properties'), where('builderId', '==', id)) : null), [firestore, id]);
    const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);
    
    const portfolioDocRef = useMemoFirebase(
      () => (firestore && user && userProfile?.userType === 'broker' ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user, userProfile]
    );
    const { data: portfolio } = useDoc<Portfolio>(portfolioDocRef);


    const isLoading = isConstructorLoading || arePropertiesLoading || isAuthLoading || isProfileLoading;
    const canEdit = userProfile?.userType === 'admin' || (userProfile?.userType === 'constructor' && user?.uid === id);
    const isBroker = userProfile?.userType === 'broker';

    useEffect(() => {
      if (properties && properties.length > 0 && portfolio) {
        const allPropertiesInPortfolio = properties.every(p => portfolio.propertyIds.includes(p.id));
        setAllInPortfolio(allPropertiesInPortfolio);
      } else {
        setAllInPortfolio(false);
      }
    }, [properties, portfolio]);

    const handlePortfolioToggle = () => {
      if (!firestore || !user || !properties || properties.length === 0) return;
      
      const propertyIds = properties.map(p => p.id);
      const portfolioRef = doc(firestore, 'portfolios', user.uid);

      if (allInPortfolio) {
          // Remove all properties from this constructor
          setDocumentNonBlocking(portfolioRef, { propertyIds: arrayRemove(...propertyIds) }, { merge: true });
          toast({ title: 'Construtora Removida', description: `Os imóveis de ${constructorData?.name} foram removidos da sua carteira.` });
      } else {
          // Add all properties from this constructor
          setDocumentNonBlocking(portfolioRef, { propertyIds: arrayUnion(...propertyIds) }, { merge: true });
          toast({ title: 'Construtora Adicionada', description: `Os imóveis de ${constructorData?.name} foram adicionados à sua carteira.` });
      }
    };


    if (isLoading) {
        return (
            <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Carregando perfil da construtora...</p>
            </main>
        );
    }

    if (!constructorData) {
        return (
            <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Construtora não encontrada.</p>
            </main>
        );
    }
    
    return (
        <>
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <Link className="hover:text-text-main" href="/dashboard/construtoras">Construtoras</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">{constructorData.name}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">{constructorData.name}</h1>
                    <p className="text-text-secondary max-w-2xl">Visualize os dados cadastrais e o portfólio de imóveis vinculados a esta empresa.</p>
                </div>
                <div className="flex gap-3">
                    {isBroker && (
                        <Button variant={allInPortfolio ? 'default' : 'outline'} onClick={handlePortfolioToggle} disabled={!properties || properties.length === 0}>
                            <span className="material-symbols-outlined text-[18px] mr-2">{allInPortfolio ? 'check' : 'add'}</span>
                            {allInPortfolio ? 'Na Carteira' : 'Add à Carteira'}
                        </Button>
                    )}
                     <Button variant="outline" onClick={() => router.back()} className="px-5 py-2.5 rounded-lg border border-card-border text-text-main font-bold text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Voltar
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden relative">
                    {canEdit && (
                    <div className="absolute top-0 right-0 p-6">
                        <Button asChild className="px-4 py-2 rounded-lg bg-primary text-text-main font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20 flex items-center gap-2">
                           <Link href={`/dashboard/construtoras/editar/${constructorData.id}`}>
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                             Editar Dados
                           </Link>
                        </Button>
                    </div>
                    )}
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="size-32 shrink-0 bg-gray-50 rounded-xl border border-card-border flex items-center justify-center p-4">
                                {constructorData.logoUrl ? (
                                    <Image src={constructorData.logoUrl} alt={`Logo de ${constructorData.name}`} width={128} height={128} className="object-contain" />
                                ): (
                                    <span className="material-symbols-outlined text-6xl text-gray-300">apartment</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-6 w-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-main">{constructorData.name}</h2>
                                    {constructorData.address && (
                                        <div className="flex items-center gap-1 text-text-secondary mt-1">
                                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                                            <p className="text-sm">{constructorData.address}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-card-border">
                                    {constructorData.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-[#f2f5f0] flex items-center justify-center text-text-secondary">
                                            <span className="material-symbols-outlined text-lg">call</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary font-medium">Telefone</p>
                                            <p className="text-sm font-bold text-text-main">{constructorData.phone}</p>
                                        </div>
                                    </div>
                                    )}
                                    {constructorData.whatsapp && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-[#f2f5f0] flex items-center justify-center text-text-secondary">
                                            <span className="material-symbols-outlined text-lg">chat</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary font-medium">WhatsApp</p>
                                            <p className="text-sm font-bold text-text-main">{constructorData.whatsapp}</p>
                                        </div>
                                    </div>
                                    )}
                                    {constructorData.publicEmail && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-[#f2f5f0] flex items-center justify-center text-text-secondary">
                                            <span className="material-symbols-outlined text-lg">mail</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary font-medium">Email Corporativo</p>
                                            <p className="text-sm font-bold text-text-main">{constructorData.publicEmail}</p>
                                        </div>
                                    </div>
                                    )}
                                    {constructorData.instagram && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-[#f2f5f0] flex items-center justify-center text-text-secondary">
                                            <span className="material-symbols-outlined text-lg">photo_camera</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary font-medium">Instagram</p>
                                            <p className="text-sm font-bold text-text-main">{constructorData.instagram}</p>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary">holiday_village</span>
                            Imóveis Vinculados
                            <span className="text-sm font-normal text-text-secondary bg-white px-2 py-0.5 rounded-full border border-card-border ml-2">{properties?.length || 0} imóveis</span>
                        </h3>
                        {canEdit && (
                        <Button asChild size="sm" className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                            <Link href="/dashboard/imoveis/nova">
                                <span className="material-symbols-outlined text-lg">add</span>
                                Novo Imóvel
                            </Link>
                        </Button>
                        )}
                    </div>
                    <div className="divide-y divide-card-border">
                        {properties && properties.length > 0 ? (
                           properties.map(prop => <PropertyCard key={prop.id} property={prop} canEdit={canEdit} />)
                        ) : (
                            <div className="p-8 text-center text-text-secondary">
                                <p>Nenhum imóvel vinculado a esta construtora ainda.</p>
                            </div>
                        )}
                    </div>
                    {properties && properties.length > 5 && (
                        <div className="bg-gray-50 p-4 border-t border-card-border flex justify-center">
                            <button className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Ver todos os imóveis</button>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

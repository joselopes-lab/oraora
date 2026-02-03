'use client';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useAuthContext, useDoc } from "@/firebase";
import { collection, query, where, doc, arrayRemove, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";


type Property = {
  id: string;
  builderId: string; // ID of the 'constructors' collection document
  informacoesbasicas: {
    nome: string;
    status: string;
  };
  localizacao: {
    cidade: string;
    estado: string;
  };
  midia: string[];
  isVisibleOnSite: boolean;
};

type Constructor = {
    id: string;
    name: string;
};

type Portfolio = {
  propertyIds: string[];
}


export default function MyPortfolioPage() {
    const { user, userProfile, isReady } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
    const [arePortfolioPropertiesLoading, setArePortfolioPropertiesLoading] = useState(true);

    const planDocRef = useMemoFirebase(
      () => (firestore && userProfile?.planId ? doc(firestore, 'plans', userProfile.planId) : null),
      [firestore, userProfile]
    );
    const { data: planData, isLoading: isPlanLoading } = useDoc<{ propertyLimit?: number }>(planDocRef);

    const brokerPropertiesQuery = useMemoFirebase(
      () => (user && firestore ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
      [user, firestore]
    );
    const { data: brokerProperties, isLoading: areBrokerPropsLoading } = useCollection<{id: string}>(brokerPropertiesQuery);

    const portfolioDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user]
    );
    const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);
    
    const constructorsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'constructors')) : null),
      [firestore]
    );
    const { data: constructors, isLoading: areConstructorsLoading } = useCollection<Constructor>(constructorsQuery);

    const constructorNameMap = useMemo(() => {
      if (!constructors) return {};
      return constructors.reduce((acc, constructor) => {
        acc[constructor.id] = constructor.name;
        return acc;
      }, {} as Record<string, string>);
    }, [constructors]);


    useEffect(() => {
        const fetchPortfolioProperties = async () => {
            if (!firestore || !portfolio) {
                setPortfolioProperties([]);
                setArePortfolioPropertiesLoading(false);
                return;
            }

            const propertyIds = portfolio.propertyIds || [];
            if (propertyIds.length === 0) {
                setPortfolioProperties([]);
                setArePortfolioPropertiesLoading(false);
                return;
            }
            
            setArePortfolioPropertiesLoading(true);
            const propertiesData: Property[] = [];
            const propertiesRef = collection(firestore, 'properties');

            for (let i = 0; i < propertyIds.length; i += 30) {
                const batch = propertyIds.slice(i, i + 30);
                if (batch.length > 0) {
                    const q = query(propertiesRef, where('__name__', 'in', batch));
                    const propertiesSnap = await getDocs(q);
                    propertiesSnap.forEach(doc => {
                        propertiesData.push({ id: doc.id, ...doc.data() } as Property);
                    });
                }
            }
            setPortfolioProperties(propertiesData);
            setArePortfolioPropertiesLoading(false);
        };

        if (!isPortfolioLoading) {
            fetchPortfolioProperties();
        }
    }, [firestore, portfolio, isPortfolioLoading]);

    const handleRemoveFromPortfolio = (propertyId: string) => {
        if (!portfolioDocRef) return;
        setDocumentNonBlocking(portfolioDocRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        // Optimistic UI update
        setPortfolioProperties(prev => prev.filter(p => p.id !== propertyId));
        toast({
            title: "Imóvel Removido",
            description: "O imóvel foi removido da sua carteira com sucesso.",
        });
    };
    
    const isLoading = !isReady || arePortfolioPropertiesLoading || areConstructorsLoading || isPortfolioLoading || isPlanLoading || areBrokerPropsLoading;

    if (isLoading) {
        return (
            <div className="p-6">
                <p>Carregando sua carteira...</p>
            </div>
        )
    }

    const portfolioCount = portfolioProperties?.length || 0;
    const avulsoCount = brokerProperties?.length || 0;
    const totalPropertyCount = portfolioCount + avulsoCount;
    const propertyLimit = planData?.propertyLimit;
    const usagePercentage = (propertyLimit && propertyLimit > 0) ? (totalPropertyCount / propertyLimit) * 100 : 0;

    return (
        <AlertDialog>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Minha Carteira de Imóveis</h1>
                    <p className="text-text-secondary mt-1">Gerencie seu portfólio de imóveis selecionados das construtoras.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild className="bg-secondary hover:bg-primary text-secondary-foreground hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                        <Link href="/dashboard/imoveis">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Adicionar Imóveis
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-text-main">Uso de Imóveis na Carteira</h3>
                    <span className="text-sm font-bold">{totalPropertyCount} / {propertyLimit ?? 'Ilimitado'}</span>
                </div>
                {propertyLimit !== undefined && (
                    <Progress value={usagePercentage} />
                )}
                <p className="text-xs text-text-secondary mt-2">Você utilizou {usagePercentage.toFixed(0)}% do seu limite total de imóveis (carteira + avulsos).</p>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                                <TableHead className="px-6 py-4 font-semibold">Imóvel</TableHead>
                                <TableHead className="px-6 py-4 font-semibold">Construtora</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 text-sm">
                            {portfolioProperties && portfolioProperties.length > 0 ? (
                                portfolioProperties.map(property => (
                                <TableRow key={property.id} className="group hover:bg-background-light transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-100">
                                                <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover" src={property.midia?.[0] || 'https://placehold.co/100x100'} width={96} height={64} />
                                            </div>
                                            <div>
                                                <Link href={`/dashboard/imoveis/${property.id}`} className="font-bold text-text-main text-base hover:text-primary transition-colors">{property.informacoesbasicas.nome}</Link>
                                                <p className="text-text-secondary text-xs">{property.localizacao.cidade}, {property.localizacao.estado}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${property.informacoesbasicas.status === 'Lançamento' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{property.informacoesbasicas.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                     <TableCell className="px-6 py-4 text-text-secondary font-medium">
                                        <Link className="hover:text-primary transition-colors" href={`/dashboard/construtoras/${property.builderId}`}>{constructorNameMap[property.builderId] || 'N/A'}</Link>
                                    </TableCell>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover da Carteira" onClick={() => handleRemoveFromPortfolio(property.id)}>
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </Button>
                                        </div>
                                    </td>
                                </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center p-10 text-text-secondary">
                                        <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                                        <h4 className="text-md font-bold text-text-main">Sua carteira está vazia</h4>
                                        <p className="text-xs mt-1">Vá para a página de imóveis para começar a adicionar.</p>
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{portfolioProperties?.length || 0}</span> de <span className="font-bold text-text-main">{portfolioProperties?.length || 0}</span> imóveis</span>
                </div>
            </div>
        </AlertDialog>
    );
}

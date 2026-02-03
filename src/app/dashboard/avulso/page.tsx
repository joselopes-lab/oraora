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
import { collection, query, where, doc, getDocs } from "firebase/firestore";
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

type BrokerProperty = {
  id: string;
  brokerId: string;
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

type Property = {
    id: string;
};

type Portfolio = {
  propertyIds: string[];
}


export default function AvulsoPage() {
    const { user, userProfile, isReady } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [propertyToDelete, setPropertyToDelete] = useState<BrokerProperty | null>(null);

    const planDocRef = useMemoFirebase(
      () => (firestore && userProfile?.planId ? doc(firestore, 'plans', userProfile.planId) : null),
      [firestore, userProfile]
    );
    const { data: planData, isLoading: isPlanLoading } = useDoc<{ propertyLimit?: number }>(planDocRef);

    const propertiesQuery = useMemoFirebase(
      () => (user && firestore ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
      [user, firestore]
    );
    const { data: properties, isLoading: arePropertiesLoading } = useCollection<BrokerProperty>(propertiesQuery);
    
    const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
    const [arePortfolioPropertiesLoading, setArePortfolioPropertiesLoading] = useState(true);

    const portfolioDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user]
    );
    const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);
    
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

    const handleDeleteProperty = () => {
        if (!propertyToDelete || !firestore) return;
        const docRef = doc(firestore, 'brokerProperties', propertyToDelete.id);
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "Imóvel Excluído",
            description: `O imóvel "${propertyToDelete.informacoesbasicas.nome}" foi removido.`
        })
        setPropertyToDelete(null);
    }
    
    const isLoading = !isReady || arePropertiesLoading || isPlanLoading || isPortfolioLoading || arePortfolioPropertiesLoading;

    if (isLoading) {
        return (
            <div className="p-6">
                <p>Carregando seus imóveis...</p>
            </div>
        )
    }
    
    const propertyLimit = planData?.propertyLimit;
    const avulsoCount = properties?.length || 0;
    const portfolioCount = portfolioProperties?.length || 0;
    const totalPropertyCount = avulsoCount + portfolioCount;
    const usagePercentage = (propertyLimit && propertyLimit > 0) ? (totalPropertyCount / propertyLimit) * 100 : 0;

    return (
        <AlertDialog>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Listagem de Imóveis Avulsos</h1>
                    <p className="text-text-secondary mt-1">Gerencie seu portfólio imobiliário, status e visibilidade.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild className="bg-secondary hover:bg-primary text-secondary-foreground hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                       <Link href="/dashboard/avulso/novo">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Cadastrar Novo Imóvel
                       </Link>
                    </Button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-text-main">Uso de Imóveis</h3>
                    <span className="text-sm font-bold">{totalPropertyCount} / {propertyLimit ?? 'Ilimitado'}</span>
                </div>
                {propertyLimit !== undefined && (
                    <Progress value={usagePercentage} />
                )}
                <p className="text-xs text-text-secondary mt-2">Você utilizou {usagePercentage.toFixed(0)}% do seu limite total de imóveis (avulsos + carteira).</p>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
                <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
                    Filtros de Busca
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome do Imóvel</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                            <input className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Buscar por nome..." type="text" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Estado</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                <option value="">Todos</option>
                                <option value="SP">São Paulo (SP)</option>
                                <option value="RJ">Rio de Janeiro (RJ)</option>
                                <option value="MG">Minas Gerais (MG)</option>
                                <option value="SC">Santa Catarina (SC)</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Status no Site</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                <option value="">Todos</option>
                                <option value="visible">Visível</option>
                                <option value="hidden">Não Visível</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                                <TableHead className="px-6 py-4 font-semibold">Imóvel</TableHead>
                                <TableHead className="px-6 py-4 font-semibold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 text-sm">
                            {properties && properties.length > 0 ? (
                                properties.map(property => (
                                <TableRow key={property.id} className="group hover:bg-background-light transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-100">
                                                <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover" src={property.midia?.[0] || 'https://placehold.co/100x100'} width={96} height={64} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main text-base">{property.informacoesbasicas.nome}</p>
                                                <p className="text-text-secondary text-xs">{property.localizacao.cidade}, {property.localizacao.estado}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${property.informacoesbasicas.status === 'Lançamento' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{property.informacoesbasicas.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button asChild variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                                                <Link href={`/dashboard/avulso/editar/${property.id}`}>
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </Link>
                                            </Button>
                                             <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir" onClick={() => setPropertyToDelete(property)}>
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center p-10 text-text-secondary">
                                        <span className="material-symbols-outlined text-4xl mb-2">home</span>
                                        <h4 className="font-bold text-lg text-text-main">Nenhum imóvel avulso cadastrado.</h4>
                                        <p className="text-sm">Comece a cadastrar seus imóveis para gerenciá-los aqui.</p>
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{properties?.length || 0}</span> de <span className="font-bold text-text-main">{properties?.length || 0}</span> imóveis</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Anterior</Button>
                        <Button variant="outline" size="sm">Próximo</Button>
                    </div>
                </div>
            </div>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel <span className="font-bold">{propertyToDelete?.informacoesbasicas.nome}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPropertyToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>

        </AlertDialog>
    );
}

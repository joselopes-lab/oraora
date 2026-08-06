
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
import { Loader2, Trash2, ExternalLink, Briefcase } from "lucide-react";

type Property = {
  id: string;
  builderId: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
  };
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
  };
  midia: string[];
  isVisibleOnSite: boolean;
  inPortfolio?: boolean;
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
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

    const brokerPropertiesQuery = useMemoFirebase(
      () => (user && firestore ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid), where('inPortfolio', '==', true)) : null),
      [user, firestore]
    );
    const { data: myOwnedPortfolio, isLoading: isMyOwnedLoading } = useCollection<Property>(brokerPropertiesQuery);

    const portfolioDocRef = useMemoFirebase(
      () => (user && firestore ? doc(firestore, 'portfolios', user.uid) : null),
      [firestore, user]
    );
    const { data: portfolioDoc, isLoading: isDocLoading } = useDoc<Portfolio>(portfolioDocRef);
    
    const constructorsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'constructors')) : null),
      [firestore]
    );
    const { data: constructors } = useCollection<Constructor>(constructorsQuery);

    useEffect(() => {
        const fetchGlobalPortfolio = async () => {
            if (!firestore || !portfolioDoc || !portfolioDoc.propertyIds) {
                setPortfolioProperties([]);
                setIsDataLoading(false);
                return;
            }

            const ids = portfolioDoc.propertyIds || [];
            if (ids.length === 0) {
                setPortfolioProperties([]);
                setIsDataLoading(false);
                return;
            }
            
            setIsDataLoading(true);
            const data: Property[] = [];
            const ref = collection(firestore, 'properties');

            for (let i = 0; i < ids.length; i += 30) {
                const batch = ids.slice(i, i + 30);
                const q = query(ref, where('__name__', 'in', batch));
                const snap = await getDocs(q);
                snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Property));
            }
            setPortfolioProperties(data);
            setIsDataLoading(false);
        };

        if (!isDocLoading) fetchGlobalPortfolio();
    }, [firestore, portfolioDoc, isDocLoading]);

    const combinedPortfolio = useMemo(() => {
        return [...(myOwnedPortfolio || []), ...portfolioProperties].sort((a, b) => a.informacoesbasicas.nome.localeCompare(b.informacoesbasicas.nome));
    }, [myOwnedPortfolio, portfolioProperties]);

    const constructorMap = useMemo(() => {
        if (!constructors) return {};
        return constructors.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as Record<string, string>);
    }, [constructors]);

    const handleRemove = async () => {
        if (!firestore || !user?.uid || !propertyToDelete) return;

        const property = propertyToDelete;
        if (property.brokerId === user.uid) {
            // Own property
            await setDocumentNonBlocking(doc(firestore, 'brokerProperties', property.id), { inPortfolio: false, isVisibleOnSite: false }, { merge: true });
        } else {
            // Global property or someone else's property
            await setDocumentNonBlocking(doc(firestore, 'portfolios', user.uid), { propertyIds: arrayRemove(property.id) }, { merge: true });
        }
        toast({ title: "Removido da Carteira" });
        setPropertyToDelete(null);
    };

    const isLoading = isDataLoading || isMyOwnedLoading || isDocLoading || !isReady;

    if (isLoading) {
        return <div className="p-10 text-center italic text-slate-400 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin size-8 text-primary" />
            Carregando sua carteira...
        </div>;
    }

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1 uppercase">Minha Carteira</h1>
                    <p className="text-slate-500">Estes são os imóveis que estão publicados em seu site.</p>
                </div>
                <Button asChild className="bg-secondary text-white hover:text-black font-bold h-11 px-6 rounded-xl shadow-glow">
                    <Link href="/dashboard/imoveis">Adicionar Imóveis</Link>
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="px-6 py-4 font-bold uppercase text-[10px]">Imóvel</TableHead>
                            <TableHead className="px-6 py-4 font-bold uppercase text-[10px]">Origem</TableHead>
                            <TableHead className="px-6 py-4 font-bold uppercase text-[10px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedPortfolio.length > 0 ? combinedPortfolio.map(p => (
                            <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                            <Image src={p.midia?.[0] || 'https://placehold.co/400x300'} alt={p.informacoesbasicas.nome} width={64} height={64} className="size-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 uppercase tracking-tight">{p.informacoesbasicas.nome}</p>
                                            <p className="text-slate-400 text-xs">{p.localizacao.cidade}, {p.localizacao.estado}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        {p.brokerId ? 'Próprio' : (constructorMap[p.builderId] || 'Construtora')}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button asChild variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-primary">
                                            <Link href={`/dashboard/imoveis/${p.id}`}><ExternalLink size={16} /></Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-red-500" onClick={() => setPropertyToDelete(p)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20 text-slate-400 italic flex flex-col items-center gap-4">
                                    <Briefcase size={40} className="opacity-20" />
                                    Sua carteira de exibição está vazia.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!propertyToDelete} onOpenChange={() => setPropertyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Imóvel da Carteira?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza de que deseja remover este imóvel da sua carteira de exibição?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
                            Sim, remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}

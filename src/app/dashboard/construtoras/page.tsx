
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { doc, collection, query, where, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection, setDocumentNonBlocking, deleteDocumentNonBlocking, useAuth } from "@/firebase";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type User = {
  userType: 'admin' | 'broker' | 'constructor';
};

type Constructor = {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  phone: string;
  publicEmail: string;
  isVisibleOnSite: boolean;
  logoUrl?: string;
  icon?: string; // Kept for layout consistency if needed
};

type Portfolio = {
  brokerId: string;
  propertyIds: string[];
}

type Property = {
    id: string;
    builderId: string;
}

// Type for the data structure in the JSON file
type ConstructorImportData = {
    name: string;
    cnpj?: string;
    publicEmail?: string;
    isVisibleOnSite: boolean;
    whatsapp?: string;
    logoUrl?: string;
    instagram?: string;
    address?: string;
    city: string;
    phone?: string;
    state: string;
};


export default function ConstructorsPage() {
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [constructorToDelete, setConstructorToDelete] = useState<Constructor | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");


  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  
  const constructorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'constructors')) : null),
    [firestore]
  );

  const { data: constructors, isLoading: areConstructorsLoading, error: constructorsError } = useCollection<Constructor>(constructorsQuery);

  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties')) : null),
    [firestore]
  );
  const { data: allProperties } = useCollection<Property>(propertiesQuery);

  const portfolioDocRef = useMemoFirebase(
    () => (firestore && authUser && userProfile?.userType === 'broker' ? doc(firestore, 'portfolios', authUser.uid) : null),
    [firestore, authUser, userProfile]
  );
  const { data: portfolio } = useDoc<Portfolio>(portfolioDocRef);

  const isLoading = isAuthUserLoading || isProfileLoading || areConstructorsLoading;
  const isAdmin = userProfile?.userType === 'admin';
  const isBroker = userProfile?.userType === 'broker';

  const availableStates = useMemo(() => {
    if (!constructors) return [];
    const states = new Set(constructors.map(c => c.state));
    return Array.from(states).sort();
  }, [constructors]);

  const filteredConstructors = useMemo(() => {
    if (!constructors) return [];
    return constructors.filter(constructor => {
        const matchesSearchTerm = constructor.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = selectedState === 'all' || constructor.state === selectedState;
        return matchesSearchTerm && matchesState;
    });
  }, [constructors, searchTerm, selectedState]);


  const totalPages = filteredConstructors ? Math.ceil(filteredConstructors.length / itemsPerPage) : 1;
  const paginatedConstructors = filteredConstructors?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handleNextPage = () => {
      if (currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
      }
  };

  const handlePrevPage = () => {
      if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
      }
  };


  const handleDelete = async () => {
    if (!constructorToDelete || !firestore) return;
    
    try {
        const userDocRef = doc(firestore, 'users', constructorToDelete.id);
        deleteDocumentNonBlocking(userDocRef);

        const constructorDocRef = doc(firestore, 'constructors', constructorToDelete.id);
        deleteDocumentNonBlocking(constructorDocRef);
        
        toast({
            title: "Construtora Excluída!",
            description: `O registro de "${constructorToDelete.name}" foi removido com sucesso.`,
        });

    } catch (error) {
        console.error("Erro ao excluir construtora:", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: `Não foi possível remover a construtora.`,
        });
    } finally {
        setConstructorToDelete(null);
    }
  };

  const handleStatusChange = (constructor: Constructor, newStatus: boolean) => {
      if (!firestore) return;
      const constructorDocRef = doc(firestore, 'constructors', constructor.id);
      setDocumentNonBlocking(constructorDocRef, { isVisibleOnSite: newStatus }, { merge: true });
      toast({
        title: "Status alterado!",
        description: `A construtora "${constructor.name}" agora está ${newStatus ? 'visível' : 'invisível'} no site.`,
      });
  };

  const handlePortfolioToggle = (constructorId: string, constructorName: string) => {
      if (!firestore || !authUser || !allProperties) return;

      const portfolioRef = doc(firestore, 'portfolios', authUser.uid);
      const constructorProperties = allProperties.filter(p => p.builderId === constructorId);
      const propertyIds = constructorProperties.map(p => p.id);

      if (propertyIds.length === 0) {
          toast({ variant: 'destructive', title: 'Nenhum imóvel encontrado', description: 'Esta construtora não possui imóveis para adicionar.' });
          return;
      }

      const allInPortfolio = constructorProperties.every(p => portfolio?.propertyIds?.includes(p.id));

      if (allInPortfolio) {
          setDocumentNonBlocking(portfolioRef, { propertyIds: arrayRemove(...propertyIds) }, { merge: true });
          toast({ title: 'Construtora Removida', description: `Os imóveis de ${constructorName} foram removidos da sua carteira.` });
      } else {
          setDocumentNonBlocking(portfolioRef, { propertyIds: arrayUnion(...propertyIds) }, { merge: true });
          toast({ title: 'Construtora Adicionada', description: `Os imóveis de ${constructorName} foram adicionados à sua carteira.` });
      }
  };

  const checkAllInPortfolio = (constructorId: string): boolean => {
      if (!allProperties || !portfolio) return false;
      const constructorProperties = allProperties.filter(p => p.builderId === constructorId);
      if (constructorProperties.length === 0) return false;
      return constructorProperties.every(p => portfolio.propertyIds.includes(p.id));
  }

  const resetImportState = () => {
    setIsImporting(false);
    setIsImportComplete(false);
    setProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore || !auth) return;
    
    resetImportState();
    setIsImporting(true);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const dataToImport = JSON.parse(content) as ConstructorImportData[];
            const totalItems = dataToImport.length;
            
            let currentImported = 0;
            let currentSkipped = 0;

            for (let i = 0; i < totalItems; i++) {
                const item = dataToImport[i];
                
                // Increased delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
                let alreadyExists = false;
                if (item.cnpj) {
                    const q = query(collection(firestore, 'constructors'), where('cnpj', '==', item.cnpj));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        alreadyExists = true;
                    }
                }

                if (alreadyExists) {
                    currentSkipped++;
                    setSkippedCount(currentSkipped);
                } else {
                    // Fallback to email-based check for Auth, though CNPJ in Firestore is primary
                    const tempEmail = item.cnpj ? `${item.cnpj.replace(/\D/g, '')}@construtora.temp` : `${item.name.toLowerCase().replace(/\s/g, '')}@construtora.temp`;
                    const tempPassword = `temp_${Date.now()}`;

                    try {
                      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
                      const user = userCredential.user;
                      await updateProfile(user, { displayName: item.name });

                      const userDocRef = doc(firestore, 'users', user.uid);
                      const userData = { id: user.uid, username: item.name, email: tempEmail, userType: 'constructor', isActive: true, planId: 'imported-plan' };
                      setDocumentNonBlocking(userDocRef, userData, { merge: true });

                      const constructorDocRef = doc(firestore, 'constructors', user.uid);
                      const constructorData = {
                          id: user.uid, userId: user.uid, name: item.name, cnpj: item.cnpj || '', publicEmail: item.publicEmail || '',
                          isVisibleOnSite: item.isVisibleOnSite, whatsapp: item.whatsapp || '', logoUrl: item.logoUrl || '',
                          instagram: item.instagram || '', address: item.address || '', city: item.city, phone: item.phone || '',
                          state: item.state, websiteUrl: '', stateRegistration: '', zip: ''
                      };
                      setDocumentNonBlocking(constructorDocRef, constructorData, { merge: true });
                      
                      currentImported++;
                      setImportedCount(currentImported);

                    } catch (authError: any) {
                       if (authError.code === 'auth/email-already-in-use') {
                          console.warn(`Email ${tempEmail} já existe no Auth, pulando.`);
                          currentSkipped++;
                          setSkippedCount(currentSkipped);
                       } else {
                          console.error(`Erro ao criar usuário para ${item.name}:`, authError);
                          currentSkipped++;
                          setSkippedCount(currentSkipped);
                       }
                    }
                }
                setProgress(((i + 1) / totalItems) * 100);
            }
        } catch (parseError) {
            console.error("Erro ao ler o arquivo JSON:", parseError);
            toast({
                variant: "destructive",
                title: "Erro de Importação",
                description: "O arquivo selecionado não é um JSON válido.",
            });
        } finally {
            setIsImporting(false);
            setIsImportComplete(true);
        }
    };

    reader.readAsText(file);
};


  return (
    <>
      <AlertDialog>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Construtoras Parceiras</h1>
            <p className="text-text-secondary">Gerencie o catálogo de construtoras, visibilidade e contatos.</p>
          </div>
          {!isLoading && isAdmin && (
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  Importar
              </Button>
              <Button asChild className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                <Link href="/dashboard/construtoras/nova">
                  <span className="material-symbols-outlined">add</span>
                  Nova Construtora
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
                Filtros de Busca
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome da Construtora</Label>
                <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                <Input
                    className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400"
                    placeholder="Buscar por nome..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset page when searching
                    }}
                />
                </div>
            </div>
            <div>
                <Label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Estado</Label>
                 <Select
                    value={selectedState}
                    onValueChange={(value) => {
                        setSelectedState(value);
                        setCurrentPage(1);
                    }}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-text-secondary font-semibold tracking-wider">
                  <TableHead className="px-6 py-4 font-bold w-1/3">Construtora</TableHead>
                  <TableHead className="px-6 py-4 font-bold">Localização</TableHead>
                  <TableHead className="px-6 py-4 font-bold">Contato</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center">Visível no Site</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center p-6">Carregando construtoras...</TableCell></TableRow>
                ) : constructorsError ? (
                  <TableRow><TableCell colSpan={5} className="text-center p-6 text-red-500">Erro ao carregar construtoras.</TableCell></TableRow>
                ) : (
                  paginatedConstructors?.map((constructor) => {
                    const allInPortfolio = isBroker && checkAllInPortfolio(constructor.id);
                    return (
                  <TableRow key={constructor.id} className="group hover:bg-background-light/50 transition-colors">
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-white border border-gray-100 p-1 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-gray-400">{constructor.icon || 'apartment'}</span>
                        </div>
                        <div>
                          <Link href={`/dashboard/construtoras/${constructor.id}`} className="text-sm font-bold text-text-main hover:text-primary transition-colors">{constructor.name}</Link>
                          <p className="text-xs text-text-secondary">CNPJ: {constructor.cnpj || 'Não informado'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-text-main text-sm">
                        <span className="material-symbols-outlined text-[16px] text-text-secondary">location_on</span>
                        {constructor.city} - {constructor.state}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-main">{constructor.phone || 'Não informado'}</span>
                        <span className="text-xs text-text-secondary">{constructor.publicEmail || 'Não informado'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div className='flex items-center justify-center gap-2'>
                          <Switch
                            id={`status-${constructor.id}`}
                            checked={constructor.isVisibleOnSite}
                            onCheckedChange={(newStatus) => handleStatusChange(constructor, newStatus)}
                            disabled={!isAdmin}
                          />
                          <span className={`text-xs font-bold ${constructor.isVisibleOnSite ? 'text-green-700' : 'text-gray-500'}`}>
                              {constructor.isVisibleOnSite ? 'Visível' : 'Oculto'}
                          </span>
                      </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                           {isBroker && (
                                <Button variant={allInPortfolio ? 'default' : 'outline'} size="sm" onClick={() => handlePortfolioToggle(constructor.id, constructor.name)}>
                                    <span className="material-symbols-outlined text-sm mr-1.5">{allInPortfolio ? 'check' : 'add'}</span>
                                    {allInPortfolio ? 'Na Carteira' : 'Add Carteira'}
                                </Button>
                           )}
                           {isAdmin && (
                            <>
                            <Button asChild variant="ghost" size="icon" className="size-8 text-text-main hover:text-text-main" title="Editar">
                              <Link href={`/dashboard/construtoras/editar/${constructor.id}`}>
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </Link>
                            </Button>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 text-text-secondary hover:text-red-500" title="Excluir" onClick={() => setConstructorToDelete(constructor)}>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            </>
                           )}
                        </div>
                      </TableCell>
                  </TableRow>
                    )}
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Mostrando <span className="font-bold text-text-main">
                {filteredConstructors && filteredConstructors.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {filteredConstructors ? Math.min(currentPage * itemsPerPage, filteredConstructors.length) : 0}
              </span> de <span className="font-bold text-text-main">{filteredConstructors?.length || 0}</span> construtoras
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-8" onClick={handlePrevPage} disabled={currentPage === 1}>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </Button>
              <span className="text-xs font-bold">{currentPage} de {totalPages}</span>
              <Button variant="outline" size="icon" className="size-8" onClick={handleNextPage} disabled={currentPage === totalPages}>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Button>
            </div>
          </div>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente a construtora <span className="font-bold">{constructorToDelete?.name}</span> e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConstructorToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isImportModalOpen} onOpenChange={(isOpen) => { if (!isImporting) setIsImportModalOpen(isOpen); }}>
        <DialogContent onInteractOutside={(e) => { if (isImporting) e.preventDefault(); }} className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Importar Construtoras</DialogTitle>
                {!isImporting && !isImportComplete && (
                  <DialogDescription>
                      Selecione um arquivo JSON para importar múltiplas construtoras. O sistema irá verificar por CNPJs duplicados.
                  </DialogDescription>
                )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {!isImporting && !isImportComplete && (
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="json-file">Arquivo JSON</Label>
                      <Input id="json-file" type="file" accept=".json" onChange={handleFileImport} />
                  </div>
                )}
                 {isImporting && !isImportComplete && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            Processando arquivo, por favor aguarde...
                        </p>
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-right text-muted-foreground">{Math.round(progress)}%</p>
                    </div>
                 )}
                 {isImportComplete && (
                    <div className="text-center space-y-4 p-4 rounded-lg bg-muted border">
                        <span className="material-symbols-outlined text-5xl text-green-500">task_alt</span>
                        <h3 className="text-lg font-bold text-foreground">Importação Concluída</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-bold text-green-600">{importedCount}</span> construtora(s) importada(s) com sucesso.
                            <br/>
                            <span className="font-bold text-foreground">{skippedCount}</span> duplicada(s) ou com erro foram ignoradas.
                        </p>
                    </div>
                 )}
            </div>
            <DialogFooter>
                 <Button type="button" variant="secondary" onClick={() => { setIsImportModalOpen(false); resetImportState(); }}>
                    Fechar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

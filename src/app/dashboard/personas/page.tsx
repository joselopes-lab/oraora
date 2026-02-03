
'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";


type Persona = {
  id: string;
  name: string;
  status: 'Ativo' | 'Inativo';
  icon: string;
  iconBackgroundColor: string;
  iconColor: string;
  description: string;
  propertyTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
};

type User = {
    userType: 'admin' | 'broker' | 'constructor';
};

export default function PersonasPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);


  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  // Admin and Broker see all personas.
  const personasQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'personas')) : null),
    [firestore]
  );
  
  const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

  const isLoading = isUserLoading || arePersonasLoading || isProfileLoading;
  const isAdmin = userProfile?.userType === 'admin';
  
  const handleDeletePersona = () => {
    if (!personaToDelete || !firestore || !isAdmin) return;

    const docRef = doc(firestore, 'personas', personaToDelete.id);
    deleteDocumentNonBlocking(docRef);

    toast({
        title: "Persona Excluída!",
        description: `O perfil de "${personaToDelete.name}" foi removido com sucesso.`,
    });
    setPersonaToDelete(null); // Close the dialog
  };

  const handleStatusChange = (persona: Persona, newStatus: boolean) => {
    if (!firestore || !isAdmin) {
        toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: "Você não tem permissão para alterar o status.",
        });
        return;
    }
    const docRef = doc(firestore, 'personas', persona.id);
    setDocumentNonBlocking(docRef, { status: newStatus ? 'Ativo' : 'Inativo' }, { merge: true });
    toast({
        title: "Status Alterado!",
        description: `O status da persona "${persona.name}" foi atualizado.`,
    });
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min && !max) return 'N/A';
    const format = (n?: number) => n ? (n / 1000000 >= 1 ? `${(n / 1000000).toLocaleString('pt-BR')}M` : `${(n / 1000).toLocaleString('pt-BR')}k`) : '';
    if (min && max) return `R$ ${format(min)} - ${format(max)}`;
    if (min) return `A partir de R$ ${format(min)}`;
    if (max) return `Até R$ ${format(max)}`;
    return 'N/A';
  };

  return (
    <>
      <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Personas</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Gestão de Personas</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            {isAdmin && (
                <Button asChild className="flex items-center gap-2 bg-secondary hover:bg-[#74d12e] text-white font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all duration-300">
                    <Link href="/dashboard/personas/nova">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Nova Persona
                    </Link>
                </Button>
            )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">groups</span>
            </div>
            <span className="text-sm font-medium text-text-secondary">Total de Personas</span>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-text-main">{personas?.length || 0}</h3>
                <span className="text-xs font-bold text-status-success-text bg-status-success px-1.5 py-0.5 rounded">+2 este mês</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">Ativas no sistema</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-status-success-text">trending_up</span>
            </div>
            <span className="text-sm font-medium text-text-secondary">Persona mais Ativa</span>
            <h3 className="text-2xl font-bold text-text-main">Investidor Visionário</h3>
            <p className="text-xs text-text-secondary mt-1">45% das buscas recentes</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">real_estate_agent</span>
            </div>
            <span className="text-sm font-medium text-text-secondary">Imóveis Recomendados</span>
            <h3 className="text-2xl font-bold text-text-main">148</h3>
            <p className="text-xs text-text-secondary mt-1">Matches automatizados hoje</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col h-full">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">search</span>
                </div>
                <input className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out" placeholder="Buscar por nome ou descrição..." type="text"/>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative group">
                    <select className="appearance-none bg-gray-50 border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                        <option value="">Tipo de Imóvel: Todos</option>
                        <option value="casa">Casa em Condomínio</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="lote">Lote/Terreno</option>
                        <option value="cobertura">Cobertura</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                </div>
                <div className="relative group">
                    <select className="appearance-none bg-gray-50 border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                        <option value="">Status: Todos</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                </div>
                <button className="flex items-center justify-center p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary bg-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50">
                        <TableHead className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Foto/Ícone</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Nome da Persona</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Descrição</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Tipos de Imóvel</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Faixa de Preço</TableHead>
                        <TableHead className="px-6 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">Status</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-50">
                    {isLoading && <TableRow><TableCell colSpan={7} className="text-center p-10">Carregando personas...</TableCell></TableRow>}
                    {!isLoading && personas?.map(persona => (
                        <TableRow key={persona.id} className="hover:bg-gray-50/80 transition-colors group">
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div style={{ backgroundColor: persona.iconBackgroundColor }} className="size-10 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[24px]" style={{ color: persona.iconColor }}>{persona.icon}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-text-main">{persona.name}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                                <div className="text-xs text-text-secondary line-clamp-1 max-w-[200px]">{persona.description}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                    {persona.propertyTypes?.map(type => (
                                        <span key={type} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded">{type}</span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-text-main">{formatPriceRange(persona.minPrice, persona.maxPrice)}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <label className="inline-flex items-center cursor-pointer">
                                <Switch
                                    checked={persona.status === 'Ativo'}
                                    onCheckedChange={(checked) => handleStatusChange(persona, checked)}
                                    disabled={!isAdmin}
                                />
                                </label>
                            </TableCell>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex justify-end gap-2">
                                <Button asChild variant="ghost" size="icon" className="p-1.5 text-text-secondary hover:text-primary transition-colors" title="Ver Detalhes">
                                    <Link href={`/dashboard/personas/${persona.id}`}>
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                    </Link>
                                </Button>
                                {isAdmin && (
                                    <>
                                        <Button asChild variant="ghost" size="icon" className="p-1.5 text-text-secondary hover:text-blue-500 transition-colors" title="Editar">
                                            <Link href={`/dashboard/personas/editar/${persona.id}`}>
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </Link>
                                        </Button>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="p-1.5 text-text-secondary hover:text-status-error-text transition-colors" title="Excluir" onClick={() => setPersonaToDelete(persona)}>
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                    </>
                                )}
                                </div>
                            </td>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-text-secondary">
                Mostrando <span className="font-bold text-text-main">1-{personas?.length || 0}</span> de <span className="font-bold text-text-main">{personas?.length || 0}</span> resultados
            </div>
            <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50">
                    Anterior
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-text-main bg-white hover:bg-gray-50 hover:border-primary transition-colors">
                    Próxima
                </button>
            </div>
        </div>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a persona <span className="font-bold">{personaToDelete?.name}</span>.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePersona} className="bg-destructive hover:bg-destructive/90">
                Sim, excluir
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


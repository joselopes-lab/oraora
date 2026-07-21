'use client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase, useAuthContext, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, Timestamp, limit } from "firebase/firestore";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";

const ClientSideDate = ({ date, options }: { date: Date, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      setFormattedDate(date.toLocaleDateString('pt-BR', options));
    }
  }, [date, options]);

  return <>{formattedDate || '...'}</>;
};

// Mapeamento de tradução apenas para exibição visual
const statusTranslations: Record<string, string> = {
  new: 'Novo',
  contacted: 'Em Atendimento',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  converted: 'Finalizado',
  lost: 'Perdido',
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost';
  createdAt: Timestamp;
}

export default function ClientListPage() {
  const firestore = useFirestore();
  const { user, userProfile, isReady } = useAuthContext();
  const { toast } = useToast();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const leadsQuery = useMemoFirebase(
    () => {
      if (!isReady || !firestore || !user?.uid || !userProfile) return null;
      
      const leadsRef = collection(firestore, 'leads');
      
      if (userProfile.userType === 'admin') {
        return query(leadsRef, limit(200));
      }
      
      return query(
        leadsRef, 
        where('brokerId', '==', user.uid)
      );
    },
    [isReady, firestore, user?.uid, userProfile?.userType]
  );
  
  const { data: initialClients, isLoading: isLeadsLoading, error } = useCollection<Lead>(leadsQuery);

  const isLoading = !isReady || isLeadsLoading || (isReady && initialClients === null && !error);

  const clients = useMemo(() => {
    if (!initialClients) return [];
    return [...initialClients].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
    });
  }, [initialClients]);

  const handleDeleteLead = () => {
    if (!leadToDelete || !firestore) return;

    const leadDocRef = doc(firestore, 'leads', leadToDelete.id);
    deleteDocumentNonBlocking(leadDocRef);

    toast({
        title: "Lead excluído!",
        description: `O lead de "${leadToDelete.name}" foi removido com sucesso.`,
    });

    setLeadToDelete(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'qualified': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'proposal': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'converted': return 'bg-green-100 text-green-800 border-green-200';
        case 'lost': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-left">
      <AlertDialog>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left">
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Listagem de Clientes</h1>
            <p className="text-text-secondary mt-1">Gerencie leads, históricos de contato e carteira de clientes.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
              <Link href="/dashboard/clientes/nova">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Cadastrar Novo Cliente
              </Link>
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8 text-left">
          <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
            Filtros de Busca
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome ou E-mail</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                <input className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Buscar cliente..." type="text" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Status</label>
              <div className="relative">
                <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Todos</option>
                  <option value="new">Novo</option>
                  <option value="contacted">Em Atendimento</option>
                  <option value="proposal">Proposta</option>
                  <option value="converted">Finalizado</option>
                  <option value="lost">Perdido</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Origem do Lead</label>
              <div className="relative">
                <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Todas</option>
                  <option value="site">Site</option>
                  <option value="indicacao">Indicação</option>
                  <option value="portal">Portal Imobiliário</option>
                  <option value="instagram">Instagram</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Interesse</label>
              <div className="relative">
                <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Qualquer</option>
                  <option value="compra">Compra</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="investimento">Investimento</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-6 py-4 font-semibold">Nome Completo</th>
                  <th className="px-6 py-4 font-semibold">Contatos</th>
                  <th className="px-6 py-4 font-semibold">Interesse / Origem</th>
                  <th className="px-6 py-4 font-semibold text-center">Cadastro</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr key="loading-state"><td colSpan={6} className="text-center p-12 text-text-secondary italic">
                   <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      Carregando clientes...
                   </div>
                </td></tr>
              ) : error ? (
                <tr key="error-state"><td colSpan={6} className="text-center p-10 text-red-500 font-bold bg-red-50">
                   <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl">error</span>
                      <p>Não foi possível carregar os dados.</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">Tentar novamente</Button>
                   </div>
                </td></tr>
              ) : clients && clients.length > 0 ? clients.map(client => (
                <tr key={client.id} className="group hover:bg-background-light transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/20 text-primary-hover font-bold flex items-center justify-center shrink-0 border border-primary/10">{client.name.charAt(0)}</div>
                      <div>
                        <Link href={`/dashboard/clientes/${client.id}`} className="font-bold text-text-main text-base hover:text-primary transition-colors">{client.name}</Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-text-main font-medium text-xs">
                        <span className="material-symbols-outlined text-gray-400 text-[16px]">mail</span>
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary text-xs">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">chat</span>
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-text-main font-medium">{client.propertyInterest || 'Não especificado'}</div>
                    <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">link</span> {client.source || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-text-secondary font-medium text-xs">
                      {client.createdAt && <ClientSideDate date={client.createdAt.toDate()} options={{ day: '2-digit', month: 'short' }} />}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className={getStatusBadgeClass(client.status)}>
                      {statusTranslations[client.status] || client.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors" title="Ver Detalhes">
                        <Link href={`/dashboard/clientes/${client.id}`}>
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                      </Button>
                      <AlertDialogTrigger asChild>
                          <button onClick={() => setLeadToDelete(client)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Excluir">
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                      </AlertDialogTrigger>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr key="empty-state"><td colSpan={6} className="text-center p-20 text-text-secondary italic">
                    <span className="material-symbols-outlined text-5xl opacity-20 block mb-4">person_search</span>
                    Nenhum cliente encontrado.
                </td></tr>
              )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
            <p className="text-xs text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{clients?.length || 0}</span> de <span className="font-bold text-text-main">{clients?.length || 0}</span> clientes</p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-text-main bg-white hover:bg-gray-50 hover:border-primary transition-colors">Próximo</button>
            </div>
          </div>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lead de <span className="font-bold">{leadToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


'use client';
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost';
  createdAt: Timestamp;
  brokerId: string;
}

type User = {
    id: string;
    username: string;
}

const LeadsTable = ({ leads, isLoading, error, brokerNameMap, onLeadDelete }: {
    leads: Lead[] | null;
    isLoading: boolean;
    error: Error | null;
    brokerNameMap: Record<string, string>;
    onLeadDelete: (lead: Lead) => void;
}) => {
    return (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                    <TableHead className="px-6 py-4 font-semibold">Nome Completo</TableHead>
                    <TableHead className="px-6 py-4 font-semibold">Contatos</TableHead>
                    <TableHead className="px-6 py-4 font-semibold">Corretor</TableHead>
                    <TableHead className="px-6 py-4 font-semibold">Interesse / Origem</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-center">Data</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-center">Status</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 text-sm">
                {isLoading && (
                    <TableRow><TableCell colSpan={7} className="text-center p-6">Carregando leads...</TableCell></TableRow>
                )}
                {!isLoading && error && (
                    <TableRow><TableCell colSpan={7} className="text-center p-6 text-red-500">Erro ao carregar leads.</TableCell></TableRow>
                )}
                {!isLoading && leads?.map(lead => (
                    <TableRow key={lead.id} className="group hover:bg-background-light transition-colors">
                    <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/20 text-primary-hover font-bold flex items-center justify-center shrink-0 border border-primary/10">{lead.name.charAt(0)}</div>
                        <div>
                            <span className="font-bold text-text-main text-base">{lead.name}</span>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-text-main font-medium text-xs">
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">mail</span>
                            {lead.email}
                        </div>
                        {lead.phone && <div className="flex items-center gap-2 text-text-secondary text-xs">
                            <span className="material-symbols-outlined text-green-500 text-[16px]">chat</span>
                            {lead.phone}
                        </div>}
                        </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                        <span className="text-text-secondary font-medium text-xs">{brokerNameMap[lead.brokerId] || 'Não atribuído'}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                        <div className="text-text-main font-medium">{lead.propertyInterest || 'Não especificado'}</div>
                        <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">link</span> {lead.source || 'N/A'}
                        </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                        <span className="text-text-secondary font-medium text-xs">{lead.createdAt.toDate().toLocaleDateString('pt-BR')}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${lead.status === 'new' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
                        {lead.status}
                        </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                        <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-red-500" onClick={() => onLeadDelete(lead)}>
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </Button>
                        </AlertDialogTrigger>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
             </div>
            <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{leads?.length || 0}</span> de <span className="font-bold text-text-main">{leads?.length || 0}</span> leads</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm border border-gray-200 rounded text-text-secondary hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
                    <button className="px-3 py-1 text-sm bg-primary text-text-main font-bold rounded hover:bg-primary-hover">1</button>
                    <button className="px-3 py-1 text-sm border border-gray-200 rounded text-text-secondary hover:bg-gray-50">Próximo</button>
                </div>
            </div>
        </div>
    );
};


export default function AdminLeadsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const leadsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  
  const { data: leads, isLoading: areLeadsLoading, error } = useCollection<Lead>(leadsQuery);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const brokerNameMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
    }, {} as Record<string, string>)
  }, [users]);
  
  const contactLeads = useMemo(() => leads?.filter(lead => lead.source === 'Formulário de Contato'), [leads]);
  const newsletterLeads = useMemo(() => leads?.filter(lead => lead.source === 'Newsletter'), [leads]);
  const siteLeads = useMemo(() => leads?.filter(lead => lead.source !== 'Newsletter' && lead.source !== 'Formulário de Contato'), [leads]);

  const isLoading = areLeadsLoading || areUsersLoading;

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

  return (
    <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Leads do Site</h1>
          <p className="text-text-secondary mt-1">Contatos recebidos através dos formulários do site e da newsletter.</p>
        </div>
      </div>
      <Tabs defaultValue="site-leads">
          <TabsList className="mb-4">
              <TabsTrigger value="site-leads">Outros Leads do Site ({siteLeads?.length || 0})</TabsTrigger>
              <TabsTrigger value="contact-leads">Contato ({contactLeads?.length || 0})</TabsTrigger>
              <TabsTrigger value="newsletter">Newsletter ({newsletterLeads?.length || 0})</TabsTrigger>
          </TabsList>
      
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
              Filtros de Busca
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome ou E-mail</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                  <input className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Buscar lead..." type="text" />
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
                    <option value="Site Público">Site Público</option>
                    <option value="Site">Site</option>
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
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Buscar por imóvel..." type="text" />
                </div>
              </div>
            </div>
          </div>
          <TabsContent value="site-leads">
            <LeadsTable leads={siteLeads} isLoading={isLoading} error={error} brokerNameMap={brokerNameMap} onLeadDelete={setLeadToDelete} />
          </TabsContent>
          <TabsContent value="contact-leads">
            <LeadsTable leads={contactLeads} isLoading={isLoading} error={error} brokerNameMap={brokerNameMap} onLeadDelete={setLeadToDelete} />
          </TabsContent>
          <TabsContent value="newsletter">
            <LeadsTable leads={newsletterLeads} isLoading={isLoading} error={error} brokerNameMap={brokerNameMap} onLeadDelete={setLeadToDelete} />
          </TabsContent>
        </Tabs>
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
  )
}

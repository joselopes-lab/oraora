
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, User, Phone, Mail, MessageSquare, FileText, UserCheck, MoreHorizontal, CheckCircle, Clock, Archive, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateLeadStatus, assignBrokerToLead, deleteLead } from './actions';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
  propertyName: string;
  propertySlug?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'new' | 'contacted' | 'closed';
  brokerId?: string;
  brokerName?: string;
}

interface Broker {
    id: string;
    name: string;
}

const statusOptions: { value: Lead['status']; label: string; icon: React.ReactNode }[] = [
    { value: 'new', label: 'Novo', icon: <Clock className="h-4 w-4 mr-2" /> },
    { value: 'contacted', label: 'Contatado', icon: <CheckCircle className="h-4 w-4 mr-2" /> },
    { value: 'closed', label: 'Fechado', icon: <Archive className="h-4 w-4 mr-2" /> },
];

const LEADS_PER_PAGE = 10;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);


  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribeLeads = onSnapshot(q, (querySnapshot) => {
      const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching leads: ", error);
      setIsLoading(false);
    });

    const unsubscribeBrokers = onSnapshot(collection(db, 'brokers'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Broker));
        setBrokers(data);
    });


    return () => {
        unsubscribeLeads();
        unsubscribeBrokers();
    };
  }, []);

  const handleStatusChange = async (leadId: string, status: Lead['status']) => {
    const result = await updateLeadStatus(leadId, status);
    if(result.success) {
        toast({ title: "Status do Lead Atualizado!" });
    } else {
        toast({ variant: 'destructive', title: "Erro", description: result.error });
    }
  }

  const handleAssignBroker = async (leadId: string, brokerId: string, brokerName: string) => {
     const result = await assignBrokerToLead(leadId, brokerId, brokerName);
     if(result.success) {
        toast({ title: "Corretor Atribuído!" });
    } else {
        toast({ variant: 'destructive', title: "Erro", description: result.error });
    }
  }
  
  const openDeleteAlert = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    const result = await deleteLead(leadToDelete.id);
    if (result.success) {
      toast({ title: 'Lead deletado com sucesso!' });
    } else {
      toast({ variant: 'destructive', title: 'Erro ao deletar', description: result.error });
    }
    setIsDeleteAlertOpen(false);
  };


  const formatDate = (timestamp: Lead['createdAt']) => {
    if (!timestamp || !timestamp.seconds) {
      return 'Data inválida';
    }
    const date = new Date(timestamp.seconds * 1000);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  const getStatusVariant = (status: Lead['status']) => {
    switch(status) {
        case 'new': return 'default';
        case 'contacted': return 'secondary';
        case 'closed': return 'outline';
        default: return 'outline';
    }
  }
  
   const getStatusText = (status: Lead['status']) => {
    switch(status) {
        case 'new': return 'Novo';
        case 'contacted': return 'Contatado';
        case 'closed': return 'Fechado';
        default: return 'Desconhecido';
    }
  }

  const totalPages = Math.ceil(leads.length / LEADS_PER_PAGE);
  const paginatedLeads = leads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Inbox /> Leads Recebidos</CardTitle>
          <CardDescription>Visualize e gerencie os contatos recebidos através do site.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Imóvel de Interesse</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Corretor Atribuído</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                          <p>{lead.name}</p>
                          <div className="text-xs text-muted-foreground space-y-1 mt-1">
                              <div className="flex items-center gap-1.5">
                                  <Mail className="h-3 w-3" />
                                  <span>{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                  <Phone className="h-3 w-3" />
                                  <span>{lead.phone}</span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/properties/${lead.propertySlug || lead.propertyId}`} className="hover:underline">
                          {lead.propertyName}
                        </Link>
                      </TableCell>
                      <TableCell>
                          {lead.brokerId ? (
                              <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-green-600"/>
                                  <span className="text-xs">Via Corretor</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600"/>
                                  <span className="text-xs">Via Formulário</span>
                              </div>
                          )}
                      </TableCell>
                      <TableCell>
                          {lead.brokerName ? (
                            <Link href={`/dashboard/brokers/${lead.brokerId}`} className="flex items-center gap-2 text-sm hover:underline">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.brokerName}</span>
                            </Link>
                          ) : <span className="text-xs text-muted-foreground italic">Aguardando atribuição</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(lead.status)}>{getStatusText(lead.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Ver Opções</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mensagem</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-muted-foreground focus:bg-transparent focus:text-muted-foreground cursor-default">
                                    <p className="text-xs max-w-xs whitespace-normal">{lead.message || 'Nenhuma mensagem.'}</p>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>Alterar Status</DropdownMenuSubTrigger>
                                      <DropdownMenuPortal>
                                          <DropdownMenuSubContent>
                                              {statusOptions.map(option => (
                                                  <DropdownMenuItem key={option.value} onClick={() => handleStatusChange(lead.id, option.value)} disabled={lead.status === option.value}>
                                                      {option.icon}
                                                      {option.label}
                                                  </DropdownMenuItem>
                                              ))}
                                          </DropdownMenuSubContent>
                                      </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>Atribuir Corretor</DropdownMenuSubTrigger>
                                      <DropdownMenuPortal>
                                          <DropdownMenuSubContent>
                                              {brokers.map(broker => (
                                                  <DropdownMenuItem key={broker.id} onClick={() => handleAssignBroker(lead.id, broker.id, broker.name)} disabled={lead.brokerId === broker.id}>
                                                    {broker.name}
                                                  </DropdownMenuItem>
                                              ))}
                                          </DropdownMenuSubContent>
                                      </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => openDeleteAlert(lead)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir Lead
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum lead recebido ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá excluir o lead de <strong>{leadToDelete?.name}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

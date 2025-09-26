'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Mail, Phone, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

type LeadStatus = 'new' | 'contacted' | 'closed';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  brokerId: string;
  createdAt: Timestamp;
  status: LeadStatus;
}

const statusOptions: { value: LeadStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'new', label: 'Novo', icon: <Clock className="h-4 w-4 mr-2" /> },
    { value: 'contacted', label: 'Contatado', icon: <CheckCircle className="h-4 w-4 mr-2" /> },
];

export default function CorretorLeadsPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            if (!loadingAuth) setIsLoading(false);
            return;
        }

        const leadsQuery = query(
            collection(db, 'broker_leads'), 
            where('brokerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
            // Sort by date descending in the client
            data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setLeads(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar leads: ", error);
            toast({ variant: 'destructive', title: 'Falha ao carregar leads' });
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [user, loadingAuth, toast]);
    
    const handleStatusChange = async (leadId: string, status: LeadStatus) => {
        const leadRef = doc(db, 'broker_leads', leadId);
        try {
            await updateDoc(leadRef, { status });
            toast({ title: "Status do Lead Atualizado!" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erro", description: error.message });
        }
    }

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp?.seconds) return 'Data inválida';
        return format(new Date(timestamp.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const getStatusVariant = (status: LeadStatus) => {
        switch(status) {
            case 'new': return 'default';
            case 'contacted': return 'secondary';
            case 'closed': return 'outline';
            default: return 'outline';
        }
    }
  
   const getStatusText = (status: LeadStatus) => {
    switch(status) {
        case 'new': return 'Novo';
        case 'contacted': return 'Contatado';
        case 'closed': return 'Fechado';
        default: return 'Desconhecido';
    }
  }

    if (isLoading || loadingAuth) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Carregando seus leads...</p>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Inbox/>Meus Leads</CardTitle>
                <CardDescription>Aqui estão os contatos recebidos através do seu site público.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.length > 0 ? leads.map(lead => (
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
                                                <DropdownMenuSubContent>
                                                    {statusOptions.map(option => (
                                                        <DropdownMenuItem key={option.value} onClick={() => handleStatusChange(lead.id, option.value)} disabled={lead.status === option.value}>
                                                            {option.icon}
                                                            {option.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Você ainda não recebeu nenhum lead.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    )
}

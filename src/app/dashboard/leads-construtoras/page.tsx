
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Building2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BuilderLead {
  id: string;
  builderName: string;
  website: string;
  createdAt: Timestamp;
}

export default function LeadsConstrutorasPage() {
  const [leads, setLeads] = useState<BuilderLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<BuilderLead | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'builder_leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuilderLead));
      setLeads(leadsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching builder leads: ", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar leads' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return 'Data inválida';
    return format(new Date(timestamp.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  const openDeleteAlert = (lead: BuilderLead) => {
    setLeadToDelete(lead);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteDoc(doc(db, 'builder_leads', leadToDelete.id));
      toast({ title: 'Lead Deletado' });
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 /> Leads de Construtoras</CardTitle>
          <CardDescription>Visualize os contatos de construtoras interessadas em ser parceiras.</CardDescription>
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
                  <TableHead>Nome da Construtora</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      <TableCell className="font-medium">{lead.builderName}</TableCell>
                      <TableCell>
                        <Button asChild variant="link" className="p-0 h-auto">
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              {lead.website}
                              <LinkIcon className="h-3 w-3" />
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(lead)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum lead de construtora recebido ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação não pode ser desfeita e irá deletar o lead permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

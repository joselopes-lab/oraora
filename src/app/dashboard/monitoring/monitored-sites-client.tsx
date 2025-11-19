'use client';

import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, CheckCircle, AlertCircle, AlertTriangle, LinkIcon, ArrowLeft, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleManualCheck, handleAddSite, handleSingleCheck } from './actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MonitoredSite {
  id: string;
  nome: string;
  url: string;
  ultimaVerificacao: Timestamp | null;
  ultimaVersaoHash: string;
  status: 'pendente' | 'monitorando' | 'mudanca_detectada' | 'erro';
  lastChangedAt?: Timestamp;
}

const SITES_PER_PAGE = 10;
const initialFormState = { success: null, error: null };


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : 'Adicionar Site'}
        </Button>
    )
}

export default function MonitoredSitesClient() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkingIndividual, setCheckingIndividual] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [siteToDelete, setSiteToDelete] = useState<MonitoredSite | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [addState, addAction] = useActionState(handleAddSite, initialFormState);

  useEffect(() => {
    const q = query(collection(db, 'sitesMonitorados'), orderBy('nome'));
    const unsubscribeSites = onSnapshot(q, (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoredSite));
      setSites(sitesData);
      setIsLoading(false);
    });

    return () => {
        unsubscribeSites();
    }
  }, []);
  
  useEffect(() => {
    if(addState.success) {
        toast({ title: "Sucesso!", description: `Site adicionado com sucesso.` });
        formRef.current?.reset();
        setIsDialogOpen(false);
    } else if (addState.error) {
        toast({ variant: 'destructive', title: "Erro ao salvar", description: addState.error });
    }
  }, [addState, toast]);

  const onManualCheck = async () => {
    setIsCheckingAll(true);
    toast({ title: 'Verificação iniciada...', description: 'Aguarde enquanto os sites são verificados.' });
    try {
      const result = await handleManualCheck();
      if (result.success && result.results) {
         setSites(prevSites => 
            prevSites.map(site => {
                const updatedSite = result.results.find(r => r.name === site.nome);
                return updatedSite ? { ...site, status: updatedSite.status, ultimaVerificacao: Timestamp.now() } : site;
            })
        );
        toast({ title: 'Verificação Concluída!', description: 'Os status dos sites foram atualizados.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na verificação' });
    } finally {
      setIsCheckingAll(false);
    }
  };
  
  const onSingleCheck = async (siteId: string) => {
    setCheckingIndividual(siteId);
    try {
        const result = await handleSingleCheck(siteId);
        if (result.success && result.result) {
            setSites(prevSites => 
                prevSites.map(site => 
                    site.id === siteId ? { ...site, status: result.result!.status, ultimaVerificacao: Timestamp.now() } : site
                )
            );
            toast({ title: `Verificação de ${result.result.name} concluída.` });
        } else {
             toast({ variant: 'destructive', title: 'Erro na verificação individual', description: result.error });
        }
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro na verificação individual' });
    } finally {
        setCheckingIndividual(null);
    }
  }

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    try {
      await deleteDoc(doc(db, 'sitesMonitorados', siteToDelete.id));
      toast({ title: 'Site Removido', description: `${siteToDelete.nome} foi removido do monitoramento.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: 'Não foi possível remover o site.' });
    } finally {
      setIsDeleteAlertOpen(false);
      setSiteToDelete(null);
    }
  };

  const formatLastChecked = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Nunca';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ptBR });
  };
  
  const formatLastChanged = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
     return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ptBR });
  };

  const renderStatus = (site: MonitoredSite) => {
    switch (site.status) {
        case 'mudanca_detectada':
            return (
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-600">Mudança Detectada</span>
                </div>
            );
        case 'monitorando':
             return (
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Monitorando</span>
                </div>
            );
        case 'erro':
             return (
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-500">Erro na Verificação</span>
                </div>
            );
        case 'pendente':
        default:
             return <span className="text-muted-foreground">Pendente</span>;
    }
  }
  
  const filteredSites = useMemo(() => {
    if (filterStatus === 'all') return sites;
    return sites.filter(site => site.status === filterStatus);
  }, [sites, filterStatus]);

  const totalPages = Math.ceil(filteredSites.length / SITES_PER_PAGE);
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * SITES_PER_PAGE;
    const endIndex = startIndex + SITES_PER_PAGE;
    return filteredSites.slice(startIndex, endIndex);
  }, [filteredSites, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);


  return (
    <div className="space-y-4">
        <div className="flex justify-end gap-2 items-center">
             <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="mudanca_detectada">Mudança Detectada</SelectItem>
                    <SelectItem value="monitorando">Monitorando</SelectItem>
                    <SelectItem value="erro">Erro na Verificação</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
             </Select>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Adicionar Site</Button>
                </DialogTrigger>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Adicionar Novo Site</DialogTitle>
                        <DialogDescription>
                            Digite o nome e a URL completa do site para iniciar o monitoramento.
                        </DialogDescription>
                    </DialogHeader>
                    <form ref={formRef} action={addAction} className="space-y-4 py-4">
                         <div className="space-y-2">
                            <Label htmlFor="nome">Nome do Site</Label>
                            <Input id="nome" name="nome" placeholder="Ex: Construtora ABC" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" placeholder="https://www.exemplo.com.br" required />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <SubmitButton />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Button size="sm" onClick={onManualCheck} disabled={isCheckingAll}>
                {isCheckingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Verificar Todos
            </Button>
        </div>
      <Card>
          <CardContent className="border-0 p-0">
            {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Última Verificação</TableHead>
                    <TableHead>Última Mudança</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedSites.map((site) => (
                    <TableRow key={site.id} className={site.status === 'mudanca_detectada' ? 'bg-red-100/50 dark:bg-red-900/20' : ''}>
                    <TableCell className="font-medium">{site.nome}</TableCell>
                    <TableCell>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <LinkIcon className="h-4 w-4"/>
                        Acessar
                        </a>
                    </TableCell>
                    <TableCell>{formatLastChecked(site.ultimaVerificacao)}</TableCell>
                    <TableCell>{formatLastChanged(site.lastChangedAt)}</TableCell>
                    <TableCell>
                        {renderStatus(site)}
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onSingleCheck(site.id)} disabled={checkingIndividual === site.id}>
                                {checkingIndividual === site.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setSiteToDelete(site); setIsDeleteAlertOpen(true);}}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
          </CardContent>
          {totalPages > 1 && (
             <CardFooter className="flex justify-center items-center gap-4 pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                <span className="text-sm font-medium">Página {currentPage} / {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próxima<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          )}
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir site do monitoramento?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Esta ação é permanente e irá remover <strong>{siteToDelete?.nome}</strong> da sua lista de monitoramento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSite} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

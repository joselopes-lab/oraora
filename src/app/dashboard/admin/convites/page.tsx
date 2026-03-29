'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, Timestamp } from "firebase/firestore";
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

type InviteRequest = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  experience: string;
  specialty: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
};

export default function InviteRequestsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [requestToDelete, setRequestToDelete] = useState<InviteRequest | null>(null);

  const invitesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'inviteRequests'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: invites, isLoading } = useCollection<InviteRequest>(invitesQuery);

  const filteredInvites = useMemo(() => {
    if (!invites) return [];
    return invites.filter(invite => 
      invite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.whatsapp.includes(searchTerm)
    );
  }, [invites, searchTerm]);

  const handleDelete = () => {
    if (!requestToDelete || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'inviteRequests', requestToDelete.id));
    toast({
      title: "Solicitação excluída",
      description: `A solicitação de ${requestToDelete.name} foi removida.`
    });
    setRequestToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Solicitações de Convite</h1>
          <p className="text-slate-500 mt-1">Gerencie os interessados em entrar para a rede Oraora.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <Input 
              placeholder="Buscar por nome, e-mail, cidade ou WhatsApp..." 
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Total: <span className="text-slate-900 font-bold">{filteredInvites.length}</span> solicitações
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Nome</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">E-mail</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">WhatsApp</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Cidade</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Experiência</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Especialidade</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Data</TableHead>
                <TableHead className="text-right font-bold text-slate-900 uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center p-10 italic text-slate-400">Carregando solicitações...</TableCell></TableRow>
              ) : filteredInvites.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center p-10 italic text-slate-400">Nenhuma solicitação encontrada.</TableCell></TableRow>
              ) : (
                filteredInvites.map((invite) => (
                  <TableRow key={invite.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900">{invite.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{invite.email}</TableCell>
                    <TableCell>
                      <a 
                        href={`https://wa.me/${invite.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary-hover hover:underline font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        {invite.whatsapp}
                      </a>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{invite.city}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
                        {invite.experience}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-green-700 border-none font-bold text-[10px]">
                        {invite.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs font-medium">
                      {invite.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                          <Link href={`/dashboard/admin/users/nova?name=${encodeURIComponent(invite.name)}&email=${encodeURIComponent(invite.email)}`}>
                            <span className="material-symbols-outlined">person_add</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => setRequestToDelete(invite)}>
                              <span className="material-symbols-outlined">delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso removerá o registro de {invite.name} permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

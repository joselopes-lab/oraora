'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Assuming a Property type like this based on usage
type Property = {
  id: string;
  brokerId: string;
  basicInfo: {
    title: string;
  };
  media: string[];
  location: {
    city: string;
    state: string;
  };
};

export default function ImoveisPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: properties, isLoading } = useCollection<Property>(
    useMemo(
      () =>
        user && firestore
          ? query(collection(firestore, 'properties'), where('brokerId', '==', user.uid))
          : null,
      [user, firestore]
    )
  );

  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (propertyToDelete && firestore) {
      try {
        await deleteDoc(doc(firestore, 'properties', propertyToDelete.id));
        toast({
          title: 'Imóvel excluído',
          description: `O imóvel "${propertyToDelete.basicInfo.title}" foi removido com sucesso.`,
        });
      } catch (error) {
        toast({
          title: 'Erro ao excluir imóvel',
          description: 'Ocorreu um erro ao tentar remover o imóvel. Tente novamente.',
          variant: 'destructive',
        });
      }
      setPropertyToDelete(null);
    }
  };

  if (isLoading) {
    return <div>Carregando imóveis...</div>;
  }

  return (
    <main className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Imóveis</h1>
        <Button asChild>
          <Link href="/dashboard/imoveis/novo">Cadastrar Imóvel</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties && properties.length > 0 ? (
              properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Image
                        src={p.media?.[0] || 'https://placehold.co/100x70'}
                        alt={p.basicInfo.title}
                        width={100}
                        height={70}
                        className="rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold">{p.basicInfo.title}</p>
                        <p className="text-sm text-gray-500">{`${p.location.city}, ${p.location.state}`}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/imoveis/editar/${p.id}`}>
                            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setPropertyToDelete(p)}
                        >
                            <span className="material-symbols-outlined text-xl">delete</span>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12">
                  <p className="text-gray-500">Nenhum imóvel encontrado.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={!!propertyToDelete} onOpenChange={() => setPropertyToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir Imóvel?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação é permanente e removerá o imóvel "{propertyToDelete?.basicInfo.title}" do seu banco de dados.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

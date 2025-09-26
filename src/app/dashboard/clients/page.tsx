
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string; // This is the document ID, which is the same as uid
  uid: string;
  name: string;
  email: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'Active' | 'Inactive';
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
        collection(db, 'users'), 
        where('roleId', '==', null)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      // Sort clients by name client-side
      clientsData.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching clients: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const formatDate = (timestamp: Client['createdAt']) => {
    if (!timestamp || !timestamp.seconds) {
      return 'Data não disponível';
    }
    const date = new Date(timestamp.seconds * 1000);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> Clientes Finais</CardTitle>
        <CardDescription>Visualize os clientes que se cadastraram na plataforma.</CardDescription>
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
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <span>{client.name}</span>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'Active' ? 'secondary' : 'outline'}>
                        {client.status === 'Active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum cliente final encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

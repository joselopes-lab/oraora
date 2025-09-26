
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, User, Mail, Phone, MapPin, Loader2, Inbox } from 'lucide-react';

interface BrokerLocation {
    state: string;
    city: string;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  locations: BrokerLocation[];
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  propertySlug?: string;
  createdAt: Timestamp;
}


export default function BrokerDetailPage() {
  const params = useParams();
  const brokerId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [broker, setBroker] = useState<Broker | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brokerId) return;

    const fetchBrokerAndLeads = async () => {
      setIsLoading(true);
      try {
        // Fetch broker data
        const brokerDocRef = doc(db, 'brokers', brokerId);
        const brokerDocSnap = await getDoc(brokerDocRef);

        if (!brokerDocSnap.exists()) {
          notFound();
          return;
        }
        setBroker({ id: brokerDocSnap.id, ...brokerDocSnap.data() } as Broker);

        // Fetch associated leads
        const leadsQuery = query(
          collection(db, 'leads'),
          where('brokerId', '==', brokerId)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        setLeads(leadsData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrokerAndLeads();
  }, [brokerId]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return 'Data inválida';
    }
    const date = new Date(timestamp.seconds * 1000);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando dados do corretor...</p>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Corretor não encontrado</h2>
        <Link href="/dashboard/brokers" passHref>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/brokers" passHref>
        <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Lista de Corretores
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <span>{broker.name}</span>
          </CardTitle>
          <CardDescription>Informações de contato e cidades de atuação.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{broker.whatsapp || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{broker.email || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                    {broker.locations.map((loc, index) => (
                        <Badge key={index} variant="secondary">{loc.city} - {loc.state}</Badge>
                    ))}
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Inbox />
                <CardTitle>Leads Recebidos</CardTitle>
            </div>
            <Badge variant="secondary" className="text-base">
                {leads.length} {leads.length === 1 ? 'Lead' : 'Leads'}
            </Badge>
          </div>
          <CardDescription className="pt-2">
            Lista de todos os contatos direcionados para {broker.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead>Imóvel de Interesse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                       {lead.name}
                       <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </TableCell>
                    <TableCell>
                       <Link href={`/dashboard/properties/${lead.propertySlug || lead.propertyId}`} className="hover:underline">
                         {lead.propertyName}
                       </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum lead encontrado para este corretor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

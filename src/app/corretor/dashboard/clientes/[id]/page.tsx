
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Query, DocumentData, documentId } from 'firebase/firestore';
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
import { ArrowLeft, User, Mail, Phone, Home, Loader2, Users, FileText } from 'lucide-react';
import { type Client } from '../../page';
import { type Persona } from '@/app/dashboard/personas/page';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyCard from '@/components/property-card';
import { queryInBatches } from '@/lib/firestoreUtils';


export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [client, setClient] = useState<Client | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clientDocRef = doc(db, 'broker_clients', clientId);
        const clientDocSnap = await getDoc(clientDocRef);

        if (!clientDocSnap.exists()) {
          notFound();
          return;
        }
        
        const clientData = { id: clientDocSnap.id, ...clientDocSnap.data() } as Client;
        setClient(clientData);

        if (clientData.personaId && clientData.personaId !== 'none') {
          const personaDocRef = doc(db, 'personas', clientData.personaId);
          const personaDocSnap = await getDoc(personaDocRef);
          if (personaDocSnap.exists()) {
            const personaData = { id: personaDocSnap.id, ...personaDocSnap.data() } as Persona;
            setPersona(personaData);
            
            // Fetch properties based on persona
            let propertiesQuery: Query<DocumentData> = query(
              collection(db, 'properties'),
              where('isVisibleOnSite', '==', true),
              where('personaIds', 'array-contains', clientData.personaId)
            );
            const propertiesSnapshot = await getDocs(propertiesQuery);
            const propsData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            setProperties(propsData);

          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId]);


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <Link href="/corretor/dashboard" passHref>
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
      <Link href="/corretor/dashboard" passHref>
        <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Meus Clientes
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <span>{client.name}</span>
          </CardTitle>
          <CardDescription>Informações de contato e perfil do cliente.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{client.email || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{client.phone || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                 <Badge variant="secondary">{client.personaName || 'Persona não definida'}</Badge>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
              <Home />
              <CardTitle>Imóveis Compatíveis</CardTitle>
          </div>
          <CardDescription className="pt-2">
            {persona ? `Imóveis que correspondem ao perfil "${persona.name}".` : 'Nenhuma persona foi definida para este cliente.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(prop => (
                       <div key={prop.id} className="flex flex-col">
                           <PropertyCard property={prop} hideClientActions />
                           <Button asChild className="mt-2 bg-[#83e800] text-black hover:bg-[#72c900]">
                               <Link href={`/imoveis/${prop.slug}`} target="_blank">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Detalhes do Imóvel
                               </Link>
                           </Button>
                       </div>
                    ))}
                </div>
            ) : (
                 <div className="h-24 text-center flex items-center justify-center">
                    <p>Nenhum imóvel compatível encontrado.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

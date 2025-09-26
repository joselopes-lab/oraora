
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { type Persona } from '../page';
import { type Property } from '../../properties/page';
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
import { ArrowLeft, User, Home, Loader2, Pencil, Trash2, ImageOff } from 'lucide-react';
import { queryInBatches } from '@/lib/firestoreUtils';

export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [persona, setPersona] = useState<Persona | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!personaId) return;

    const fetchPersonaAndProperties = async () => {
      setIsLoading(true);
      try {
        const personaDocRef = doc(db, 'personas', personaId);
        const personaDocSnap = await getDoc(personaDocRef);

        if (!personaDocSnap.exists()) {
          notFound();
          return;
        }
        const personaData = { id: personaDocSnap.id, ...personaDocSnap.data() } as Persona;
        setPersona(personaData);
        
        // First, get all property IDs that have this persona
        const propertiesWithPersonaQuery = query(collection(db, 'properties'), where('personaIds', 'array-contains', personaId));
        const propertiesWithPersonaSnapshot = await getDocs(propertiesWithPersonaQuery);
        const propertyIds = propertiesWithPersonaSnapshot.docs.map(doc => doc.id);

        if (propertyIds.length > 0) {
            // Then, fetch the full property data in batches, ensuring they are visible
            const propertiesData = await queryInBatches<Property>(
                'properties',
                documentId(),
                propertyIds,
                [where('isVisibleOnSite', '==', true)]
            );
            setProperties(propertiesData);
        } else {
            setProperties([]);
        }

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonaAndProperties();
  }, [personaId]);

  const handleEdit = () => {
    router.push(`/dashboard/personas?edit=${personaId}`);
  }

  const handleDelete = () => {
     router.push(`/dashboard/personas?delete=${personaId}`);
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando dados da persona...</p>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Persona não encontrada</h2>
        <Link href="/dashboard/personas" passHref>
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
       <div className="flex justify-between items-center">
        <Link href="/dashboard/personas" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Lista de Personas
            </Button>
        </Link>
        <div className="flex gap-2">
            <Button size="sm" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4"/>
                Editar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4"/>
                Excluir
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-6">
          <div className="relative aspect-video md:aspect-square w-full md:w-48 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {persona.imageUrl ? (
              <Image src={persona.imageUrl} alt={persona.name} fill className="object-cover" />
            ) : (
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-3xl">
              <User className="h-8 w-8 text-primary" />
              <span>{persona.name}</span>
            </CardTitle>
            <CardDescription className="text-base">{persona.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Home />
                <CardTitle>Imóveis Compatíveis</CardTitle>
            </div>
            <Badge variant="secondary" className="text-base">
                {properties.length} {properties.length === 1 ? 'Imóvel' : 'Imóveis'}
            </Badge>
          </div>
          <CardDescription className="pt-2">
            Lista de imóveis que correspondem aos critérios da persona {persona.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Imóvel</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length > 0 ? (
                properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">
                       <Link href={`/dashboard/properties/${prop.slug || prop.id}`} className="hover:underline">
                         {prop.informacoesbasicas.nome}
                       </Link>
                    </TableCell>
                    <TableCell>{prop.caracteristicasimovel?.tipo || 'N/A'}</TableCell>
                    <TableCell>{prop.localizacao.cidade} / {prop.localizacao.estado}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum imóvel compatível encontrado.
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

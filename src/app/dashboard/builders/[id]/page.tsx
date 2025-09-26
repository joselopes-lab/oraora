
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
import { ArrowLeft, Building2, Mail, Phone, Instagram, Home, Loader2, FilePen, Trash2, ImageOff } from 'lucide-react';
import Image from 'next/image';

interface Builder {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  state: string;
  city: string;
  instagram: string;
  phone: string;
  whatsapp: string;
  email: string;
}

interface Property {
  id: string;
  informacoesbasicas: {
    nome: string;
  };
  localizacao: {
    cidade?: string;
    estado?: string;
  };
  caracteristicasimovel: {
    tipo?: string;
  };
}


export default function BuilderDetailPage() {
  const params = useParams();
  const builderId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!builderId) return;

    const fetchBuilderAndProperties = async () => {
      setIsLoading(true);
      try {
        // Fetch builder data
        const builderDocRef = doc(db, 'builders', builderId);
        const builderDocSnap = await getDoc(builderDocRef);

        if (!builderDocSnap.exists()) {
          notFound();
          return;
        }
        setBuilder({ id: builderDocSnap.id, ...builderDocSnap.data() } as Builder);

        // Fetch associated properties
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('builderId', '==', builderId)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propertiesData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(propertiesData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        // Handle error display
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilderAndProperties();
  }, [builderId]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando dados da construtora...</p>
      </div>
    );
  }

  if (!builder) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Construtora não encontrada</h2>
        <Link href="/dashboard/builders" passHref>
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
      <Link href="/dashboard/builders" passHref>
        <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Lista de Construtoras
        </Button>
      </Link>
      
      <Card>
        <CardHeader className="flex flex-row gap-6 items-center">
           <div className="relative w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {builder.logoUrl ? (
                    <Image src={builder.logoUrl} alt={builder.name} fill className="object-contain p-2 rounded-lg" />
                ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                )}
            </div>
            <div className="space-y-1">
                <CardTitle className="text-3xl">
                    {builder.name}
                </CardTitle>
                <CardDescription>{builder.address}, {builder.city} - {builder.state}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{builder.phone || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{builder.email || 'Não informado'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <a href={builder.instagram ? `https://instagram.com/${builder.instagram.replace('@','')}`: '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {builder.instagram || 'Não informado'}
                </a>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home />
            Imóveis da Construtora
          </CardTitle>
          <CardDescription>
            Lista de todos os imóveis cadastrados para {builder.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Imóvel</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length > 0 ? (
                properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">
                       <Link href={`/dashboard/properties/${prop.id}`} className="hover:underline">
                         {prop.informacoesbasicas.nome}
                       </Link>
                    </TableCell>
                    <TableCell>{prop.caracteristicasimovel?.tipo || 'N/A'}</TableCell>
                    <TableCell>{prop.localizacao.cidade} / {prop.localizacao.estado}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                           <Link href={`/dashboard/properties?edit=${prop.id}`}>
                                <FilePen className="h-4 w-4" />
                                <span className="sr-only">Editar Imóvel</span>
                           </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" asChild>
                            <Link href={`/dashboard/properties?delete=${prop.id}`}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Deletar Imóvel</span>
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum imóvel encontrado para esta construtora.
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

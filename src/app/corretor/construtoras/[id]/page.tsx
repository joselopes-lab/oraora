
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import { ArrowLeft, Building2, Mail, Phone, Instagram, Home, Loader2, FileText, PlusCircle, CheckCircle } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';

interface Builder {
  id: string;
  name: string;
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
  slug: string;
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


export default function BuilderDetailPageCorretor() {
  const params = useParams();
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const builderId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!builderId) return;

    const fetchBuilderAndProperties = async () => {
      setIsLoading(true);
      try {
        const builderDocRef = doc(db, 'builders', builderId);
        const builderDocSnap = await getDoc(builderDocRef);

        if (!builderDocSnap.exists() || !builderDocSnap.data().isVisibleOnSite) {
          notFound();
          return;
        }
        setBuilder({ id: builderDocSnap.id, ...builderDocSnap.data() } as Builder);

        const propertiesQuery = query(
          collection(db, 'properties'),
          where('builderId', '==', builderId),
          where('isVisibleOnSite', '==', true)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propertiesData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(propertiesData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilderAndProperties();
  }, [builderId]);
  
  useEffect(() => {
      if (!user || !builderId || properties.length === 0) return;
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(doc => {
          if (doc.exists()) {
              const portfolioIds = doc.data().portfolioPropertyIds || [];
              const builderPropertyIds = properties.map(p => p.id);
              // Considered in portfolio if all properties of this builder are in the portfolio
              const allInPortfolio = builderPropertyIds.every(id => portfolioIds.includes(id));
              setIsInPortfolio(allInPortfolio);
          }
      });
  }, [user, builderId, properties]);

  const togglePortfolio = async () => {
    if (!user || !builderId || properties.length === 0) return;
    const userDocRef = doc(db, 'users', user.uid);
    const builderPropertyIds = properties.map(p => p.id);

    try {
        if (isInPortfolio) {
            await updateDoc(userDocRef, { portfolioPropertyIds: arrayRemove(...builderPropertyIds) });
            toast({ title: "Removido da Carteira!" });
            setIsInPortfolio(false);
        } else {
            await updateDoc(userDocRef, { portfolioPropertyIds: arrayUnion(...builderPropertyIds) });
            toast({ title: "Adicionado à Carteira!" });
            setIsInPortfolio(true);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Erro ao atualizar a carteira." });
    }
  };

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
        <Link href="/corretor/construtoras" passHref>
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
        <Link href="/corretor/construtoras" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Lista de Construtoras
            </Button>
        </Link>
        <Button 
            variant={isInPortfolio ? 'secondary' : 'default'} 
            onClick={togglePortfolio}
        >
            {isInPortfolio ? <CheckCircle className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
            {isInPortfolio ? 'Na sua carteira' : 'Adicionar à carteira'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span>{builder.name}</span>
          </CardTitle>
          <CardDescription>{builder.address}, {builder.city} - {builder.state}</CardDescription>
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
            Lista de imóveis de {builder.name} disponíveis no site.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(prop => (
                       <div key={prop.id} className="flex flex-col">
                           <PropertyCard property={prop as any} hideClientActions />
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
                    <p>Nenhum imóvel encontrado para esta construtora.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, Mail, Phone, Instagram, Home, Loader2, Link as LinkIcon, PlusCircle } from 'lucide-react';
import { usePropertyActions } from '@/hooks/use-property-actions';
import { type Property } from '../../properties/page';
import PropertyCard from '@/components/property-card';
import { useToast } from '@/hooks/use-toast';
import { extractPropertyData } from '@/ai/flows/extract-property-data-flow';
import PropertyForm from '@/components/property-form';


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

export default function BuilderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const builderId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlToExtract, setUrlToExtract] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [propertyToCreate, setPropertyToCreate] = useState<Partial<Property> | null>(null);


  const { 
    selectedProperty, 
    isSheetOpen, 
    handleViewDetails, 
    setIsSheetOpen,
    PropertyDetailSheet
  } = usePropertyActions({ id: builder?.id || '', name: builder?.name || '', whatsapp: builder?.whatsapp });


  useEffect(() => {
    if (!builderId) return;

    const fetchBuilderAndProperties = async () => {
      setIsLoading(true);
      try {
        const builderDocRef = doc(db, 'builders', builderId);
        const builderDocSnap = await getDoc(builderDocRef);

        if (!builderDocSnap.exists()) {
          notFound();
          return;
        }
        setBuilder({ id: builderDocSnap.id, ...builderDocSnap.data() } as Builder);

        const propertiesQuery = query(
          collection(db, 'properties'),
          where('builderId', '==', builderId)
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

  const handleExtractData = async () => {
    if (!urlToExtract) {
        toast({ variant: 'destructive', title: 'URL é obrigatória' });
        return;
    }
    setIsExtracting(true);
    
    // Open the URL in a new tab for debugging
    window.open(urlToExtract, '_blank');

    try {
        const result = await extractPropertyData({ url: urlToExtract });

        if (result) {
            const newProperty: Partial<Property> = {
                informacoesbasicas: {
                    nome: result.nome || '',
                    descricao: result.descricao || '',
                    valor: result.valor,
                    status: result.status,
                },
                localizacao: {
                    cidade: result.cidade,
                    estado: result.estado,
                    bairro: result.bairro,
                    googleMapsLink: result.endereco
                },
                caracteristicasimovel: {
                    tamanho: result.tamanho,
                    tipo: result.tipo,
                    unidades: {
                        quartos: result.quartos ? [result.quartos] : [],
                        vagasgaragem: result.vagas,
                    }
                },
                areascomuns: result.areasLazer,
                midia: result.midia,
                builderId: builder?.id,
                contato: { 
                    construtora: result.construtora || builder?.name || ''
                }
            };
            setPropertyToCreate(newProperty);
            setIsPropertyFormOpen(true);
            setIsModalOpen(false); // close the extraction modal
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao extrair dados', description: error.message });
    } finally {
        setIsExtracting(false);
    }
  }
  
  const handlePropertyFormClose = () => {
      setIsPropertyFormOpen(false);
      setPropertyToCreate(null);
  }

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
       <div className="flex justify-between items-center">
        <Link href="/dashboard/builders" passHref>
          <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Lista de Construtoras
          </Button>
        </Link>
        <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push(`/dashboard/properties/edit/new?builderId=${builder.id}`)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Adicionar Imóvel
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="secondary">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Adicionar por URL
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extrair Dados de Imóvel</DialogTitle>
                        <DialogDescription>
                            Cole a URL da página do imóvel e a IA tentará extrair os dados para o cadastro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="property-url">URL do Imóvel</Label>
                        <Input 
                            id="property-url"
                            value={urlToExtract}
                            onChange={(e) => setUrlToExtract(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isExtracting}>Cancelar</Button>
                        <Button onClick={handleExtractData} disabled={isExtracting}>
                            {isExtracting ? <Loader2 className="animate-spin" /> : "Extrair e Cadastrar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      
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
                 <a href={builder.instagram ? `https://instagram.com/${builder.instagram.replace('@', '')}` : '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
            {properties.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.map(prop => (
                       <PropertyCard 
                            key={prop.id} 
                            property={prop} 
                            layout="horizontal" 
                            variant="default"
                            hideClientActions={true}
                            onViewDetails={() => handleViewDetails(prop)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="h-24 text-center flex items-center justify-center bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Nenhum imóvel encontrado para esta construtora.</p>
                </div>
            )}
        </CardContent>
      </Card>

      {selectedProperty && (
        <PropertyDetailSheet 
            property={selectedProperty} 
            brokerId={builder.id} 
            isOpen={isSheetOpen} 
            onOpenChange={setIsSheetOpen} 
        />
      )}
       <Dialog open={isPropertyFormOpen} onOpenChange={handlePropertyFormClose}>
        <DialogContent className="max-w-4xl h-[90vh]">
            <PropertyForm 
                initialData={propertyToCreate}
                onSave={() => {
                    handlePropertyFormClose();
                    // You might want to re-fetch properties here or simply trust the snapshot listener
                }}
                onCancel={handlePropertyFormClose}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}

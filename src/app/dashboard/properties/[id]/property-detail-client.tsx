
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type Property } from '../page'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Building2, MapPin, BedDouble, CheckSquare, Smartphone, Link as LinkIcon, Pencil, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Persona } from '../../personas/page';

interface Builder {
  id: string;
  name: string;
}

interface PropertyDetailClientProps {
    property: Property;
    builder: Builder | null;
}

function getEmbedUrl(embedCode: string): string | null {
  if (!embedCode) return null;

  try {
    const iframeSrcMatch = embedCode.match(/src="([^"]+)"/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1];
    }
    
    // Fallback for just a URL
    if (embedCode.includes('/maps/embed/') || embedCode.includes('google.com/maps/embed')) {
      return embedCode;
    }

    return null;
  } catch (error) {
    console.error("Error parsing embed code:", error);
    return null;
  }
}

export default function PropertyDetailClient({ property, builder }: PropertyDetailClientProps) {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    const fetchPersonas = async () => {
        if (property.personaIds && property.personaIds.length > 0) {
            const personasQuery = query(collection(db, 'personas'), where('__name__', 'in', property.personaIds));
            const querySnapshot = await getDocs(personasQuery);
            const personasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona));
            setPersonas(personasData);
        }
    };
    fetchPersonas();
  }, [property.personaIds]);
  
  const mapsEmbedUrl = property?.localizacao.googleMapsLink ? getEmbedUrl(property.localizacao.googleMapsLink) : null;
  const streetViewEmbedUrl = property?.localizacao.googleStreetViewLink ? getEmbedUrl(property.localizacao.googleStreetViewLink) : null;
  
  const featuredImage = property.midia && property.midia.length > 0 ? property.midia[0] : 'https://placehold.co/1280x720.png';

  const handleEdit = () => {
    router.push(`/dashboard/properties?edit=${property.id}`);
  }

  const handleDelete = () => {
     router.push(`/dashboard/properties?delete=${property.id}`);
  }

  const renderDetail = (label: string, value: string | undefined | null) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p>{value || 'Não informado'}</p>
    </div>
  );
  
  const renderLink = (label: string, url: string | undefined | null) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {url && url !== 'não informado' ? (
             <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                Acessar Link
            </a>
        ) : <p>Não informado</p>}
    </div>
  )

  const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (Array.isArray(bedrooms)) {
      return bedrooms.join(', ');
    }
    return bedrooms || 'Não informado';
  };
  
  const fullLocation = [property.localizacao.bairro, property.localizacao.cidade, property.localizacao.estado].filter(Boolean).join(', ');


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <Link href="/dashboard/properties" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Lista de Imóveis
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
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <Home className="h-8 w-8 text-primary" />
            <span>{property.informacoesbasicas.nome}</span>
          </CardTitle>
          {builder && (
             <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4"/>
              <span>Por: <Link href={`/dashboard/builders/${builder.id}`} className="text-primary hover:underline">{builder.name}</Link></span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
             <div className="relative aspect-video w-full mb-6">
                <Image 
                    src={featuredImage} 
                    alt={`Imagem de destaque de ${property.informacoesbasicas.nome}`} 
                    fill
                    sizes="100vw"
                    className="object-cover rounded-lg"
                    data-ai-hint="property exterior" 
                />
            </div>
            <p className="text-muted-foreground">{property.informacoesbasicas.descricao}</p>
        </CardContent>
      </Card>
      
      {property.midia && property.midia.length > 0 && (
         <Card>
            <CardHeader><CardTitle>Galeria de Mídia</CardTitle></CardHeader>
            <CardContent>
                 <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                        {property.midia.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                            <Card>
                                <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                                     <Image src={url} alt={`Imagem ${index + 1} de ${property.informacoesbasicas.nome}`} fill sizes="100vw" className="object-cover rounded-lg"/>
                                </CardContent>
                            </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </CardContent>
         </Card>
      )}


      <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-4">
        <AccordionItem value="item-1" className="border rounded-lg">
           <AccordionTrigger className="px-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5"/>
              <span className="font-semibold">Localização e Detalhes</span>
            </div>
           </AccordionTrigger>
           <AccordionContent className="px-6 pt-4 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {renderDetail('Endereço Completo', fullLocation)}
               {renderDetail('Status', property.informacoesbasicas.status)}
               {renderDetail('Previsão de Entrega', property.informacoesbasicas.previsaoentrega)}
             </div>
            {mapsEmbedUrl ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                     <iframe
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapsEmbedUrl}>
                    </iframe>
                </div>
            ) : (
                renderDetail('Google Maps', 'Código de incorporação do Google Maps não fornecido ou inválido.')
            )}
            {streetViewEmbedUrl && (
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                     <iframe
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={streetViewEmbedUrl}>
                    </iframe>
                </div>
            )}
           </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" className="border rounded-lg">
            <AccordionTrigger className="px-6">
                <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5"/>
                <span className="font-semibold">Características do Imóvel</span>
                </div>
            </AccordionTrigger>
           <AccordionContent className="px-6 pt-4">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderDetail('Tipo', property.caracteristicasimovel.tipo)}
                {renderDetail('Tamanho', property.caracteristicasimovel.tamanho)}
                {renderDetail('Quartos', displayBedrooms(property.caracteristicasimovel.unidades?.quartos))}
                {renderDetail('Vagas de Garagem', property.caracteristicasimovel.unidades?.vagasgaragem)}
            </div>
           </AccordionContent>
        </AccordionItem>

        {personas.length > 0 && (
             <AccordionItem value="item-personas" className="border rounded-lg">
                <AccordionTrigger className="px-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5"/>
                        <span className="font-semibold">Personas Associadas</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-4">
                    <div className="flex flex-wrap gap-2">
                        {personas.map(p => (
                            <Badge key={p.id} variant="secondary">{p.name}</Badge>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        )}
        
        {property.areascomuns && property.areascomuns.length > 0 && (
        <AccordionItem value="item-3" className="border rounded-lg">
            <AccordionTrigger className="px-6">
                <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5"/>
                    <span className="font-semibold">Áreas Comuns</span>
                </div>
            </AccordionTrigger>
           <AccordionContent className="px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                    {property.areascomuns.map(item => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                    ))}
                </div>
           </AccordionContent>
        </AccordionItem>
        )}

        <AccordionItem value="item-5" className="border rounded-lg">
            <AccordionTrigger className="px-6">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5"/>
                    <span className="font-semibold">Informações de Contato</span>
                </div>
            </AccordionTrigger>
           <AccordionContent className="px-6 pt-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderDetail('Construtora', property.contato.construtora)}
                    {renderDetail('Telefone', property.contato.telefone)}
                    {renderDetail('WhatsApp', property.contato.whatsapp)}
                    {renderDetail('Email', property.contato.email)}
                    {renderLink('Website', property.contato.website)}
                    {renderLink('Facebook', property.contato.redessociais?.facebook)}
                    {renderLink('Instagram', property.contato.redessociais?.instagram)}
                    {renderLink('YouTube', property.contato.redessociais?.youtube)}
                </div>
           </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

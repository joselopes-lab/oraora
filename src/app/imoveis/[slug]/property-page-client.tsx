
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { type Property } from '@/app/dashboard/properties/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Building, BedDouble, Car, Link as LinkIcon, Ruler, ImageOff, Check, Send, User, Mail, Phone, ShoppingCart, Utensils, School, Trees, Hospital, Banknote, Bus, Fuel, University, Stethoscope, HelpCircle } from 'lucide-react';
import { handleWhatsAppRedirect, handleContactFormSubmit } from './actions';
import { useToast } from '@/hooks/use-toast';
import { FaWhatsapp } from 'react-icons/fa';
import PropertyCard from '@/components/property-card';
import { type State } from './actions';
import Link from 'next/link';
import { incrementPropertyView } from '../actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const initialWhatsAppState: State = {
  success: null,
  error: null,
  whatsappUrl: null,
};

const initialContactFormState: State = {
    success: null,
    error: null,
    message: null,
}

const proximidadesIconMap: { [key: string]: React.ElementType } = {
    "Supermercado": ShoppingCart,
    "Shopping": ShoppingCart,
    "Escola": School,
    "Universidade": University,
    "Farmácia": Stethoscope,
    "Hospital": Hospital,
    "Restaurante": Utensils,
    "Padaria": Utensils,
    "Banco": Banknote,
    "Parque / Praça": Trees,
    "Praia": Trees,
    "Transporte Público": Bus,
    "Academia": Stethoscope,
    "Posto de Combustível": Fuel,
};


const formatPriceLarge = (value: number | undefined) => {
    if (value === undefined || value === null) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (!bedrooms || bedrooms.length === 0) return 'N/A';
    if (Array.isArray(bedrooms)) {
      return bedrooms.join(', ');
    }
    return bedrooms;
  };

function WhatsAppSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Falar com corretor
        </Button>
    )
}

function ContactFormSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Contato'}
        </Button>
    )
}

interface WhatsAppDialogProps {
    property: Property;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
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

export function WhatsAppDialog({ property, isOpen, onOpenChange }: WhatsAppDialogProps) {
    const { toast } = useToast();
    const whatsAppFormRef = useRef<HTMLFormElement>(null);
    const [whatsAppState, whatsAppAction] = useActionState(handleWhatsAppRedirect, initialWhatsAppState);

    useEffect(() => {
        if (whatsAppState.success === false && whatsAppState.error) {
           toast({ variant: 'destructive', title: "Erro", description: whatsAppState.error });
        } else if (whatsAppState.success === true && whatsAppState.whatsappUrl) {
            window.open(whatsAppState.whatsappUrl, '_blank');
            toast({ title: "Sucesso!", description: "Você está sendo redirecionado para o WhatsApp." });
            whatsAppFormRef.current?.reset();
            onOpenChange(false);
        }
    }, [whatsAppState, toast, onOpenChange]);


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fale com um corretor</DialogTitle>
                    <DialogDescription>
                        Preencha seus dados para ser direcionado a um corretor especialista.
                    </DialogDescription>
                </DialogHeader>
                <form ref={whatsAppFormRef} action={whatsAppAction} className="space-y-4">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="propertyName" value={property.informacoesbasicas.nome} />
                    <input type="hidden" name="propertySlug" value={property.slug} />
                    <input type="hidden" name="propertyCity" value={property.localizacao.cidade || ''} />
                    <input type="hidden" name="propertyState" value={property.localizacao.estado || ''} />
                    
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" name="name" placeholder="Digite seu nome" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Digite seu email" required />
                    </div>
                    <DialogFooter>
                        <WhatsAppSubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface PropertyPageClientProps {
    property: Property;
    relatedProperties: Property[];
}

function getYoutubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Invalid YouTube URL:', error);
    return null;
  }
}

export default function PropertyPageClient({ property, relatedProperties }: PropertyPageClientProps) {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  
  const { toast } = useToast();

  const contactFormRef = useRef<HTMLFormElement>(null);
  const [contactFormState, contactFormAction] = useActionState(handleContactFormSubmit, initialContactFormState);
  
  const mapsEmbedUrl = property?.localizacao.googleMapsLink ? getEmbedUrl(property.localizacao.googleMapsLink) : null;
  const streetViewEmbedUrl = property?.localizacao.googleStreetViewLink ? getEmbedUrl(property.localizacao.googleStreetViewLink) : null;
  const youtubeEmbedUrl = getYoutubeEmbedUrl(property.youtubeVideoUrl);


  useEffect(() => {
    // Increment view count when component mounts
    incrementPropertyView(property.id);
  }, [property.id]);

  useEffect(() => {
    if (contactFormState.success === false && contactFormState.error) {
       toast({ variant: 'destructive', title: "Erro", description: contactFormState.error });
    } else if (contactFormState.success === true && contactFormState.message) {
        toast({ title: "Sucesso!", description: contactFormState.message });
        contactFormRef.current?.reset();
    }
  }, [contactFormState, toast]);
    
  const priceDisplay = formatPriceLarge(property.informacoesbasicas.valor);
  
  const images = property.midia || [];

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">{property.informacoesbasicas.nome}</h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary"/>
                    {property.localizacao.cidade}, {property.localizacao.estado}
                </p>
            </div>

            {images.length > 0 ? (
                <Carousel className="w-full shadow-lg rounded-lg">
                    <CarouselContent>
                        {images.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-video relative">
                            <Image
                                src={url}
                                alt={`Imagem ${index + 1} de ${property.informacoesbasicas.nome}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 80vw"
                                className="object-cover rounded-lg"
                                data-ai-hint="building interior"
                            />
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    {images.length > 1 && (
                        <>
                            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
                        </>
                    )}
                </Carousel>
            ) : (
                !youtubeEmbedUrl && (
                    <div className="relative grid h-96 w-full place-items-center overflow-hidden rounded-lg bg-muted shadow-lg">
                        <ImageOff className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Nenhuma imagem disponível</p>
                    </div>
                )
            )}
         
          <div className="p-6 rounded-lg bg-card border-0 shadow-none">
              <p className="text-sm text-muted-foreground">A partir de:</p>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-foreground">{priceDisplay}</p>
                 {property.informacoesbasicas.valor && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>O valor pode sofrer alterações sem aviso prévio.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
              </div>
          </div>
          
          <Card>
              <CardHeader><CardTitle>Características</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <BedDouble className="h-7 w-7 text-foreground" />
                      <div>
                          <p className="text-sm text-muted-foreground">Quartos</p>
                          <p className="font-semibold">{displayBedrooms(property.caracteristicasimovel.unidades.quartos)}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Car className="h-7 w-7 text-foreground" />
                      <div>
                          <p className="text-sm text-muted-foreground">Vagas</p>
                          <p className="font-semibold">{property.caracteristicasimovel.unidades.vagasgaragem || 'N/A'}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Ruler className="h-7 w-7 text-foreground" />
                      <div>
                          <p className="text-sm text-muted-foreground">Área</p>
                          <p className="font-semibold">{property.caracteristicasimovel.tamanho || 'N/A'}</p>
                      </div>
                  </div>
                    <div className="flex items-center gap-3">
                      <Building className="h-7 w-7 text-foreground" />
                      <div>
                          <p className="text-sm text-muted-foreground">Tipo</p>
                          <p className="font-semibold">{property.caracteristicasimovel.tipo || 'N/A'}</p>
                      </div>
                  </div>
              </CardContent>
          </Card>

           {youtubeEmbedUrl && (
                <Card>
                    <CardContent className="p-0">
                        <div className="aspect-video w-full rounded-lg overflow-hidden">
                            <iframe
                                width="100%"
                                height="100%"
                                src={youtubeEmbedUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </CardContent>
                </Card>
            )}

          <Card>
              <CardHeader>
                  <CardTitle>Sobre o imóvel</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{property.informacoesbasicas.descricao}</p>
              </CardContent>
          </Card>

            {property.areascomuns && property.areascomuns.length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Área comum</CardTitle></CardHeader>
                  <CardContent>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                          {property.areascomuns.map(item => (
                              <li key={item} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-600"/>
                                <span className="text-foreground">{item}</span>
                              </li>
                          ))}
                      </ul>
                  </CardContent>
              </Card>
          )}

            {property.proximidades && property.proximidades.length > 0 && (
              <Card>
                  <CardHeader><CardTitle>Proximidades e Conveniências</CardTitle></CardHeader>
                  <CardContent>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                          {property.proximidades.map(item => {
                              const Icon = proximidadesIconMap[item] || Check;
                              return (
                                <li key={item} className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary"/>
                                    <span className="text-foreground">{item}</span>
                                </li>
                              )
                          })}
                      </ul>
                  </CardContent>
              </Card>
          )}


          {(mapsEmbedUrl || streetViewEmbedUrl) && (
            <Card>
              <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
              <CardContent>
                <Tabs defaultValue="map" className="w-full">
                  <TabsList>
                    {mapsEmbedUrl && <TabsTrigger value="map">Mapa</TabsTrigger>}
                    {streetViewEmbedUrl && <TabsTrigger value="streetview">Street View</TabsTrigger>}
                  </TabsList>
                  {mapsEmbedUrl && (
                    <TabsContent value="map">
                      <div className="aspect-video w-full rounded-lg overflow-hidden border mt-4">
                        <iframe
                          width="100%"
                          height="100%"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={mapsEmbedUrl}>
                        </iframe>
                      </div>
                    </TabsContent>
                  )}
                  {streetViewEmbedUrl && (
                    <TabsContent value="streetview">
                       <div className="aspect-video w-full rounded-lg overflow-hidden border mt-4">
                        <iframe
                          width="100%"
                          height="100%"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={streetViewEmbedUrl}>
                        </iframe>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}

        </div>
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
            <Card className="shadow-lg border bg-secondary/30">
                <CardHeader>
                    <CardTitle className="text-center">Tenho Interesse</CardTitle>
                    <CardDescriptionComponent className="text-center">
                        Preencha o formulário para receber mais informações.
                    </CardDescriptionComponent>
                </CardHeader>
                <CardContent>
                    <form ref={contactFormRef} action={contactFormAction} className="space-y-4">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="propertyName" value={property.informacoesbasicas.nome} />
                        <input type="hidden" name="propertySlug" value={property.slug} />
                        
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="contact-name" name="name" placeholder="Digite seu nome" required className="pl-10"/>
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="contact-email" name="email" type="email" placeholder="Digite seu email" required className="pl-10" />
                        </div>
                         <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="contact-phone" name="phone" placeholder="(xx) xxxxx-xxxx" required className="pl-10" />
                        </div>
                        <div className="space-y-2">
                            <Textarea id="contact-message" name="message" placeholder="Gostaria de mais informações sobre..." />
                        </div>
                        <ContactFormSubmitButton />
                         <p className="text-xs text-muted-foreground text-center pt-2">
                            Ao enviar, você afirma que leu, compreendeu e concordou com os nossos Termos de Uso e Política de Privacidade.
                        </p>
                    </form>
                </CardContent>
            </Card>
            <Card className="shadow-lg border">
                <CardContent className="p-4 space-y-4">
                   <div className="flex flex-col gap-2 justify-center items-center">
                        <p className="font-semibold text-center text-lg">Prefere falar agora?</p>
                        <Button onClick={() => setIsWhatsAppModalOpen(true)} className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg">
                            <FaWhatsapp className="mr-2 h-5 w-5"/>
                            Conversar via WhatsApp
                        </Button>
                   </div>
                </CardContent>
            </Card>
        </div>
      </div>

       {relatedProperties.length > 0 && (
        <section className="mt-16 pt-12 border-t">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Mais Imóveis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProperties.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </section>
      )}
      
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsWhatsAppModalOpen(true)}
        className="fixed bottom-20 right-6 h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg z-50"
        size="icon"
      >
        <FaWhatsapp className="h-8 w-8" />
        <span className="sr-only">Falar com corretor via WhatsApp</span>
      </Button>

      <WhatsAppDialog 
        property={property}
        isOpen={isWhatsAppModalOpen}
        onOpenChange={setIsWhatsAppModalOpen}
      />
    </main>
  );
}

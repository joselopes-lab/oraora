
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { type Property } from "@/app/dashboard/properties/page";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Card, CardContent, CardDescription as CardDescriptionComponent, CardHeader, CardTitle } from "./ui/card";
import { BedDouble, Car, Check, Home, MapPin, Ruler, User, Mail, Phone, Send, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { type State, handleBrokerContactSheet } from "@/app/corretor-publico/[brokerId]/actions";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface PropertyDetailSheetProps {
    property: Property;
    brokerId: string;
    brokerWhatsApp?: string | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    source?: 'public' | 'broker-panel' | 'admin-panel';
}

const initialState: State = {
    success: null,
    error: null,
    message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar Contato
        </Button>
    );
}

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

export default function PropertyDetailSheet({ property, brokerId, brokerWhatsApp, isOpen, onOpenChange, source = 'public' }: PropertyDetailSheetProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleBrokerContactSheet, initialState);
    
    useEffect(() => {
        if (state.success === false && state.error) {
           toast({ variant: 'destructive', title: "Erro", description: state.error });
        } else if (state.success === true && state.message) {
            toast({ title: "Sucesso!", description: state.message });
            formRef.current?.reset();
        }
    }, [state, toast]);

    const handleWhatsAppClick = () => {
        if (!brokerWhatsApp) {
            toast({ variant: "destructive", title: "Corretor sem WhatsApp", description: "Este corretor não cadastrou um número de WhatsApp."});
            return;
        }
        const propertyUrl = window.location.href;
        const message = `Olá, tenho interesse no imóvel "${property.informacoesbasicas.nome}".\nLink: ${propertyUrl}`;
        const whatsappNumber = `55${brokerWhatsApp.replace(/\D/g, '')}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const images = property.midia || [];
    const priceDisplay = formatPriceLarge(property.informacoesbasicas.valor);
    const tamanhoDisplay = property.caracteristicasimovel.tamanho?.replace('-', 'a') || 'N/A';
    
    const mapsEmbedUrl = property?.localizacao.googleMapsLink ? getEmbedUrl(property.localizacao.googleMapsLink) : null;
    const streetViewEmbedUrl = property?.localizacao.googleStreetViewLink ? getEmbedUrl(property.localizacao.googleStreetViewLink) : null;
    const youtubeEmbedUrl = getYoutubeEmbedUrl(property.youtubeVideoUrl);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90vw] sm:w-[80vw] overflow-y-auto">
                <SheetHeader className="pr-12">
                    <SheetTitle className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
                        {property.informacoesbasicas.nome}
                    </SheetTitle>
                    <SheetDescription className="text-lg text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary"/>
                        {property.localizacao.cidade}, {property.localizacao.estado}
                    </SheetDescription>
                </SheetHeader>
                 <div className={cn(
                    "mt-6 grid grid-cols-1 gap-8 xl:gap-12",
                    source === 'public' && 'lg:grid-cols-3'
                )}>
                    <div className={cn("space-y-8", source === 'public' && 'lg:col-span-2')}>
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
                          youtubeEmbedUrl ? null : (
                                <div className="aspect-video w-full mb-6 relative bg-muted rounded-lg flex items-center justify-center">
                                    <p className="text-muted-foreground">Nenhuma imagem</p>
                                </div>
                          )
                        )}
                        
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


                        <div className="p-6 rounded-lg bg-card border">
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
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
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
                                        <p className="font-semibold">{tamanhoDisplay}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Home className="h-7 w-7 text-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipo</p>
                                        <p className="font-semibold">{property.caracteristicasimovel.tipo || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                <CardHeader>
                                    <CardTitle>Área comum</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-x-6 gap-y-3">
                                        {property.areascomuns.map((item, index) => (
                                            <li key={`${item}-${index}`} className="flex items-center gap-2">
                                                <Check className="h-5 w-5 text-green-600"/>
                                                <span className="text-foreground">{item}</span>
                                            </li>
                                        ))}
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
                     {source === 'public' && (
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 h-fit">
                            <Card className="shadow-lg border bg-secondary/30">
                                <CardHeader>
                                    <CardTitle className="text-center">Tenho Interesse</CardTitle>
                                    <CardDescriptionComponent className="text-center">
                                        Preencha o formulário para receber mais informações.
                                    </CardDescriptionComponent>
                                </CardHeader>
                                <CardContent>
                                    <form ref={formRef} action={formAction} className="space-y-4">
                                        <input type="hidden" name="propertyId" value={property.id} />
                                        <input type="hidden" name="propertyName" value={property.informacoesbasicas.nome} />
                                        <input type="hidden" name="propertySlug" value={property.slug} />
                                        <input type="hidden" name="brokerId" value={brokerId} />
                                        
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input id="contact-name-sheet" name="name" placeholder="Digite seu nome" required className="pl-10"/>
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input id="contact-email-sheet" name="email" type="email" placeholder="Digite seu email" required className="pl-10" />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input id="contact-phone-sheet" name="phone" placeholder="(xx) xxxxx-xxxx" required className="pl-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Textarea id="contact-message-sheet" name="message" placeholder="Gostaria de mais informações sobre..." />
                                        </div>
                                        <SubmitButton />
                                    </form>
                                </CardContent>
                            </Card>
                            {brokerWhatsApp && (
                                <Card className="shadow-lg border">
                                    <CardContent className="p-4 space-y-4">
                                    <div className="flex flex-col gap-2 justify-center items-center">
                                            <p className="font-semibold text-center text-lg">Prefere falar agora?</p>
                                            <Button onClick={handleWhatsAppClick} className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg">
                                                <FaWhatsapp className="mr-2 h-5 w-5"/>
                                                Conversar via WhatsApp
                                            </Button>
                                    </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

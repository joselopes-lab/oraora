
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDouble, Car, MapPin, ImageOff, Ruler, ArrowRight, FileText, Trash2, HelpCircle, Radar } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import { Badge } from './ui/badge';
import { WhatsAppDialog } from '@/app/imoveis/[slug]/property-page-client';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { incrementPropertyClick } from '@/app/imoveis/actions';
import { useAuth } from '@/context/auth-context';
import AuthModal from './auth-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from './icons';


interface PropertyCardProps {
  property: Property;
  layout?: 'vertical' | 'horizontal';
  variant?: 'default' | 'portfolio';
  isFeatured?: boolean;
  hideClientActions?: boolean;
  onRemoveFromPortfolio?: (propertyId: string) => void;
}

const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === null) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

const displayBedrooms = (bedrooms: string[] | string | undefined) => {
    if (!bedrooms || bedrooms.length === 0) return 'N/A';
    if (Array.isArray(bedrooms)) {
      if (bedrooms.length > 1) {
          const sorted = bedrooms.map(val => parseInt(val, 10)).filter(Number.isFinite).sort((a,b) => a - b);
          if (sorted.length > 1) {
            return `${sorted[0]} a ${sorted[sorted.length - 1]}`;
          }
          if (sorted.length === 1) {
            return `${sorted[0]}`;
          }
          return 'N/A';
      }
      return bedrooms[0] || 'N/A';
    }
    return bedrooms;
  };

export default function PropertyCard({ property, layout = 'vertical', variant = 'default', isFeatured = false, hideClientActions = false, onRemoveFromPortfolio }: PropertyCardProps) {
  const featuredImage = property.midia && property.midia.length > 0 ? property.midia[0] : null;
  const priceDisplay = formatPrice(property.informacoesbasicas.valor);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [propertyIdToFavorite, setPropertyIdToFavorite] = useState<string | null>(null);
  
  const { user, toggleFavorite, isFavorite } = useAuth();
  const isFavorited = isFavorite(property.id);

  const handleClick = () => {
    incrementPropertyClick(property.id);
  };
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
        toggleFavorite(property.id);
    } else {
        setPropertyIdToFavorite(property.id);
        setIsAuthModalOpen(true);
    }
  }

  const propertyUrl = `/imoveis/${property.slug || property.id}`;

  if (layout === 'horizontal') {
    return (
        <>
        <Card className="overflow-hidden group border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col sm:flex-row">
            <div className="sm:w-1/3 w-full relative">
                 <Link href={propertyUrl} className="block aspect-video sm:aspect-auto sm:absolute sm:inset-0" onClick={handleClick}>
                    {featuredImage ? (
                        <Image
                            src={featuredImage}
                            alt={`Foto de ${property.informacoesbasicas.nome}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            data-ai-hint="property exterior"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Icons.logo className="h-12 w-12 text-black/5" />
                        </div>
                    )}
                 </Link>
                 {isFeatured && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        Publicidade
                    </div>
                )}
                 {!hideClientActions && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-foreground"
                                    onClick={handleFavoriteClick}
                                >
                                    <Radar className={cn("h-5 w-5", isFavorited && "text-primary")} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isFavorited ? 'Remover do Radar' : 'Adicionar ao Radar'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </div>
            <div className="sm:w-2/3 w-full flex flex-col flex-grow p-4">
                <div className="flex flex-col flex-grow">
                    <h3 className="text-xl font-light uppercase tracking-tight leading-tight">
                        <Link href={propertyUrl} className="hover:text-primary transition-colors" onClick={handleClick}>
                            {property.informacoesbasicas.nome}
                        </Link>
                    </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {property.localizacao.cidade} - {property.localizacao.estado}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground my-4">
                        <div className="flex items-center gap-1.5" title="Área"><Ruler className="h-4 w-4" /><span>{property.caracteristicasimovel.tamanho ? `${property.caracteristicasimovel.tamanho}` : 'N/A'}</span></div>
                        <div className="flex items-center gap-1.5" title="Quartos"><BedDouble className="h-4 w-4" /><span>{displayBedrooms(property.caracteristicasimovel.unidades.quartos)}</span></div>
                        <div className="flex items-center gap-1.5" title="Vagas"><Car className="h-4 w-4" /><span>{property.caracteristicasimovel.unidades.vagasgaragem || 'N/A'}</span></div>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                     <div className="text-left">
                        <p className="text-xs text-muted-foreground">A partir de:</p>
                         <div className="flex items-center gap-1.5 justify-start">
                            <p className="font-bold text-2xl text-foreground">{priceDisplay}</p>
                             {property.informacoesbasicas.valor && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>O valor pode sofrer alterações sem aviso prévio.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 w-full">
                        <Button asChild className="w-full bg-[#83e800] text-black hover:bg-[#72c900]">
                            <Link href={propertyUrl} onClick={handleClick}>Ver mais</Link>
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsWhatsAppDialogOpen(true)}>
                            <FaWhatsapp className="mr-2 h-4 w-4"/>
                            Fale agora
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onOpenChange={setIsAuthModalOpen} 
            propertyIdToFavorite={propertyIdToFavorite} 
        />
        <WhatsAppDialog
            property={property}
            isOpen={isWhatsAppDialogOpen}
            onOpenChange={setIsWhatsAppDialogOpen}
        />
        </>
    )
  }

  // Vertical Layout (Default)
  return (
    <>
    <Card className="overflow-hidden h-full flex flex-col group border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="relative">
            <Link href={propertyUrl} className="block aspect-[4/3] w-full overflow-hidden" onClick={handleClick}>
            {featuredImage ? (
                <Image
                src={featuredImage}
                alt={`Foto de ${property.informacoesbasicas.nome}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint="property exterior"
                />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Icons.logo className="h-12 w-12 text-black/5" />
                </div>
            )}
            {isFeatured && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        Publicidade
                    </div>
                )}
            </Link>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-foreground"
                        onClick={handleFavoriteClick}
                        >
                        <Radar className={cn("h-5 w-5", isFavorited && "text-primary")} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isFavorited ? 'Remover do Radar' : 'Adicionar ao Radar'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
       <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-light uppercase tracking-tight leading-tight">
                <Link href={propertyUrl} className="hover:text-primary transition-colors" onClick={handleClick}>
                    {property.informacoesbasicas.nome}
                </Link>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
                {property.localizacao.cidade} - {property.localizacao.estado}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground my-4">
                <div className="flex items-center gap-1.5" title="Área"><Ruler className="h-4 w-4" /><span>{property.caracteristicasimovel.tamanho ? `${property.caracteristicasimovel.tamanho}` : 'N/A'}</span></div>
                <div className="flex items-center gap-1.5" title="Quartos"><BedDouble className="h-4 w-4" /><span>{displayBedrooms(property.caracteristicasimovel.unidades.quartos)}</span></div>
                <div className="flex items-center gap-1.5" title="Vagas"><Car className="h-4 w-4" /><span>{property.caracteristicasimovel.unidades.vagasgaragem || 'N/A'}</span></div>
            </div>

            <div className="mt-auto space-y-4">
                 <div className="text-left">
                    <p className="text-xs text-muted-foreground">A partir de:</p>
                     <div className="flex items-center gap-1.5 justify-start">
                        <p className="font-bold text-2xl text-foreground">{priceDisplay}</p>
                         {property.informacoesbasicas.valor && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>O valor pode sofrer alterações sem aviso prévio.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>

                {!hideClientActions && (
                  <div className="flex items-center gap-2 w-full">
                      <Button asChild className="w-full bg-[#83e800] text-black hover:bg-[#72c900]">
                          <Link href={propertyUrl} onClick={handleClick}>Ver mais</Link>
                      </Button>
                       <Button variant="outline" className="w-full" onClick={() => setIsWhatsAppDialogOpen(true)}>
                            <FaWhatsapp className="mr-2 h-4 w-4"/>
                            Fale agora
                        </Button>
                  </div>
                )}
            </div>
      </div>
    </Card>
    <WhatsAppDialog
        property={property}
        isOpen={isWhatsAppDialogOpen}
        onOpenChange={setIsWhatsAppDialogOpen}
    />
    <AuthModal 
        isOpen={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen} 
        propertyIdToFavorite={propertyIdToFavorite}
    />
    </>
  );
}

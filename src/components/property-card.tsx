
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDouble, Car, MapPin, ImageOff, Ruler, ArrowRight, FileText, Trash2, HelpCircle, Radar, Eye, EyeOff, Banknote, Table, Download, Video } from 'lucide-react';
import { type Property } from '@/app/dashboard/properties/page';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { incrementPropertyClick } from '@/app/imoveis/actions';
import { useAuth } from '@/context/auth-context';
import AuthModal from './auth-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from './icons';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppDialog } from '@/app/imoveis/[slug]/property-page-client';
import BrokerWhatsAppDialog from './broker-whatsapp-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface PropertyTable {
    id: string;
    tableName: string;
    fileUrl: string;
}

interface PropertyCardProps {
  property: Property;
  layout?: 'vertical' | 'horizontal';
  variant?: 'default' | 'portfolio' | 'featured';
  isFeatured?: boolean;
  hideClientActions?: boolean;
  onRemoveFromPortfolio?: (propertyId: string) => void;
  onToggleVisibility?: (propertyId: string, isVisible: boolean) => void;
  isPubliclyVisible?: boolean;
  onViewDetails?: () => void;
  onViewMaterials?: () => void;
  brokerId?: string;
  brokerWhatsApp?: string;
  verMaisButtonColor?: string;
  verMaisButtonBackgroundColor?: string;
  faleAgoraButtonColor?: string;
  faleAgoraButtonBackgroundColor?: string;
  tables?: PropertyTable[];
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

export default function PropertyCard({ 
    property, 
    layout = 'vertical', 
    variant = 'default', 
    isFeatured = false, 
    hideClientActions = false, 
    onRemoveFromPortfolio,
    onToggleVisibility,
    isPubliclyVisible,
    onViewDetails,
    onViewMaterials,
    brokerId,
    brokerWhatsApp,
    verMaisButtonColor,
    verMaisButtonBackgroundColor,
    faleAgoraButtonColor,
    faleAgoraButtonBackgroundColor,
    tables = [],
}: PropertyCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const featuredImage = property.midia && property.midia.length > 0 ? property.midia[0] : null;
  const priceDisplay = formatPrice(property.informacoesbasicas.valor);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [propertyIdToFavorite, setPropertyIdToFavorite] = useState<string | null>(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const { user, toggleFavorite, isFavorite } = useAuth();
  const isFavorited = isFavorite(property.id);
  const youtubeEmbedUrl = getYoutubeEmbedUrl(property.youtubeVideoUrl);


  const handleClick = () => {
    incrementPropertyClick(property.id);
    if(onViewDetails) {
        onViewDetails();
    } else {
        router.push(`/imoveis/${property.slug || property.id}`);
    }
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

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWhatsAppDialogOpen(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoModalOpen(true);
  };

  const propertyUrl = `/imoveis/${property.slug || property.id}`;

  const tamanhoDisplay = property.caracteristicasimovel.tamanho?.replace('-', 'a') || 'N/A';

  const verMaisStyle = {
    color: verMaisButtonColor,
    backgroundColor: verMaisButtonBackgroundColor,
  };
  
  const faleAgoraStyle = {
    color: faleAgoraButtonColor,
    backgroundColor: faleAgoraButtonBackgroundColor,
  };

  if (variant === 'featured') {
     return (
         <div onClick={handleClick} className="cursor-pointer group relative aspect-[9/12] w-full overflow-hidden shadow-lg rounded-lg">
             {featuredImage && (
                <Image
                    src={featuredImage}
                    alt={property.informacoesbasicas.nome}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
             {property.informacoesbasicas.status && (
                <Badge className="absolute top-4 left-4 bg-white/90 text-black border-none font-semibold">
                    {property.informacoesbasicas.status}
                </Badge>
             )}
             <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold uppercase tracking-tight">{property.informacoesbasicas.nome}</h3>
                <p className="text-base">{property.localizacao.bairro} - {property.localizacao.cidade}</p>
                 <div className="flex items-end gap-4 text-sm mt-1.5">
                    <div className="flex items-center gap-1.5"><Ruler className="h-4 w-4" /><span>{tamanhoDisplay}</span></div>
                    <div className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" /><span>{displayBedrooms(property.caracteristicasimovel.unidades.quartos)}</span></div>
                    <div className="flex items-center gap-1.5 font-semibold"><Banknote className="h-4 w-4" /><span>{priceDisplay}</span></div>
                </div>
             </div>
         </div>
     )
  }

  if (layout === 'horizontal') {
    const newestTable = tables.length > 0 ? tables[0] : null;
    return (
        <>
        <Card onClick={onViewDetails ? handleClick : undefined} className={cn("overflow-hidden group border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col sm:flex-row", onViewDetails && "cursor-pointer")}>
            <div className="sm:w-1/3 w-full relative">
                 <div onClick={onViewDetails ? undefined : handleClick} className={cn("block aspect-video sm:aspect-auto sm:absolute sm:inset-0", !onViewDetails && "cursor-pointer")}>
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
                 </div>
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
                    <h3 className="uppercase font-light text-xl tracking-tight leading-tight">
                        <div onClick={onViewDetails ? undefined : handleClick} className={cn("transition-colors", !onViewDetails && "cursor-pointer hover:text-primary")}>
                            {property.informacoesbasicas.nome}
                        </div>
                    </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {property.localizacao.cidade} - {property.localizacao.estado}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground my-4">
                        <div className="flex items-center gap-1.5" title="Área"><Ruler className="h-4 w-4" /><span>{tamanhoDisplay}</span></div>
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
                    {variant === 'portfolio' && onRemoveFromPortfolio && onToggleVisibility && isPubliclyVisible !== undefined && (
                         <div className="flex items-center justify-between gap-2 border-t pt-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`visibility-${property.id}`}
                                    checked={isPubliclyVisible}
                                    onCheckedChange={(checked) => onToggleVisibility(property.id, checked)}
                                />
                                <Label htmlFor={`visibility-${property.id}`} className={cn("text-sm", isPubliclyVisible ? "text-foreground" : "text-muted-foreground")}>
                                    {isPubliclyVisible ? <span className="flex items-center gap-1.5"><Eye className="h-4 w-4"/>Visível</span> : <span className="flex items-center gap-1.5"><EyeOff className="h-4 w-4"/>Oculto</span>}
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                {newestTable ? (
                                    <Button asChild variant="default" size="sm" className="bg-black text-white hover:bg-black/80" onClick={(e) => e.stopPropagation()}>
                                        <a href={newestTable.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Table className="mr-2 h-4 w-4"/> Tabela
                                        </a>
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>
                                         <Table className="mr-2 h-4 w-4"/> Tabela
                                    </Button>
                                )}
                                {youtubeEmbedUrl && (
                                     <Button variant="outline" size="sm" onClick={handleVideoClick}>
                                        <Video className="mr-2 h-4 w-4" /> Vídeo
                                    </Button>
                                )}
                                 {onViewMaterials && (
                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onViewMaterials(); }}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Materiais
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onRemoveFromPortfolio(property.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    {variant === 'default' && (
                        <div className="flex items-center gap-2 w-full">
                           <Button onClick={onViewDetails ? onViewDetails : () => router.push(propertyUrl)} className="w-full" style={verMaisStyle}>
                                Ver mais
                           </Button>
                            <Button variant="outline" className="w-full" onClick={handleWhatsAppClick} style={faleAgoraStyle}>
                                <FaWhatsapp className="mr-2 h-4 w-4"/>
                                Fale agora
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onOpenChange={setIsAuthModalOpen} 
            propertyIdToFavorite={propertyIdToFavorite} 
        />
        {brokerId && brokerWhatsApp ? (
            <BrokerWhatsAppDialog
                property={property}
                brokerId={brokerId}
                brokerWhatsApp={brokerWhatsApp}
                isOpen={isWhatsAppDialogOpen}
                onOpenChange={setIsWhatsAppDialogOpen}
            />
        ) : (
            <WhatsAppDialog
                property={property}
                isOpen={isWhatsAppDialogOpen}
                onOpenChange={setIsWhatsAppDialogOpen}
            />
        )}
        {youtubeEmbedUrl && (
             <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                <DialogContent className="max-w-4xl p-0 border-0" hideCloseButton>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Vídeo do Imóvel: {property.informacoesbasicas.nome}</DialogTitle>
                        <DialogDescription>Vídeo de apresentação do imóvel.</DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video">
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
                </DialogContent>
            </Dialog>
        )}
        </>
    )
  }

  // Vertical Layout (Default)
  return (
    <>
    <Card onClick={onViewDetails ? handleClick : undefined} className={cn("overflow-hidden h-full flex flex-col group border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300", onViewDetails && "cursor-pointer")}>
        <div className="relative">
             <div onClick={onViewDetails ? undefined : handleClick} className={cn("block aspect-[4/3] w-full overflow-hidden", !onViewDetails && "cursor-pointer")}>
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
            </div>
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
       <div className="p-4 flex flex-col flex-grow">
            <h3 className="uppercase font-light text-xl tracking-tight leading-tight">
                <div onClick={onViewDetails ? undefined : handleClick} className={cn("transition-colors", !onViewDetails && "cursor-pointer hover:text-primary")}>
                    {property.informacoesbasicas.nome}
                </div>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
                {property.localizacao.cidade} - {property.localizacao.estado}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground my-4">
                <div className="flex items-center gap-1.5" title="Área"><Ruler className="h-4 w-4" /><span>{tamanhoDisplay}</span></div>
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

                {variant === 'portfolio' && onToggleVisibility && isPubliclyVisible !== undefined && (
                     <div className="flex items-center justify-between gap-2 border-t pt-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`visibility-card-${property.id}`}
                                checked={isPubliclyVisible}
                                onCheckedChange={(checked) => onToggleVisibility(property.id, checked)}
                            />
                            <Label htmlFor={`visibility-card-${property.id}`} className={cn("text-sm", isPubliclyVisible ? "text-foreground" : "text-muted-foreground")}>
                                {isPubliclyVisible ? <span className="flex items-center gap-1.5"><Eye className="h-4 w-4"/>Visível</span> : <span className="flex items-center gap-1.5"><EyeOff className="h-4 w-4"/>Oculto</span>}
                            </Label>
                        </div>
                        <Button asChild style={verMaisStyle}>
                           <Link href={`/imoveis/${property.slug}`} target="_blank">
                                <FileText className="mr-2 h-4 w-4" />
                                Detalhes
                           </Link>
                       </Button>
                    </div>
                )}
                {variant === 'default' && !hideClientActions && (
                  <div className="flex items-center gap-2 w-full">
                       <Button onClick={onViewDetails ? onViewDetails : () => router.push(propertyUrl)} className="w-full" style={verMaisStyle}>
                           Ver mais
                       </Button>
                       <Button variant="outline" className="w-full" onClick={handleWhatsAppClick} style={faleAgoraStyle}>
                            <FaWhatsapp className="mr-2 h-4 w-4"/>
                            Fale agora
                        </Button>
                  </div>
                )}
                 {variant === 'default' && hideClientActions && (
                     <Button asChild className="w-full" style={verMaisStyle}>
                        <Link href={propertyUrl} target="_blank">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes do Imóvel
                        </Link>
                     </Button>
                 )}
            </div>
      </div>
    </Card>
    <AuthModal 
        isOpen={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen} 
        propertyIdToFavorite={propertyIdToFavorite}
    />
     {brokerId && brokerWhatsApp ? (
        <BrokerWhatsAppDialog
            property={property}
            brokerId={brokerId}
            brokerWhatsApp={brokerWhatsApp}
            isOpen={isWhatsAppDialogOpen}
            onOpenChange={setIsWhatsAppDialogOpen}
        />
    ) : (
        <WhatsAppDialog
            property={property}
            isOpen={isWhatsAppDialogOpen}
            onOpenChange={setIsWhatsAppDialogOpen}
        />
    )}
    </>
  );
}

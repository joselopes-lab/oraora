
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { type Property } from '@/app/dashboard/properties/page';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/property-card';
import { cn } from '@/lib/utils';
import BrokerPublicHeader from '@/components/broker-public-header';
import SearchForm from '@/components/search-form';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FaWhatsapp } from 'react-icons/fa';
import { usePropertyActions } from '@/hooks/use-property-actions';

interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  logoUrl?: string;
  backgroundColor?: string;
  theme?: 'light' | 'dark';
  verMaisButtonColor?: string;
  verMaisButtonBackgroundColor?: string;
  faleAgoraButtonColor?: string;
  faleAgoraButtonBackgroundColor?: string;
  bannerDesktopUrl?: string;
  bannerMobileUrl?: string;
  featuredPropertyIds?: string[];
  videoCoverUrl?: string;
  youtubeUrl?: string;
}

interface BrokerPublicPageClientProps {
    broker: Broker;
    properties: Property[];
    featuredProperties: Property[];
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

export default function BrokerPublicPageClient({ broker, properties, featuredProperties }: BrokerPublicPageClientProps) {
  const {
    selectedProperty,
    isSheetOpen,
    isWhatsAppDialogOpen,
    isVideoModalOpen,
    handleViewDetails,
    handleCuradoriaClick,
    setIsSheetOpen,
    setIsWhatsAppDialogOpen,
    setIsVideoModalOpen,
    PropertyDetailSheet,
    BrokerWhatsAppDialog,
    toast,
  } = usePropertyActions(broker);

  const youtubeEmbedUrl = useMemo(() => getYoutubeEmbedUrl(broker.youtubeUrl), [broker.youtubeUrl]);

  const allBrokerProperties = useMemo(() => [...properties, ...featuredProperties], [properties, featuredProperties]);
  const allPropertiesCount = allBrokerProperties.length;

  return (
    <>
      <BrokerPublicHeader broker={broker} />
      <main id="properties" className={cn("container mx-auto px-4 py-8 md:py-12 flex-grow", broker.theme === 'dark' ? 'dark' : '')}>
         {/* Banner Section */}
        <div className="relative z-0 mb-8" style={{marginTop: -80}}>
             {broker.bannerDesktopUrl && (
                <div className="hidden md:block container mx-auto px-4">
                    <Image src={broker.bannerDesktopUrl} alt="Banner" width={1280} height={300} className="w-full h-auto rounded-lg" />
                </div>
            )}
            {broker.bannerMobileUrl && (
                <div className="block md:hidden container mx-auto px-4 py-5">
                    <Image src={broker.bannerMobileUrl} alt="Banner" width={375} height={400} className="w-full h-auto rounded-lg" />
                </div>
            )}
        </div>

        <section className="relative z-20 bg-gradient-to-b from-[#b6e803] to-[#0fe808] backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl -mt-12 mb-8">
            <SearchForm properties={allBrokerProperties} brokerId={broker.id} />
        </section>


        {featuredProperties.length > 0 && (
          <div className="space-y-12">
               <h2
                  className="text-4xl md:text-2xl tracking-tight uppercase text-white font-light text-left pt-5 pb-8"
                  style={{ marginLeft: '30px' }}
              >
                  SÃO <strong className="font-bold">{allPropertiesCount}</strong> OPORTUNIDADES SELECIONADAS <strong className="font-bold">PARA VOCÊ</strong>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3">
                  {featuredProperties.map((prop, index) => (
                      <div key={prop.id} className={cn(
                        'w-full h-full relative',
                        index === 1 && 'lg:-top-8',
                        index === 2 && 'lg:-top-16',
                      )}>
                        <PropertyCard
                            property={prop}
                            variant="featured"
                            onViewDetails={() => handleViewDetails(prop)}
                            verMaisButtonBackgroundColor={broker.verMaisButtonBackgroundColor}
                            verMaisButtonColor={broker.verMaisButtonColor}
                            faleAgoraButtonBackgroundColor={broker.faleAgoraButtonBackgroundColor}
                            faleAgoraButtonColor={broker.faleAgoraButtonColor}
                        />
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* {broker.videoCoverUrl && youtubeEmbedUrl && (
          <section className="mt-16">
            <div className="max-w-4xl mx-auto">
              <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                  <DialogTrigger asChild>
                      <div className="block group relative aspect-video w-full rounded-lg overflow-hidden shadow-lg cursor-pointer">
                          <Image src={broker.videoCoverUrl} alt="Capa do vídeo" fill sizes="100vw" className="object-cover group-hover:scale-105 transition-transform duration-300"/>
                      </div>
                  </DialogTrigger>
                   <DialogContent className="max-w-4xl p-0 border-0">
                       <DialogHeader className="sr-only">
                           <DialogTitle>Vídeo de apresentação de {broker.name}</DialogTitle>
                           <DialogDescription>Vídeo do YouTube incorporado.</DialogDescription>
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
            </div>
          </section>
        )} */}

        <section className="mt-16 px-4 sm:px-8 md:px-16 py-16 md:py-24">
            <div className="container mx-auto">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
                <div className="space-y-8 md:text-right">
                    <h2 className="text-6xl md:text-8xl tracking-tighter leading-[1.1] md:leading-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] -mt-12 md:-mt-[80px]">
                        <span className="font-light">Deseja uma</span><br />
                        <span className="font-semibold">curadoria</span><br />
                        <span className="font-semibold">exclusiva?</span>
                    </h2>
                     <Button
                        onClick={handleCuradoriaClick}
                        className="bg-[#83e800] text-black hover:bg-[#76d300] gap-2 px-8 py-6 text-base"
                     >
                        VAMOS CONVERSAR <FaWhatsapp className="h-5 w-5" />
                    </Button>
                </div>

                <div className="space-y-6">
                    <p className="text-[22px] leading-[1.1] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">Analisamos todo o seu perfil e o que deseja, nos mínimos detalhes.</p>
                    <ul className="text-[56px] font-light text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] space-y-2">
                        <li className="border-b border-white/30 pb-3">localidade</li>
                        <li className="border-b border-white/30 pb-3">estilo de vida</li>
                        <li className="border-b border-white/30 pb-3">mobilidade</li>
                        <li className="border-b border-white/30 pb-3">mais praticidade</li>
                    </ul>
                </div>
                </div>
            </div>
        </section>

      </main>
      {selectedProperty && (
        <PropertyDetailSheet
            property={selectedProperty}
            brokerId={broker.id}
            brokerWhatsApp={broker.whatsapp}
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
        />
      )}
       {broker.whatsapp && selectedProperty && (
            <BrokerWhatsAppDialog
                property={selectedProperty}
                brokerId={broker.id}
                brokerWhatsApp={broker.whatsapp}
                isOpen={isWhatsAppDialogOpen}
                onOpenChange={setIsWhatsAppDialogOpen}
            />
        )}
    </>
  );
}

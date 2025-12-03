
'use client'

import { useState, useEffect, useContext, Suspense, useMemo } from 'react';
import SearchForm from '@/components/search-form';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from './dashboard/properties/page';
import { type Builder } from './dashboard/builders/page';
import PropertyCard from '@/components/property-card';
import { Loader2, Building, Home, LandPlot, Store, ArrowRight } from 'lucide-react';
import PublicLayout from '@/components/public-layout';
import { LocationContext } from '@/context/location-context';
import { type AppearanceSettings, type CategoryImages } from './dashboard/appearance/actions';
import { type Banner } from './dashboard/banners/page';
import BannerDisplay from '@/components/banner-display';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { queryInBatches } from '@/lib/firestoreUtils';

type PropertyTypeCategory = {
    name: keyof CategoryImages;
    href: string;
    dataAiHint: string;
};

const allPropertyTypeCategories: PropertyTypeCategory[] = [
  { name: 'Apartamento', href: '/imoveis?tipo=Apartamento', dataAiHint: 'apartment living' },
  { name: 'Casa em Condomínio', href: '/imoveis?tipo=Casa%20em%20Condomínio', dataAiHint: 'gated community' },
  { name: 'Casa', href: '/imoveis?tipo=Casa', dataAiHint: 'family house' },
  { name: 'Flat', href: '/imoveis?tipo=Flat', dataAiHint: 'modern flat' },
  { name: 'Terreno', href: '/imoveis?tipo=Terreno', dataAiHint: 'land plot' },
  { name: 'Loja', href: '/imoveis?tipo=Loja', dataAiHint: 'store front' },
];

function HomePageContent() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [allStateProperties, setAllStateProperties] = useState<Property[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [homeTopBanners, setHomeTopBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedState } = useContext(LocationContext);

  useEffect(() => {
    const fetchSettingsAndBanners = async () => {
      const settingsRef = doc(db, 'settings', 'homepage');
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setAppearance(docSnap.data() as AppearanceSettings);
      } else {
        setAppearance({
          logoUrl: '',
          heroTitle: 'Reunimos automaticamente os imóveis das construtoras em um ambiente exclusivo, investigado e atualizado para você.',
          searchFormTitle: 'Encontre seu imóvel',
          heroBackgroundImage: 'https://placehold.co/500x611.png'
        } as AppearanceSettings);
      }

      const bannersQuery = query(collection(db, 'banners'), where('location', '==', 'home_top'), where('isActive', '==', true));
      const bannersSnapshot = await getDocs(bannersQuery);
      setHomeTopBanners(bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
    };
    fetchSettingsAndBanners();
  }, []);

  useEffect(() => {
    const fetchStateData = async () => {
      if (!selectedState) {
        setFeaturedProperties([]);
        setAllStateProperties([]);
        setBuilders([]);
        setIsLoading(true);
        return;
      }
      setIsLoading(true);
      try {
        const buildersQuery = query(
          collection(db, 'builders'), 
          where('isVisibleOnSite', '==', true),
          where('state', '==', selectedState.sigla)
        );
        const buildersSnapshot = await getDocs(buildersQuery);
        const allVisibleBuildersInState = buildersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Builder));
        
        const visibleBuildersWithLogos = allVisibleBuildersInState.filter(builder => builder.logoUrl);
        const shuffledBuilders = [...visibleBuildersWithLogos].sort(() => Math.random() - 0.5);
        setBuilders(shuffledBuilders);

        const visibleBuilderIdsInState = allVisibleBuildersInState.map(doc => doc.id);

        if (visibleBuilderIdsInState.length === 0) {
            setFeaturedProperties([]);
            setAllStateProperties([]);
            setIsLoading(false);
            return;
        }

        const allProperties = await queryInBatches<Property>(
            'properties',
            'builderId',
            visibleBuilderIdsInState,
            [
                where('localizacao.estado', '==', selectedState.sigla),
                where('isVisibleOnSite', '==', true)
            ]
        );
        
        setAllStateProperties(allProperties);
        
        const shuffled = [...allProperties].sort(() => 0.5 - Math.random());
        setFeaturedProperties(shuffled.slice(0, 6));

      } catch (error) {
        console.error("Error fetching state data: ", error);
        setFeaturedProperties([]);
        setAllStateProperties([]);
        setBuilders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStateData();
  }, [selectedState]);

  const heroTitle = appearance?.heroTitle || 'Encontre seu imóvel dos sonhos para você.';
  const searchFormTitle = appearance?.searchFormTitle || 'Encontre seu imóvel';
  const heroBackgroundImage = appearance?.heroBackgroundImage || 'https://placehold.co/1200x600.png';

  const availableCategories = useMemo(() => {
    if (allStateProperties.length === 0) {
      return [];
    }
    const availableTypes = new Set(allStateProperties.map(p => p.caracteristicasimovel.tipo).filter(Boolean));
    return allPropertyTypeCategories.filter(category => availableTypes.has(category.name));
  }, [allStateProperties]);


  return (
    <main className="flex-grow">
      <section className="bg-secondary/30 overflow-hidden">
        <div className="container mx-auto px-4 py-12">
          <div className="relative grid md:grid-cols-2 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-4 text-center md:text-left z-10">
              <h1 className="text-[2.6rem] lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {heroTitle.split(' ').map((word, index) => 
                  ['imóvel', 'sonhos', 'você.'].includes(word.toLowerCase()) ? <span key={index} className="text-black">{word} </span> : `${word} `
                )}
              </h1>
            </div>

            <div className="lg:col-span-4 relative h-full flex items-center justify-center order-first lg:order-none">
                {appearance && (
                  <Image 
                    src={heroBackgroundImage}
                    alt="Imagem de destaque da página inicial"
                    width={520}
                    height={635}
                    className="object-contain h-auto w-full max-w-sm md:max-w-full lg:max-w-[520px]"
                    data-ai-hint="woman chair tablet"
                    priority
                  />
                )}
            </div>

            <div className="lg:col-span-4 z-10">
              <div className="bg-gradient-to-b from-[#b6e803] to-[#0fe808] backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-black mb-6 text-center">{searchFormTitle}</h2>
                <Suspense fallback={<div className="h-40 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-white"/></div>}>
                  <SearchForm isHomePage properties={allStateProperties}/>
                </Suspense>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <section className="w-full">
        <BannerDisplay banners={homeTopBanners} />
      </section>
        
      <section className="py-12 sm:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">O melhor da {selectedState?.nome || '...'}, revelado para você</h2>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            featuredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProperties.map(prop => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                  <p>Nenhum imóvel em destaque encontrado para {selectedState?.nome}.</p>
              </div>
            )
          )}
        </div>
      </section>

      {appearance?.brokerCallDesktopImage && (
        <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4">
                <Link 
                    href={appearance.brokerCallLink || '#'} 
                    target={appearance.brokerCallLinkTargetBlank ? '_blank' : '_self'}
                    rel={appearance.brokerCallLinkTargetBlank ? 'noopener noreferrer' : ''}
                    className={!appearance.brokerCallLink ? 'pointer-events-none' : ''}
                >
                    <div className="hidden md:block">
                        {appearance.brokerCallDesktopImage && <Image src={appearance.brokerCallDesktopImage} alt="Chamada para corretores" width={1280} height={200} className="w-full h-auto rounded-lg" />}
                    </div>
                     <div className="block md:hidden">
                        {appearance.brokerCallMobileImage && <Image src={appearance.brokerCallMobileImage} alt="Chamada para corretores" width={375} height={300} className="w-full h-auto rounded-lg" />}
                    </div>
                </Link>
            </div>
        </section>
      )}

      {availableCategories.length > 0 && (
       <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Procure por tipo de imóvel</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableCategories.slice(0, 4).map((type) => (
                <div key={type.name}>
                  <Link href={`${type.href}&estado=${selectedState?.sigla || ''}`} className="group block">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg">
                      <Image
                        src={appearance?.categoryImages?.[type.name] || `https://picsum.photos/seed/${type.name.toLowerCase()}/400/500`}
                        alt={type.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={type.dataAiHint}
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <p className="absolute bottom-4 left-4 text-white text-xl font-semibold">{type.name}</p>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>
      )}

      {builders.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">Fontes confiáveis da nossa investigação</h2>
            <p className="text-center text-muted-foreground mb-12">Número de construtoras investigadas até o momento: <span className="font-bold text-foreground">{builders.length}</span></p>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {builders.map((builder) => (
                  <CarouselItem key={builder.id} className="basis-full md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card className="flex items-center justify-center p-6 py-8 aspect-video border-0 shadow-none bg-transparent">
                        {builder.logoUrl && (
                          <Image
                            src={builder.logoUrl}
                            alt={builder.name}
                            width={150}
                            height={80}
                            className="object-contain h-full w-full"
                          />
                        )}
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10" />
            </Carousel>
          </div>
        </section>
      )}

    </main>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      <HomePageContent />
    </PublicLayout>
  )
}

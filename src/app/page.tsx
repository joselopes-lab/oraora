
'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, doc, arrayRemove, arrayUnion, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuthContext, useAuth } from '@/firebase';
import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { cn } from '@/lib/utils';
import locationData from '@/lib/location-data.json';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createLead } from '@/app/sites/actions';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { PlaceHolderImages } from '@/lib/placeholder-images';


type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

type RadarList = {
  propertyIds: string[];
};

const categoryDetails: { [key: string]: { icon: string; imageHint: string; } } = {
  'Apartamento': { icon: 'apartment', imageHint: 'modern apartment' },
  'CasaEmCondominio': { icon: 'house', imageHint: 'gated community' },
  'Studio': { icon: 'apartment', imageHint: 'studio apartment' },
  'Terreno': { icon: 'landscape', imageHint: 'empty lot' },
};

function getCategoryKey(categoryName: string) {
    if (!categoryName) return null;
    const formattedName = 'categoryImageUrl' + categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/\s+/g, '');
    return formattedName;
}

const newsletterSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

export default function BrokerHomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const auth = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const { user, userProfile, isReady } = useAuthContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData, isLoading: isSiteDataLoading } = useDoc<any>(siteContentRef);

  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false); // Close the modal
    router.push(`/imoveis?${queryString}`);
  };

  async function onNewsletterSubmit(values: z.infer<typeof newsletterSchema>) {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: 'oraora-main-site',
      name: `Lead Newsletter`,
      email: values.email,
      source: 'Newsletter',
    });

    if (result.success) {
      toast({
        title: 'Inscrição realizada!',
        description: 'Você foi adicionado à nossa newsletter com sucesso.',
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na Inscrição',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }
  
  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const radarListDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'radarLists', user.uid) : null),
      [user, firestore]
  );

  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];

  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        router.push('/radar');
        return;
    }

    if (!firestore) return;

    const docRef = doc(firestore, 'radarLists', user.uid);
    
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido do Radar!", description: "O imóvel foi removido da sua lista." });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Adicionado ao Radar!", description: "O imóvel foi salvo na sua lista de oportunidades." });
    }
  };


  useEffect(() => {
    async function fetchProperties() {
      if (!firestore) return;
      try {
        const propertiesRef = collection(firestore, 'properties');
        const q = query(propertiesRef, where('isVisibleOnSite', '==', true));
        const propertiesSnap = await getDocs(q);
        const props = propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(props);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [firestore]);

  useEffect(() => {
    if (properties.length > 0) {
      const shuffled = [...properties].sort(() => 0.5 - Math.random());
      setFeaturedProperties(shuffled.slice(0, 6));
    }
  }, [properties]);


  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';

  const popularCategories = ['Apartamento', 'Casa em Condomínio', 'Studio', 'Terreno'];

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
  
    const dataAsString = Array.isArray(quartosData)
        ? quartosData.join(' ')
        : String(quartosData);
  
    const numbers = dataAsString.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) {
        const trimmedString = dataAsString.trim();
        return trimmedString ? trimmedString : 'N/A';
    }

    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  };

  const defaultContent = {
    heroTagline: 'Encontre seu novo lar',
    heroTitle: 'Descubra o imóvel perfeito para <br /> <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#5fab14]">viver seus sonhos.</span>',
    heroSubtitle: 'Navegue por milhares de anúncios, encontre o que mais combina com você e agende uma visita online. Simples, rápido e seguro.',
    featuresTitle: 'A maneira mais inteligente de encontrar seu imóvel.',
    featuresSubtitle: 'Não perca tempo em visitas desnecessárias. Nossa tecnologia de tour virtual e filtros inteligentes conectam você apenas ao que realmente importa.',
    featuresItem1: 'Tour Virtual 360° em 95% dos imóveis',
    featuresItem2: 'Documentação 100% verificada',
    featuresItem3: 'Atendimento humanizado e rápido',
    featuresButtonText: 'Conhecer Nossos Serviços',
    featuresCard1Title: 'Busca Inteligente',
    featuresCard1Icon: 'search',
    featuresCard1Description: 'Algoritmos que entendem o que você procura.',
    featuresCard2Title: 'Comparação Inteligente de Imóveis',
    featuresCard2Icon: 'rocket_launch',
    featuresCard2Description: 'Compare imóveis lado a lado de forma simples e visual.',
    featuresCard3Title: 'Negociação Direta',
    featuresCard3Icon: 'handshake',
    featuresCard3Description: 'Sem intermediários desnecessários.',
    featuresCard4Title: 'Suporte 24/7',
    featuresCard4Icon: 'support_agent',
    featuresCard4Description: 'Sempre prontos para ajudar.',
    ctaTitle: 'Receba as melhores ofertas',
    ctaSubtitle: 'Cadastre-se para receber alertas de novos imóveis no seu perfil e dicas exclusivas de mercado.'
  };
  const finalContent = { ...defaultContent, ...siteData?.homepage };

  return (
    <div className="bg-background-light overflow-x-hidden w-full">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
            <div className="flex items-center">
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 flex flex-col bg-white">
                            <SheetHeader>
                              <VisuallyHidden>
                                <SheetTitle>Menu Principal</SheetTitle>
                                <SheetDescription>Navegue pelas seções do site ou acesse sua conta.</SheetDescription>
                              </VisuallyHidden>
                            </SheetHeader>
                            <div className="p-6 border-b">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
                                <Link href="/imoveis" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                                </Link>
                                <Link href="/corretor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Para Corretores
                                </Link>
                                <Link href="/sobre" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">info</span>Sobre
                                </Link>
                                <Link href="/contato" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">mail</span>Contato
                                </Link>
                                 <Link href="/ajuda" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">help</span>Ajuda
                                </Link>
                            </nav>
                            <div className="mt-auto p-6 space-y-4 border-t">
                                {user ? (
                                    <>
                                      <div className='flex items-center gap-3'>
                                        <Avatar>
                                          <AvatarImage src={user.photoURL || ''} />
                                          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                          <div>
                                              <p className="text-sm font-bold text-foreground">{user.displayName}</p>
                                               <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                      </div>
                                      <Button asChild className="w-full h-12 text-base">
                                        <Link href={dashboardUrl}>Acessar Painel</Link>
                                      </Button>
                                       <Button variant="outline" className="w-full h-12 text-base" onClick={handleLogout}>Sair</Button>
                                    </>
                                ) : (
                                    <>
                                    <Button asChild variant="outline" className="w-full h-12 text-base">
                                        <Link href="/radar">
                                            <span className="material-symbols-outlined text-base mr-2">radar</span>
                                            Meu Radar
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full h-12 text-base">
                                        <Link href="/login">
                                           Sou Corretor
                                        </Link>
                                    </Button>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <Link className="hidden lg:flex items-center gap-3" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                </Link>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link className="flex items-center gap-3 lg:hidden" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                </Link>
                <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                    <Link className="text-text-main transition hover:text-primary" href="/imoveis">Imóveis</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/corretor">Para Corretores</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/sobre">Sobre</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/contato">Contato</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/ajuda">Ajuda</Link>
                </nav>
            </div>

            <div className="flex items-center justify-end">
                <div className="hidden lg:flex items-center gap-2 md:gap-4">
                    {!isReady ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    ) : user && userProfile ? (
                        <div className="flex items-center gap-4">
                            <Button asChild>
                                <Link href={dashboardUrl} className='flex items-center gap-2'>
                                    <span className="material-symbols-outlined text-base">grid_view</span>
                                    Acessar Painel
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={handleLogout} className='flex items-center gap-2'>
                                <span className="material-symbols-outlined text-base">logout</span>
                                Sair
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-10 rounded-full px-6 transition">
                                <Link href="/login" className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                                    Corretor
                                </Link>
                            </Button>
                            <Button asChild className="h-10 rounded-full px-6 text-sm font-bold transition">
                                <Link href="/radar">
                                    <span className="material-symbols-outlined text-base mr-2">radar</span>
                                    Meu Radar
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 lg:hidden">
                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Busca de Imóveis</DialogTitle>
                                <DialogDescription>
                                    Utilize os filtros abaixo para encontrar o imóvel dos seus sonhos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                                    <SearchFilters onSearch={handleSearch} />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Link href="/radar" className="flex size-10 items-center justify-center text-text-main">
                        <span className="material-symbols-outlined">radar</span>
                    </Link>
                </div>
            </div>
        </div>
      </header>
      <main className="pt-0">
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-grid -z-10 h-full w-full"></div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-40"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-secondary-green/10 rounded-full blur-[100px] -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-800 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                {isSiteDataLoading ? <Skeleton className="h-4 w-32" /> : finalContent.heroTagline}
              </div>
              <h1
                className="font-display text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-dark-text max-w-4xl"
                dangerouslySetInnerHTML={{ __html: isSiteDataLoading ? defaultContent.heroTitle : finalContent.heroTitle }}
              />
               <div className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mt-6">
                {isSiteDataLoading ? (
                  <div className="space-y-2">
                    <div className="h-6 w-full bg-gray-200 animate-pulse rounded-md"></div>
                    <div className="h-6 w-5/6 mx-auto bg-gray-200 animate-pulse rounded-md"></div>
                  </div>
                ) : (
                  <div>{finalContent.heroSubtitle}</div>
                )}
              </div>
            </div>
            <div className="max-w-5xl mx-auto relative z-10">
              <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
                <SearchFilters onSearch={handleSearch} />
              </Suspense>
            </div>
            <div className="mt-[-100px] lg:mt-[-140px] pt-[140px] lg:pt-[180px] pb-12 rounded-3xl overflow-hidden relative mx-4 lg:mx-8">
              <div className="absolute inset-0 bg-gray-200">
                <Image alt="Modern home exterior" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrUcIQjre-mjWEvY82yJet1YziViHf-6K07gyI5GqdN9k0PEeIFJCl8njo9KuCo8e67CVWz0MPADdlNj7J6Uhb5NRMT3shJZhRC7ZhEMbm8EWxHYR7B0bJK3eRe0DJoyo9451hiUROdHsBx7ZUX2mgpijEkdudMToadTIm14kdLW9ja4sdWxB_vDypo4bpE6DZ3Hse5xlJHlva2KM9_wf3NxZ_iResrXRYY3okI7TuARQ6F4gYG6-MLst3tFIRXmLfX2zhiguAfww" fill />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Carousel
                opts={{
                align: "start",
                }}
                className="w-full"
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display text-2xl font-bold text-dark-text flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    Categorias Populares
                    </h2>
                    <div className="hidden md:flex items-center gap-2">
                        <CarouselPrevious />
                        <CarouselNext />
                    </div>
                </div>
                <CarouselContent className="-ml-4">
                {popularCategories.map((category, index) => {
                    const categoryKey = getCategoryKey(category);
                    const details = categoryDetails[category.replace(/\s+/g, '')] || { icon: 'home_work', imageHint: 'real estate' };
                    const dynamicImageUrl = categoryKey && siteData?.homepage?.[categoryKey];
                    return (
                    <CarouselItem key={index} className="pl-4 basis-1/2 lg:basis-1/4">
                        <Link href={`/imoveis?type=${category}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 block">
                        {isSiteDataLoading ? (
                            <Skeleton className="w-full h-full" />
                        ) : (
                            <Image
                                alt={category}
                                src={dynamicImageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                fill
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                data-ai-hint={details.imageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-5 w-full">
                            <h3 className="text-white text-xl font-bold">{category}</h3>
                        </div>
                        </Link>
                    </CarouselItem>
                    );
                })}
                </CarouselContent>
            </Carousel>
          </div>
        </section>
        
        <section className="py-16 lg:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold text-dark-text">Imóveis em Destaque</h2>
                <p className="mt-3 text-gray-600">Uma seleção curada dos melhores imóveis disponíveis em nossa plataforma.</p>
              </div>
              <Link href="/imoveis" className="inline-block bg-white border border-gray-200 text-dark-text font-bold py-3 px-6 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                Ver todos os destaques
              </Link>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Carregando imóveis...</p> : featuredProperties.map((property) => {
                  const isSaved = savedPropertyIds.includes(property.id);
                  const quartos = property.caracteristicasimovel.quartos;
                  return (
                    <Link key={property.id} href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} className="group relative break-inside-avoid overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-sm">
                                    {property.informacoesbasicas.status}
                                </div>
                                <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors group/radar", isSaved ? "text-primary" : "hover:text-primary")}>
                                    <span className="material-symbols-outlined text-[20px]">radar</span>
                                </button>
                            </div>
                            <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={property.midia[0] || "https://picsum.photos/400/300"} width={400} height={300} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 text-white">
                                {property.informacoesbasicas.valor && (
                                <p className="font-bold text-xl"><span className="text-xs font-normal text-gray-300 block">A partir de:</span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.informacoesbasicas.valor)}</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg uppercase text-dark-text group-hover:text-primary transition-colors">{property.informacoesbasicas.nome}</h3>
                            <p className="text-sm text-gray-500 mt-1">{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(quartos)}</span>
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">shower</span> {property.caracteristicasimovel.vagas}</span>
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                            </div>
                        </div>
                    </Link>
                )})}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-black text-white relative" id="features">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[150px] opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[120px] opacity-10"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">{finalContent.featuresTitle}</h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">{finalContent.featuresSubtitle}</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-sm">360</span>
                    </div>
                    <span className="text-gray-200">{finalContent.featuresItem1}</span>
                  </li>
                   <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                    </div>
                    <span className="text-gray-200">{finalContent.featuresItem2}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-sm">support_agent</span>
                    </div>
                    <span className="text-gray-200">{finalContent.featuresItem3}</span>
                  </li>
                </ul>
                <Button asChild className="bg-primary text-black font-bold py-3 px-8 rounded-lg border border-primary hover:bg-transparent hover:text-white transition-colors">
                    <Link href="/radar/nova">{finalContent.featuresButtonText}</Link>
                </Button>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 translate-y-8">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg text-white">
                      <span className="material-symbols-outlined text-4xl text-primary mb-4">{finalContent.featuresCard1Icon}</span>
                      <h4 className="font-bold text-lg mb-2">{finalContent.featuresCard1Title}</h4>
                      <p className="text-sm text-gray-400">{finalContent.featuresCard1Description}</p>
                    </div>
                    <div className="bg-dark-text p-6 rounded-2xl shadow-lg text-white">
                      <span className="material-symbols-outlined text-4xl text-primary mb-4">{finalContent.featuresCard3Icon}</span>
                      <h4 className="font-bold text-lg mb-2">{finalContent.featuresCard3Title}</h4>
                      <p className="text-sm text-gray-400">{finalContent.featuresCard3Description}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-primary p-6 rounded-2xl shadow-lg">
                      <span className="material-symbols-outlined text-4xl text-black mb-4">{finalContent.featuresCard2Icon}</span>
                      <h4 className="font-bold text-lg mb-2 text-black">{finalContent.featuresCard2Title}</h4>
                      <p className="text-sm text-black/80">{finalContent.featuresCard2Description}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                      <span className="material-symbols-outlined text-4xl text-primary mb-4">{finalContent.featuresCard4Icon}</span>
                      <h4 className="font-bold text-lg mb-2">{finalContent.featuresCard4Title}</h4>
                      <p className="text-sm text-gray-400">{finalContent.featuresCard4Description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-surface border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">mail</span>
             {isSiteDataLoading ? (
              <div className="space-y-4 max-w-lg mx-auto">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mx-auto" />
              </div>
            ) : (
              <>
                <h2 className="font-display text-3xl font-bold mb-4">{finalContent.ctaTitle}</h2>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto">{finalContent.ctaSubtitle}</p>
              </>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onNewsletterSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-12" placeholder="Seu melhor e-mail" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-primary border border-primary text-black font-bold rounded-lg hover:bg-white hover:text-black transition-colors h-12">
                    {isSubmitting ? 'Enviando...' : 'Inscrever-se'}
                  </Button>
                </form>
              </Form>
          </div>
        </section>
      </main>
      <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-10 w-auto" style={{ width: 'auto' }} />
                    </div>
                    {isSiteDataLoading ? (
                      <div className="space-y-2 max-w-xs">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <div
                        className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: siteData?.footerSlogan || 'Conectando pessoas aos seus sonhos. A plataforma mais moderna para comprar, vender e alugar imóveis no Brasil.' }}
                      />
                    )}
                    <div className="flex gap-4">
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">camera_alt</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><a className="hover:text-primary transition-colors" href="/imoveis">Comprar</a></li>
                        <li><a className="hover:text-primary transition-colors" href="/imoveis">Lançamentos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Institucional</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link className="hover:text-primary transition-colors" href="/sobre">Sobre</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="/contato">Contato</Link></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link className="hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">Política de Privacidade</Link></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Política de Cookies</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                <div className="flex items-center gap-4">
                     <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200">
                        <Link href="/login" className="flex items-center gap-2">
                           <span className="material-symbols-outlined">manage_accounts</span>
                           Área do corretor
                        </Link>
                    </Button>
                    <Link href="/corretor" className="text-xs text-gray-400 hover:text-primary transition-colors">Desenvolvido por <strong>Oraora</strong></Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

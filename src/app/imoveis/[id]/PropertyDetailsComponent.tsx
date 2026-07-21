'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useAuthContext, useAuth } from '@/firebase';
import { arrayRemove, arrayUnion, doc, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import SearchFilters from '@/components/SearchFilters';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { Skeleton } from '@/components/ui/skeleton';

type Property = {
  id: string;
  builderId: string;
  brokerId?: string;
  isVisibleOnSite?: boolean;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    condominio?: number;
    iptu?: number;
    transactionTypes?: string[];
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
    estado: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
  };
  midia: string[];
  youtubeVideoUrl?: string;
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
};

type RadarList = {
  propertyIds: string[];
};

type Poi = {
  id: string;
  position: { lat: number; lng: number };
  name: string;
  type: string;
}

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'O telefone é obrigatório'),
  message: z.string().optional(),
});
type LeadFormData = z.infer<typeof leadSchema>;

const googleMapsLibraries: Libraries = ['places'];

export default function PropertyDetailsComponent() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, userProfile, isReady } = useAuthContext();
  const [property, setProperty] = useState<Property | null>(null);
  const [brokerInfo, setBrokerInfo] = useState<any>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ logoUrl?: string; footerSlogan?: string }>(siteContentRef);

  // Maps State
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [propertyPosition, setPropertyPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [places, setPlaces] = useState<Poi[]>([]);
  const [activePoiTypes, setActivePoiTypes] = useState<string[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
  });

  const radarListDocRef = useMemoFirebase(
      () => (isReady && user ? doc(firestore, 'radarLists', user.uid) : null),
      [isReady, user, firestore]
  );
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    } else if (url.includes('vimeo.com/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
    
    if (!videoId) return null;
    if (url.includes('vimeo')) return `https://player.vimeo.com/video/${videoId}`;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const extractMapSrc = (input: string | undefined): string | null => {
    if (!input) return null;
    const iframeMatch = input.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    if (input.startsWith('http')) return input;
    return null;
  };

  const formatQuartos = (quartosData: any): string => {
    if (!quartosData) return 'N/A';
    const dataAsString = Array.isArray(quartosData) ? quartosData.join(' ') : String(quartosData);
    const numbers = dataAsString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return dataAsString.trim() || 'N/A';
    const uniqueNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (uniqueNumbers.length === 0) return 'N/A';
    if (uniqueNumbers.length === 1) return uniqueNumbers[0].toString();
    const last = uniqueNumbers.pop();
    return `${uniqueNumbers.join(', ')} e ${last}`;
  };

  useEffect(() => {
    if (!firestore || !id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let propData: Property | null = null;
        const propertiesRef = collection(firestore, 'properties');
        const q1 = query(propertiesRef, where('informacoesbasicas.slug', '==', id), limit(1));
        const snap1 = await getDocs(q1);
        
        if (!snap1.empty) {
          propData = { id: snap1.docs[0].id, ...snap1.docs[0].data() } as Property;
        } else {
          const q2 = query(collection(firestore, 'brokerProperties'), where('informacoesbasicas.slug', '==', id), limit(1));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) propData = { id: snap2.docs[0].id, ...snap2.docs[0].data() } as Property;
        }

        if (!propData) {
          const docRef = doc(firestore, "properties", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) propData = { id: snap.id, ...snap.data() } as Property;
          else {
            const brokerDocRef = doc(firestore, "brokerProperties", id);
            const brokerSnap = await getDoc(brokerDocRef);
            if (brokerSnap.exists()) propData = { id: brokerSnap.id, ...brokerSnap.data() } as Property;
          }
        }

        if (propData && propData.isVisibleOnSite !== false) {
          setProperty(propData);
          const targetId = propData.brokerId || propData.builderId;
          if (targetId) {
            const brSnap = await getDoc(doc(firestore, 'brokers', targetId));
            if (brSnap.exists()) setBrokerInfo(brSnap.data());
            else {
              const bSnap = await getDoc(doc(firestore, 'constructors', targetId));
              if (bSnap.exists()) setBrokerInfo(bSnap.data());
            }
          }
          const qSim = query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true), where('localizacao.cidade', '==', propData.localizacao.cidade), limit(5));
          const simSnap = await getDocs(qSim);
          setSimilarProperties(simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Property)).filter(p => p.id !== propData?.id).slice(0, 4));
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [firestore, id]);

  useEffect(() => {
    if (isLoaded && property) {
        if (property.localizacao.latitude && property.localizacao.longitude) {
            setPropertyPosition({ lat: property.localizacao.latitude, lng: property.localizacao.longitude });
        } else {
            const geocoder = new window.google.maps.Geocoder();
            const address = property.localizacao.address || `${property.localizacao.bairro}, ${property.localizacao.cidade}, ${property.localizacao.estado}`;
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results?.[0]) setPropertyPosition({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
            });
        }
    }
  }, [isLoaded, property]);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false);
    router.push(`/imoveis?${queryString}`);
  };

  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';

  const handleRadarToggle = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { router.push('/radar'); return; }
    if (!firestore) return;
    const docRef = doc(firestore, 'radarLists', user.uid);
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido!" });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Salvo!" });
    }
  };

  const handlePoiToggle = (type: string) => { setActivePoiTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); };

  useEffect(() => {
      if (!isLoaded || !mapInstance || !mapInstance.getCenter() || !activePoiTypes.length) { setPlaces([]); return; }
      const service = new window.google.maps.places.PlacesService(mapInstance);
      let newPlaces: Poi[] = [];
      let searchesCompleted = 0;
      activePoiTypes.forEach(type => {
          service.nearbySearch({ location: mapInstance.getCenter(), radius: 5000, type }, (results, status) => {
              searchesCompleted++;
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                  const pois = results.map(place => ({ id: place.place_id!, position: { lat: place.geometry?.location?.lat()!, lng: place.geometry?.location?.lng()! }, name: place.name!, type }));
                  const uniquePlaces = new Map<string, Poi>();
                  [...newPlaces, ...pois].forEach(p => { if (p.id) uniquePlaces.set(p.id, p); });
                  newPlaces = Array.from(uniquePlaces.values());
              }
              if (searchesCompleted === activePoiTypes.length) setPlaces(newPlaces);
          });
      });
  }, [activePoiTypes, isLoaded, mapInstance]);

  const openGallery = (index: number) => { setSelectedImageIndex(index); setIsGalleryOpen(true); };
  const closeGallery = () => { setIsGalleryOpen(false); };

  const fmt = (v: number | undefined) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v) : null;

  const renderPriceSection = () => {
    if (!property) return null;
    const types = property.informacoesbasicas.transactionTypes || ['sale'];
    const salePrice = property.informacoesbasicas.salePrice || property.informacoesbasicas.valor;
    const rentPrice = property.informacoesbasicas.rentPrice;
    const condo = property.informacoesbasicas.condominio;
    const iptu = property.informacoesbasicas.iptu;

    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft text-left space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {types.includes('sale') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor de Venda</span>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{fmt(salePrice)}</p>
                </div>
            )}
            {types.includes('rent') && (
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor de Aluguel</span>
                    <p className="text-4xl font-black text-primary">{fmt(rentPrice)}<span className="text-xl font-bold ml-1">/mês</span></p>
                </div>
            )}
        </div>
        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condomínio</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">{fmt(condo) || 'Consultar'}</p>
            </div>
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">IPTU (Anual)</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">{fmt(iptu) || 'Consultar'}</p>
            </div>
        </div>
      </div>
    );
  };

  const renderBadge = (p: Property) => {
    const types = p.informacoesbasicas.transactionTypes || ['sale'];
    if (types.includes('sale') && types.includes('rent')) return "Venda + Aluguel";
    if (types.includes('rent')) return "Para Aluguel";
    return "À Venda";
  };

  const renderSimPrice = (p: Property) => {
    const types = p.informacoesbasicas.transactionTypes || ['sale'];
    if (types.includes('rent')) return `${fmt(p.informacoesbasicas.rentPrice)}/mês`;
    return fmt(p.informacoesbasicas.salePrice || p.informacoesbasicas.valor);
  };

  const onNewsletterSubmit = async (data: LeadFormData) => {
    if (!property) return;
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: property.brokerId || property.builderId || '',
      name: data.name, email: data.email, phone: data.phone,
      propertyInterest: property.informacoesbasicas.nome,
      message: data.message,
      source: 'Formulário Portal'
    });
    if (result.success) {
      toast({ title: 'Mensagem Enviada!' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSubmitting(false);
  };

  const videoEmbedUrl = getEmbedUrl(property?.youtubeVideoUrl);
  const mapSrc = extractMapSrc(property?.localizacao.googleMapsLink);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4 bg-background-light">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="material-symbols-outlined animate-spin text-lg text-primary">progress_activity</span>
          <span className="text-sm font-medium">Carregando imóvel...</span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4 bg-background-light">
        <h2 className="text-2xl font-bold">Imóvel não encontrado.</h2>
        <Button asChild><Link href="/imoveis">Voltar para busca</Link></Button>
      </div>
    );
  }

  const isSavedProp = property && savedPropertyIds.includes(property.id);
  const whatsappNumber = (brokerInfo?.whatsapp || brokerInfo?.phone || '').replace(/\D/g, '');
  const whatsappLink = whatsappNumber ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Vi o imóvel ${property.informacoesbasicas.nome} no portal Oraora e gostaria de mais informações.`)}` : '#';

  return (
    <div className="bg-background-light overflow-x-hidden w-full flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
          <div className="flex items-center">
            <div className="lg:hidden">
              {isClient && (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="flex size-10 items-center justify-center text-text-main outline-none border-none bg-transparent cursor-pointer">
                      <span className="material-symbols-outlined">menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 flex flex-col bg-white">
                    <SheetHeader>
                      <VisuallyHidden>
                        <SheetTitle>Menu Principal</SheetTitle>
                        <SheetDescription>Navegue pelas seções do site.</SheetDescription>
                      </VisuallyHidden>
                    </SheetHeader>
                    <div className="p-6 border-b">
                      <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
                      </Link>
                    </div>
                    <nav className="flex flex-col gap-2 p-4 text-lg font-semibold text-left">
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
                    </nav>
                    <div className="mt-auto p-6 space-y-4 border-t">
                      {user ? (
                        <>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarImage src={user.photoURL || ''} />
                              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
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
              )}
            </div>
            <Link className="hidden lg:flex items-center gap-3" href="/">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
            </Link>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link className="flex items-center gap-3 lg:hidden" href="/">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" />
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
            <div className="hidden lg:flex items-center gap-4">
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
              {isClient && (
                <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                  <DialogTrigger asChild>
                    <button className="flex size-10 items-center justify-center text-text-main outline-none border-none bg-transparent cursor-pointer">
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
              )}
              <Link href="/radar" className="flex size-10 items-center justify-center text-text-main">
                <span className="material-symbols-outlined">radar</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-0 w-full pb-20 text-left">
        <section className="w-full max-w-[1280px] mx-auto px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[500px]">
            <div onClick={() => openGallery(0)} className="col-span-1 md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-xl aspect-[4/3] md:aspect-auto">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${property.midia?.[0] || ''}")` }}></div>
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2 hover:bg-black/80 transition-colors"><span className="material-symbols-outlined text-base">photo_camera</span> Ver fotos</div>
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm bg-white text-black">{renderBadge(property)}</div>
            </div>
            {property.midia.slice(1, 5).map((img, idx) => (
              <div key={idx} onClick={() => openGallery(idx + 1)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft h-full">
                <Image alt="img" src={img} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div className="border-b border-gray-100 pb-8 text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="text-left">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">{property.informacoesbasicas.nome}</h1>
                    <p className="text-gray-500 flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-lg text-primary">location_on</span>{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                  </div>
                  <Button onClick={(e) => handleRadarToggle(e, property.id)} variant="outline" size="icon" className={cn("size-12 rounded-xl border-2", isSavedProp ? "border-primary bg-primary/10 text-primary" : "text-black")}><span className="material-symbols-outlined" style={{ fontVariationSettings: isSavedProp ? "'FILL' 1" : "" }}>radar</span></Button>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50 text-slate-900 flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-lg text-primary">bed</span>{formatQuartos(property.caracteristicasimovel.quartos)} Quartos</Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50 text-slate-900 flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-lg text-primary">directions_car</span>{property.caracteristicasimovel.vagas} Vagas</Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50 text-slate-900 flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-lg text-primary">square_foot</span>{property.caracteristicasimovel.tamanho} úteis</Badge>
                </div>
              </div>

              {renderPriceSection()}

              <div className="prose text-gray-600 max-w-none leading-relaxed text-left">
                <h2 className="text-2xl font-bold mb-4 text-slate-900 uppercase tracking-tight">Sobre o imóvel</h2>
                <div dangerouslySetInnerHTML={{ __html: property.informacoesbasicas.descricao || '' }} />
              </div>

              {videoEmbedUrl && (
                <div className="text-left">
                  <h2 className="text-2xl font-bold mb-6 text-slate-900 uppercase tracking-tight">Apresentação em Vídeo</h2>
                  <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-black border border-slate-100">
                    <iframe src={videoEmbedUrl} title="Video Tour" className="w-full h-full" allowFullScreen></iframe>
                  </div>
                </div>
              )}

              {property.areascomuns && property.areascomuns.length > 0 && (
                <div className="text-left">
                  <h2 className="text-2xl font-bold mb-6 text-slate-900 uppercase tracking-tight">Diferenciais</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    {property.areascomuns.map((item, idx) => (
                      <div key={`${item}-${idx}`} className="flex items-center gap-3 text-gray-600">
                        <span className="material-symbols-outlined text-primary font-bold">check_circle</span>
                        <span className="font-bold text-slate-900 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-left">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 uppercase tracking-tight">Localização</h2>
                <div className="w-full h-[400px] rounded-3xl bg-slate-200 overflow-hidden relative border border-slate-100 shadow-inner">
                  {mapSrc ? (
                    <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" className="grayscale dark:invert opacity-70" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 text-center">
                      <span className="material-symbols-outlined text-6xl">map</span>
                      <p className="font-bold uppercase tracking-widest text-xs">Aguardando coordenadas do mapa</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <aside className="sticky top-24 space-y-6">
                <div className="bg-white rounded-3xl shadow-float p-6 border border-gray-100 text-left">
                  <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">Agendar Visita</h3>
                  <form onSubmit={form.handleSubmit(onNewsletterSubmit)} className="space-y-4">
                    <Input {...form.register('name')} placeholder="Seu nome" className="h-12 rounded-xl bg-slate-50 border-none" />
                    <Input {...form.register('email')} placeholder="Seu e-mail" className="h-12 rounded-xl bg-slate-50 border-none" />
                    <Input {...form.register('phone')} placeholder="Seu telefone" className="h-12 rounded-xl bg-slate-50 border-none" />
                    <Textarea {...form.register('message')} placeholder="Mensagem" className="h-32 rounded-xl bg-slate-50 border-none resize-none" />
                    <Button disabled={isSubmitting} type="submit" className="w-full h-14 bg-slate-900 hover:bg-black font-bold text-white uppercase tracking-widest text-xs rounded-xl shadow-lg">
                      {isSubmitting ? 'Enviando...' : 'ENVIAR MENSAGEM'}
                    </Button>
                  </form>
                  {whatsappNumber && (
                    <div className="mt-6 space-y-4">
                        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ou</span><div className="flex-grow border-t border-slate-100"></div></div>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full h-14 bg-primary hover:bg-primary-hover text-black font-black rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"><span className="material-symbols-outlined text-xl font-bold">chat</span> Falar no WhatsApp</a>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>

        {similarProperties.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 text-left">
            <div className="text-left mb-12 border-b border-slate-100 pb-6 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Imóveis Semelhantes</h2>
                <p className="text-gray-500 mt-1 font-medium">Opções na mesma região para você comparar.</p>
              </div>
              <Link href="/imoveis" className="text-xs font-black text-primary-hover uppercase tracking-widest hover:underline">Ver catálogo</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {similarProperties.map(sim => (
                  <Link key={sim.id} href={`/imoveis/${sim.informacoesbasicas.slug || sim.id}`} className="group relative flex flex-col rounded-3xl bg-white shadow-soft transition hover:-translate-y-2 hover:shadow-xl border border-slate-100 overflow-hidden">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 text-black text-[9px] font-black px-3 py-1 rounded-md shadow-sm uppercase tracking-widest">{renderBadge(sim)}</div>
                        <Image alt={sim.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" src={sim.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-sm uppercase text-slate-900 group-hover:text-primary transition-colors truncate mb-1 tracking-tight">{sim.informacoesbasicas.nome}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">{sim.localizacao.bairro}, {sim.localizacao.cidade}</p>
                        <p className="text-xl font-black text-primary mt-auto tracking-tighter">{renderSimPrice(sim)}</p>
                    </div>
                  </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-8 w-auto" style={{ width: 'auto' }} />
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
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link className="hover:text-primary transition-colors font-medium" href="/imoveis?finality=sale">Comprar</Link></li>
                    <li><Link className="hover:text-primary transition-colors font-medium" href="/imoveis?status=Lançamento">Lançamentos</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Empresa</h4>
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
                  </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400 font-medium">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                <div className="flex items-center gap-4">
                     <Button asChild variant="ghost" className="text-sm font-bold text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-10 rounded-xl px-4">
                        <Link href="/login" className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-base">manage_accounts</span>
                           Área do Corretor
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </footer>
      <WhatsAppWidget brokerId="oraora-main-site" />

      {isGalleryOpen && property.midia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white border-b border-white/10"><span className="font-bold text-sm uppercase tracking-widest">{selectedImageIndex + 1} / {property.midia.length}</span><button onClick={closeGallery} className="size-10 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button></div>
          <div className="flex-1 relative flex items-center justify-center">
            <button onClick={() => setSelectedImageIndex(p => (p - 1 + property.midia.length) % property.midia.length)} className="absolute left-4 p-2 text-white hover:text-primary transition-colors"><span className="material-symbols-outlined text-4xl">chevron_left</span></button>
            <div className="relative h-full w-full flex items-center justify-center p-4">
              <img alt="Gallery" className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg" src={property.midia[selectedImageIndex]} />
            </div>
            <button onClick={() => setSelectedImageIndex(p => (p + 1) % property.midia.length)} className="absolute right-4 p-2 text-white hover:text-primary transition-colors"><span className="material-symbols-outlined text-4xl">chevron_right</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
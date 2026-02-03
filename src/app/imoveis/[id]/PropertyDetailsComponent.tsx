
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase';
import { arrayRemove, arrayUnion, doc, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type Property = {
  id: string;
  builderId: string;
  isVisibleOnSite?: boolean;
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

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'O telefone é obrigatório'),
  message: z.string().optional(),
});
type LeadFormData = z.infer<typeof leadSchema>;

const whatsappLeadSchema = z.object({
  whatsappName: z.string().min(1, 'O nome é obrigatório'),
  whatsappPhone: z.string().min(10, 'O telefone é obrigatório'),
});
type WhatsappLeadFormData = z.infer<typeof whatsappLeadSchema>;


export default function PropertyDetailsComponent() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !id) return;

    const getPropertyData = async (slug: string): Promise<Property | null> => {
        let propData: Property | null = null;
        
        // Query 'properties' collection
        const propertiesRef = collection(firestore, 'properties');
        const q1 = query(propertiesRef, where('informacoesbasicas.slug', '==', slug), limit(1));
        const querySnapshot1 = await getDocs(q1);
        
        if (!querySnapshot1.empty) {
            const doc = querySnapshot1.docs[0];
            propData = { id: doc.id, ...doc.data() } as Property;
        } else {
            // If not found, query 'brokerProperties' collection
            const brokerPropertiesRef = collection(firestore, 'brokerProperties');
            const q2 = query(brokerPropertiesRef, where('informacoesbasicas.slug', '==', slug), limit(1));
            const querySnapshot2 = await getDocs(q2);

            if (!querySnapshot2.empty) {
                const doc = querySnapshot2.docs[0];
                propData = { id: doc.id, ...doc.data() } as Property;
            }
        }
        
        // Fallback to ID
        if (!propData) {
            try {
              let docRef = doc(firestore, "properties", slug);
              let docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  propData = { id: docSnap.id, ...docSnap.data() } as Property;
              } else {
                  docRef = doc(firestore, "brokerProperties", slug);
                  docSnap = await getDoc(docRef);
                  if (docSnap.exists()) {
                      propData = { id: docSnap.id, ...docSnap.data() } as Property;
                  }
              }
            } catch(e) {
                console.error("Error fetching document by ID, it might be an invalid slug format for an ID", e);
            }
        }

        return propData;
    }

    const getSimilarProperties = async (currentProperty: Property): Promise<Property[]> => {
      if (!currentProperty || !firestore) return [];
  
      const propertiesRef = collection(firestore, 'properties');
      const q = query(
        propertiesRef,
        where('isVisibleOnSite', '==', true),
        limit(10)
      );
  
      const querySnapshot = await getDocs(q);
      
      const similar = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Property))
        .filter(p => p.id !== currentProperty.id);

      return similar.slice(0, 4);
    };


    const fetchData = async () => {
        setLoading(true);
        const prop = await getPropertyData(id);

        if (prop && prop.isVisibleOnSite !== false) {
            setProperty(prop);
            const similar = await getSimilarProperties(prop);
            setSimilarProperties(similar);
        } else {
            setProperty(null);
        }
        setLoading(false);
    };

    fetchData();
  }, [firestore, id]);


  const { informacoesbasicas, midia, caracteristicasimovel, localizacao, areascomuns, youtubeVideoUrl } = property || {};
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const brokerPhoneNumber = "5511999999999"; // Placeholder
  const router = useRouter();
  const { user } = useUser();
  
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

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: `Olá, gostaria de mais informações sobre ${informacoesbasicas?.nome}...`,
    },
  });
  
  const whatsappForm = useForm<WhatsappLeadFormData>({
    resolver: zodResolver(whatsappLeadSchema),
    defaultValues: {
      whatsappName: '',
      whatsappPhone: ''
    }
  });


  const onSubmit = async (data: LeadFormData) => {
    if (!property) return;
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: property.builderId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: informacoesbasicas?.nome,
      message: data.message,
    });

    if (result.success) {
      toast({
        title: 'Mensagem Enviada!',
        description: 'Recebemos seu contato e retornaremos em breve.',
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };
  
  const onWhatsappSubmit = async (data: WhatsappLeadFormData) => {
    if (!property) return;
    const result = await createLead({
      brokerId: property.builderId,
      name: data.whatsappName,
      email: `${data.whatsappPhone.replace(/\D/g, '')}@whatsapp.lead`,
      phone: data.whatsappPhone,
      propertyInterest: informacoesbasicas?.nome,
      source: 'WhatsApp'
    });

    if (result.success) {
      const message = encodeURIComponent(`Olá, me chamo ${data.whatsappName} e gostaria de saber mais sobre o empreendimento ${informacoesbasicas?.nome}`);
      window.open(`https://wa.me/${brokerPhoneNumber}?text=${message}`, '_blank');
      whatsappForm.reset();
      setIsWhatsappModalOpen(false);
    } else {
       toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: 'Não foi possível registrar seu contato. Tente novamente.',
      });
    }
  };


  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const nextImage = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % (midia?.length || 1));
  };

  const prevImage = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex - 1 + (midia?.length || 1)) % (midia?.length || 1));
  };
  
  const extractSrcFromIframe = (linkOrIframe: string | undefined): string | null => {
    if (!linkOrIframe) return null;
    const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1];
    }
    try {
      const url = new URL(linkOrIframe);
      if (url.hostname.includes('google.com') && (url.pathname.includes('/maps') || url.pathname.includes('/maps/embed'))) {
        return linkOrIframe;
      }
    } catch (e) {
      // Not a valid URL
    }
    return null;
  };
  
  const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop()?.split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

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

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Carregando detalhes do imóvel...</div>;
  }

  if (!property) {
    notFound();
    return null;
  }

  const videoEmbedUrl = getYoutubeEmbedUrl(youtubeVideoUrl);
  const mapSrc = extractSrcFromIframe(localizacao?.googleMapsLink);
  const streetViewSrc = extractSrcFromIframe(localizacao?.googleStreetViewLink);

  const isSaved = savedPropertyIds.includes(property.id);

  return (
    <>
      <main className="pt-0">
        <section className="w-full max-w-[1280px] mx-auto px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[500px]">
            <div onClick={() => openGallery(0)} className="col-span-1 md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft aspect-[4/3] md:aspect-auto">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${midia?.[0] || ''}")` }}></div>
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">photo_camera</span> Ver todas as fotos
              </div>
              <div className="absolute top-4 left-4 bg-primary text-black px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                Destaque
              </div>
            </div>
            <div onClick={() => openGallery(1)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[1] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(2)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[2] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(3)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[3] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(4)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[4] || ''}")` }}></div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-bold text-lg border border-white/50 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">+{midia.length - 5} Fotos</span>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div className="border-b border-gray-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-dark-text mb-2">{informacoesbasicas?.nome}</h1>
                    <p className="text-gray-500 flex items-center gap-1 text-sm md:text-base">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      {localizacao?.bairro}, {localizacao?.cidade} - {localizacao?.estado}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left md:text-right">
                      {informacoesbasicas?.valor && (
                          <p className="text-3xl font-bold text-dark-text tracking-tight">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(informacoesbasicas.valor)}
                          </p>
                      )}
                    </div>
                     <Button onClick={(e) => handleRadarClick(e, property.id)} variant="outline" size="icon" className={cn("size-12 rounded-xl border-2", isSaved ? "border-primary bg-primary/10 text-primary" : "text-gray-400")}>
                          <span className="material-symbols-outlined">radar</span>
                      </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  {caracteristicasimovel?.quartos && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg border border-gray-100 text-sm font-medium">
                          <span className="material-symbols-outlined text-gray-400">bed</span>
                          <span>{formatQuartos(caracteristicasimovel.quartos)} Quartos</span>
                      </div>
                  )}
                  {caracteristicasimovel?.vagas && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg border border-gray-100 text-sm font-medium">
                          <span className="material-symbols-outlined text-gray-400">directions_car</span>
                          <span>{caracteristicasimovel.vagas} Vagas</span>
                      </div>
                  )}
                  {caracteristicasimovel?.tamanho && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg border border-gray-100 text-sm font-medium">
                          <span className="material-symbols-outlined text-gray-400">square_foot</span>
                          <span>{caracteristicasimovel.tamanho} úteis</span>
                      </div>
                  )}
                </div>
              </div>
              
              {videoEmbedUrl && (
                  <div>
                      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-gray-200">
                          <iframe
                          src={videoEmbedUrl}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          ></iframe>
                      </div>
                  </div>
                )}
                
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold">Sobre o imóvel</h2>
                <p className="text-gray-600 leading-relaxed">{informacoesbasicas?.descricao}</p>
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">O que este imóvel oferece</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {areascomuns?.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-gray-600">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
               <div>
                <h2 className="font-display text-2xl font-bold mb-6">Localização</h2>
                <Tabs defaultValue="map" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-gray-100 rounded-xl">
                      <TabsTrigger value="map" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg text-gray-500 font-bold flex items-center gap-2 transition-all">
                          <span className="material-symbols-outlined">map</span>
                          Mapa
                      </TabsTrigger>
                      <TabsTrigger value="streetview" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg text-gray-500 font-bold flex items-center gap-2 transition-all">
                          <span className="material-symbols-outlined">streetview</span>
                          Street View
                      </TabsTrigger>
                  </TabsList>
                  <TabsContent value="map">
                    <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden relative mt-4">
                      {mapSrc ? (
                          <iframe
                              src={mapSrc}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen={false}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                      ) : <div className="flex items-center justify-center h-full text-text-secondary">Mapa não disponível</div>}
                    </div>
                  </TabsContent>
                  <TabsContent value="streetview">
                    <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden relative mt-4">
                      {streetViewSrc ? (
                          <iframe
                              src={streetViewSrc}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen={false}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                      ) : <div className="flex items-center justify-center h-full text-text-secondary">Street View não disponível</div>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-2xl shadow-float p-6 border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-16 rounded-full bg-gray-200 overflow-hidden border-2 border-primary">
                      <Image alt="Corretor" className="w-full h-full object-cover" width={64} height={64} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnnSrwSkNX4VEMzf8v2AibJQp1RcHvNb3_q0wuoHZwhVlAJKqmwIhebGEXD_ehHxVeLXegQhl11I3AK8d7sHOjyX2Ru2QsxLQ7CNKGhMFL1kuVczfW4JlWO-MgFaOLLDGfDt2hXsZyS7t5vdOo90YwN1Cwqcoemknmi74RiulnUXgpEBnQguZIsUxNueG01P_uPnYKeZbzSmXBrfvlrkH_y3PAJxi8hET-_dNaHXrJavIJPjRaZDjfN1aQrROrA0lpueLFt6_FA6I" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-bold uppercase">Corretor Responsável</p>
                      <h3 className="text-lg font-bold text-text-main">Carlos Silva</h3>
                      <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        4.9 (128 avaliações)
                      </div>
                    </div>
                  </div>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                      <label className="sr-only" htmlFor="name-contact">Nome</label>
                      <input {...form.register('name')} className="w-full h-12 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="name-contact" placeholder="Seu nome completo" type="text" />
                      {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="sr-only" htmlFor="email-contact">E-mail</label>
                      <input {...form.register('email')} className="w-full h-12 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="email-contact" placeholder="Seu melhor e-mail" type="email" />
                      {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="sr-only" htmlFor="phone-contact">Telefone</label>
                      <input {...form.register('phone')} className="w-full h-12 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="phone-contact" placeholder="(DDD) Telefone / WhatsApp" type="tel" />
                       {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="sr-only" htmlFor="message-contact">Mensagem</label>
                      <textarea {...form.register('message')} className="w-full rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50 resize-none h-32 p-3" id="message-contact"></textarea>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button disabled={isSubmitting} className="w-full h-12 rounded-lg bg-black text-primary font-bold hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-2 group" type="submit">
                           <span className="material-symbols-outlined">send</span>
                           {isSubmitting ? 'Enviando...' : 'Quero saber mais'}
                        </button>
                    </div>
                  </form>
                  <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full h-12 rounded-lg border-[#25D366] text-[#25D366] font-bold hover:bg-[#25D366]/10 transition-colors flex items-center justify-center gap-2 mt-3">
                            <span className="material-symbols-outlined">chat</span>
                            Falar no WhatsApp
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Contato via WhatsApp</DialogTitle>
                          <DialogDescription>
                            Preencha seus dados para iniciar a conversa. Um de nossos corretores retornará o contato em breve.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)} className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="whatsappName" className="text-right">
                              Nome
                            </Label>
                            <Input {...whatsappForm.register('whatsappName')} id="whatsappName" className="col-span-3" />
                            {whatsappForm.formState.errors.whatsappName && <p className="col-span-4 text-right text-xs text-red-500">{whatsappForm.formState.errors.whatsappName.message}</p>}
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="whatsappPhone" className="text-right">
                              Telefone
                            </Label>
                            <Input {...whatsappForm.register('whatsappPhone')} id="whatsappPhone" className="col-span-3" />
                            {whatsappForm.formState.errors.whatsappPhone && <p className="col-span-4 text-right text-xs text-red-500">{whatsappForm.formState.errors.whatsappPhone.message}</p>}
                          </div>
                           <DialogFooter>
                            <Button type="submit" variant="secondary" className="bg-[#25D366] hover:bg-green-600 text-white">
                                <span className="material-symbols-outlined mr-2">send</span>
                                Iniciar Conversa
                            </Button>
                        </DialogFooter>
                        </form>
                      </DialogContent>
                  </Dialog>
                  <p className="text-xs text-center text-text-muted mt-4">
                    Ao enviar, você concorda com nossos <a className="underline hover:text-primary" href="#">Termos de Uso</a>.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
                    <div>
                      <h4 className="font-bold text-text-main text-sm">Simulação de Financiamento</h4>
                      <p className="text-xs text-text-muted mt-1">Entrada sugerida: R$ 1.100.000</p>
                      <p className="text-xs text-text-muted">Parcelas a partir de: R$ 38.500</p>
                      <a className="text-xs font-bold text-primary bg-black inline-block mt-3 px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors" href="#">
                        Simular Agora
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <section className="w-full max-w-[1280px] px-6 mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text-main">Imóveis Semelhantes</h2>
            <Link className="text-sm font-bold text-white bg-black px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0" href="/imoveis">
                Ver Todos os Imóveis
              </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {similarProperties.map(property => {
              const isSaved = savedPropertyIds.includes(property.id);
              const quartos = property.caracteristicasimovel.quartos;
              return (
                 <Link key={property.id} href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} className="group relative flex flex-col rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-sm shadow-sm">
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
                                <p className="font-bold text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.informacoesbasicas.valor)}</p>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-lg text-dark-text group-hover:text-primary transition-colors">{property.informacoesbasicas.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1">{property.localizacao.bairro}, {property.localizacao.cidade}</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                            {quartos && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(quartos)}</span>}
                            {property.caracteristicasimovel.vagas && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">directions_car</span> {property.caracteristicasimovel.vagas} Vaga(s)</span>}
                            {property.caracteristicasimovel.tamanho && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>}
                        </div>
                    </div>
                </Link>
            )})}
          </div>
        </section>
      </main>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-text-muted">{selectedImageIndex + 1} / {midia.length}</span>
              <div className="h-4 w-px bg-gray-200"></div>
              <h3 className="text-sm font-bold text-text-main hidden sm:block">{informacoesbasicas.nome}</h3>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={closeGallery} className="flex items-center justify-center size-10 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg transition-all transform hover:scale-105" title="Fechar">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-gray-50/50">
            <button onClick={prevImage} className="absolute left-4 z-10 size-12 rounded-full bg-white text-text-main shadow-float hover:bg-primary hover:text-black transition-all flex items-center justify-center group">
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chevron_left</span>
            </button>
            <div className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden group">
              <img alt={`Visão ${selectedImageIndex + 1} de ${informacoesbasicas.nome}`} className="max-h-[70vh] w-auto object-contain pointer-events-none select-none" src={midia[selectedImageIndex]} />
            </div>
            <button onClick={nextImage} className="absolute right-4 z-10 size-12 rounded-full bg-white text-text-main shadow-float hover:bg-primary hover:text-black transition-all flex items-center justify-center group">
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chevron_right</span>
            </button>
          </div>
          <div className="h-28 bg-white border-t border-gray-100/80 p-4 flex items-center justify-center gap-3 overflow-x-auto relative z-20">
            <div className="flex gap-3 px-4 min-w-min mx-auto">
              {midia.map((img, index) => (
                <div key={img} onClick={() => setSelectedImageIndex(index)} className={`relative w-24 h-16 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all hover:opacity-100 ${selectedImageIndex === index ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60'}`}>
                  <img alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" src={img} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

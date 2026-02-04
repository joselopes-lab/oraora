
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
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
        where('localizacao.cidade', '==', currentProperty.localizacao.cidade),
        limit(5)
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
      message: '',
    },
  });

  useEffect(() => {
    if (property) {
        form.reset({
            message: `Olá, gostaria de mais informações sobre ${property.informacoesbasicas.nome}...`
        })
    }
  }, [property, form]);
  
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
      source: 'Formulário de Contato do Imóvel'
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
                <span className="text-white font-bold text-lg border border-white/50 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">+{midia.length > 5 ? midia.length - 5 : 0} Fotos</span>
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
                    <h1 className="font-display text-3xl md:text-4xl font-semibold text-dark-text mb-2 uppercase">{informacoesbasicas?.nome}</h1>
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
                  <h3 className="text-xl font-bold text-text-main mb-4">Quero mais informações</h3>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                      <div>
                      <label className="sr-only" htmlFor="name-contact">Nome</label>
                      <input {...form.register('name')} className="w-full h-12 px-4 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="name-contact" placeholder="Seu nome completo" type="text" />
                      {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                      </div>
                      <div>
                      <label className="sr-only" htmlFor="email-contact">E-mail</label>
                      <input {...form.register('email')} className="w-full h-12 px-4 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="email-contact" placeholder="Seu melhor e-mail" type="email" />
                      {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                      </div>
                      <div>
                      <label className="sr-only" htmlFor="phone-contact">Telefone</label>
                      <input {...form.register('phone')} className="w-full h-12 px-4 rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50" id="phone-contact" placeholder="(DDD) Telefone / WhatsApp" type="tel" />
                       {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
                      </div>
                      <div>
                      <label className="sr-only" htmlFor="message-contact">Mensagem</label>
                      <textarea {...form.register('message')} className="w-full rounded-lg border-gray-200 text-sm focus:border-primary focus:ring-primary placeholder-gray-400 bg-gray-50 resize-none h-32 p-3" id="message-contact"></textarea>
                      </div>
                       <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
                        <div className="flex flex-col gap-3">
                            <button disabled={isSubmitting} className="w-full h-12 rounded-lg bg-black text-primary font-bold hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-2 group" type="submit">
                               <span className="material-symbols-outlined">send</span>
                               {isSubmitting ? 'Enviando...' : 'Quero saber mais'}
                            </button>
                            <DialogTrigger asChild>
                                <Button className="w-full h-12 rounded-lg bg-[#25D366] text-white font-bold hover:bg-white hover:text-black border border-transparent hover:border-gray-200 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">chat</span>
                                    Falar no WhatsApp
                                </Button>
                            </DialogTrigger>
                        </div>
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
                  </form>
                   <p className="text-xs text-center text-text-muted mt-4">
                    Ao enviar, você concorda com nossos{' '}
                    <Dialog>
                        <DialogTrigger asChild>
                        <button type="button" className="underline hover:text-primary">Termos de Uso</button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Termos de Uso</DialogTitle>
                                <DialogDescription>
                                    Última atualização: 26 de Julho de 2024
                                </DialogDescription>
                            </DialogHeader>
                            <div className="prose max-h-[60vh] overflow-y-auto pr-4 text-sm text-muted-foreground">
                                <h2>1. IDENTIFICAÇÃO</h2>
                                <p>Este site e a plataforma OraOra são operados por ORAORA SOLUÇÕES DIGITAIS INOVA SIMPLES (I.S.), pessoa jurídica inscrita no CNPJ nº 64.052.552/0001-26, com sede na Rua Rui Barbosa, nº 1486, Centro, Foz do Iguaçu/PR, e e-mail de contato contato@oraora.com.br, doravante denominada “OraOra”.</p>
                                <h2>2. ACEITAÇÃO DOS TERMOS</h2>
                                <p>Ao acessar, navegar, cadastrar-se ou utilizar qualquer funcionalidade do site OraOra, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a Política de Privacidade.</p>
                                <p>Caso não concorde, o usuário deve se abster de utilizar a plataforma.</p>
                                <h2>3. O QUE É O ORAORA</h2>
                                <p>O OraOra é um ecossistema digital imobiliário, que atua como:</p>
                                <ul>
                                    <li>Plataforma tecnológica (SaaS);</li>
                                    <li>Canal de distribuição de informações imobiliárias;</li>
                                    <li>Hub de visibilidade, curadoria e conexão entre corretores, construtoras e o público final.</li>
                                </ul>
                                <p>O OraOra não é imobiliária, não intermedeia negócios imobiliários, não participa de negociações, não recebe comissões e não firma contratos de compra, venda, locação ou promessa de imóveis.</p>
                                <p>Toda e qualquer relação comercial ocorre diretamente entre usuários (corretores, construtoras e público final).</p>
                                <h2>4. USUÁRIOS DA PLATAFORMA</h2>
                                <p>A plataforma pode ser utilizada por:</p>
                                <h3>4.1 Público Final</h3>
                                <p>Pode navegar livremente sem cadastro.</p>
                                <p>Algumas funcionalidades exigem criação de conta.</p>
                                <h3>4.2 Corretores de Imóveis</h3>
                                <p>Devem criar conta própria e comprovar registro ativo no CRECI.</p>
                                <p>São responsáveis pelas informações, conteúdos e imóveis divulgados.</p>
                                <h3>4.3 Construtoras</h3>
                                <p>Possuem conta própria e são responsáveis pelas informações de seus empreendimentos.</p>
                                <h2>5. RESPONSABILIDADE SOBRE IMÓVEIS E CONTEÚDOS</h2>
                                <p>As informações dos imóveis são de responsabilidade exclusiva dos corretores e/ou construtoras.</p>
                                <p>O OraOra atua apenas como plataforma de exibição, organização, curadoria e distribuição de conteúdo.</p>
                                <p>O OraOra não garante veracidade, disponibilidade, valores, condições ou atualização dos imóveis anunciados.</p>
                                <h2>6. MODERAÇÃO, SUSPENSÃO E EXCLUSÃO</h2>
                                <p>O OraOra se reserva o direito de, a qualquer momento, sem aviso prévio:</p>
                                <ul>
                                    <li>Remover anúncios;</li>
                                    <li>Excluir conteúdos;</li>
                                    <li>Suspender ou encerrar contas;</li>
                                </ul>
                                <p>Sempre que houver:</p>
                                <ul>
                                    <li>Violação destes Termos;</li>
                                    <li>Uso indevido da plataforma;</li>
                                    <li>Informações falsas ou ilegais;</li>
                                    <li>Descumprimento de normas legais ou éticas.</li>
                                </ul>
                                <h2>7. LEADS E CONTATOS</h2>
                                <p>Os contatos enviados pelo público final são direcionados diretamente ao corretor ou construtora responsável.</p>
                                <p>O OraOra mantém cópia dos dados para fins operacionais, legais e de melhoria da plataforma.</p>
                                <p>O corretor/construtora atua como <strong>Controlador</strong> dos dados dos leads.</p>
                                <p>O OraOra atua como <strong>Operador</strong> desses dados, nos termos da LGPD.</p>
                                <h2>8. PLANOS, PAGAMENTOS E CANCELAMENTO</h2>
                                <p>O OraOra opera em modelo SaaS com planos mensais e renovação automática.</p>
                                <p>O cancelamento pode ser solicitado a qualquer momento, produzindo efeitos ao final do ciclo vigente.</p>
                                <p>Não há reembolso de valores já pagos.</p>
                                <p>O OraOra pode alterar preços, planos e funcionalidades mediante aviso prévio.</p>
                                <p>Novos planos, produtos ou serviços pagos podem ser criados a qualquer tempo.</p>
                                <h2>9. PROPRIEDADE INTELECTUAL</h2>
                                <p>Todo o conteúdo da plataforma (marca, layout, sistema, textos, códigos, funcionalidades) pertence ao OraOra ou a seus licenciantes, sendo vedada qualquer reprodução sem autorização.</p>
                                <h2>10. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                                <p>O OraOra não se responsabiliza por:</p>
                                <ul>
                                    <li>Negociações imobiliárias;</li>
                                    <li>Atos praticados por usuários;</li>
                                    <li>Perdas financeiras decorrentes de contratos entre terceiros;</li>
                                    <li>Indisponibilidade temporária da plataforma.</li>
                                </ul>
                                <h2>11. ALTERAÇÕES DOS TERMOS</h2>
                                <p>Estes Termos podem ser alterados a qualquer momento. O uso contínuo da plataforma implica aceitação das novas versões.</p>
                                <h2>12. FORO</h2>
                                <p>Fica eleito o foro da Comarca de João Pessoa/PB, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button">Fechar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-[35px]">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-main">Imóveis Semelhantes</h2>
            <p className="text-text-muted mt-2">Explore outras opções que também podem te agradar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map((similarProperty) => {
              const isSaved = savedPropertyIds.includes(similarProperty.id);
              const quartos = similarProperty.caracteristicasimovel.quartos;
              return (
                <Link href={`/imoveis/${similarProperty.informacoesbasicas.slug || similarProperty.id}`} key={similarProperty.id} className="group relative break-inside-avoid overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-sm">
                        {similarProperty.informacoesbasicas.status}
                      </div>
                      <button onClick={(e) => handleRadarClick(e, similarProperty.id)} className={cn("flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors group/radar", isSaved ? "text-primary" : "hover:text-primary")}>
                        <span className="material-symbols-outlined text-[20px]">radar</span>
                      </button>
                    </div>
                    {similarProperty.informacoesbasicas.status === 'Lançamento' && (
                      <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-black shadow-[0_0_15px_rgba(195,231,56,0.4)]">
                        Novo
                      </div>
                    )}
                    <Image alt={similarProperty.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={similarProperty.midia[0] || "https://picsum.photos/400/300"} width={400} height={300} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 text-white">
                      {similarProperty.informacoesbasicas.valor && (
                        <p className="font-bold text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(similarProperty.informacoesbasicas.valor)}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg uppercase text-dark-text group-hover:text-primary transition-colors">{similarProperty.informacoesbasicas.nome}</h3>
                    <p className="text-sm text-gray-500 mt-1">{similarProperty.localizacao.bairro}, {similarProperty.localizacao.cidade}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">bed</span> {formatQuartos(quartos)}</span>
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">shower</span> {similarProperty.caracteristicasimovel.vagas}</span>
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">square_foot</span> {similarProperty.caracteristicasimovel.tamanho}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      {isGalleryOpen && midia && (
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

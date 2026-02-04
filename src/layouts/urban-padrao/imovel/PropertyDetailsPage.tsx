'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion, doc } from 'firebase/firestore';
import { useRouter, notFound } from 'next/navigation';
import { cn } from '@/lib/utils';


type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  slug: string;
};

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
    googleMapsLink?: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
  youtubeVideoUrl?: string;
};

type PropertyDetailsPageProps = {
  broker: Broker;
  property: Property;
  similarProperties: Property[];
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

type RadarList = {
  propertyIds: string[];
};


export default function PropertyDetailsPage({ broker, property, similarProperties }: PropertyDetailsPageProps) {
  if (!property) {
    notFound();
  }
  const { informacoesbasicas, midia, caracteristicasimovel, localizacao, areascomuns, youtubeVideoUrl } = property;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const brokerPhoneNumber = "5511999999999"; // Placeholder para o número do corretor
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
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
    if (informacoesbasicas?.nome) {
      form.reset({
        message: `Olá, gostaria de mais informações sobre ${informacoesbasicas.nome}...`
      })
    }
  }, [informacoesbasicas?.nome, form]);
  
  const whatsappForm = useForm<WhatsappLeadFormData>({
    resolver: zodResolver(whatsappLeadSchema),
    defaultValues: {
      whatsappName: '',
      whatsappPhone: ''
    }
  });


  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: broker.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: informacoesbasicas.nome,
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
    const result = await createLead({
      brokerId: broker.id,
      name: data.whatsappName,
      email: `${data.whatsappPhone.replace(/\D/g, '')}@whatsapp.lead`,
      phone: data.whatsappPhone,
      propertyInterest: informacoesbasicas.nome,
      source: 'WhatsApp'
    });

    if (result.success) {
      const message = encodeURIComponent(`Olá, me chamo ${data.whatsappName} e gostaria de saber mais sobre o empreendimento ${informacoesbasicas.nome}`);
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
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % midia.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex - 1 + midia.length) % midia.length);
  };

  const isSaved = savedPropertyIds.includes(property.id);

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

  const extractMapSrc = (linkOrIframe: string | undefined): string | null => {
    if (!linkOrIframe) return null;
    const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1];
    }
    try {
      const url = new URL(linkOrIframe);
      if (url.hostname.includes('google.com') && url.pathname.includes('/maps')) {
        return linkOrIframe;
      }
    } catch (e) {
      // Not a valid URL
    }
    return null;
  };
  const mapSrc = extractMapSrc(localizacao.googleMapsLink);

  const dynamicStyles = {
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex flex-col items-center pb-20">
        <div className="w-full bg-white py-4 border-b border-[#f0f2f4]">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <nav className="flex text-sm text-text-muted mb-4">
              <a className="hover:text-primary mr-2" href={`/sites/${broker.slug}`}>Início</a> /
              <a className="hover:text-primary mx-2" href={`/sites/${broker.slug}/search`}>Imóveis</a> /
              <a className="hover:text-primary mx-2" href="#">Venda</a> /
              <span className="text-text-main font-medium ml-2">{informacoesbasicas.nome}</span>
            </nav>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-semibold uppercase text-text-main leading-tight">{informacoesbasicas.nome}</h1>
                <p className="text-text-muted flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {localizacao.bairro}, {localizacao.cidade} - {localizacao.estado}
                </p>
              </div>
              <div className="flex flex-col items-end">
                {informacoesbasicas.valor && (
                  <span className="text-3xl font-black text-primary drop-shadow-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(informacoesbasicas.valor)}
                  </span>
                )}
                <span className="text-sm text-text-muted font-medium">Condomínio: R$ 2.500/mês</span>
              </div>
            </div>
          </div>
        </div>
        <section className="w-full max-w-[1280px] px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
            <div onClick={() => openGallery(0)} className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${midia?.[0] || ''}")` }}></div>
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">photo_camera</span> Ver todas as fotos
              </div>
              <div className="absolute top-4 left-4 bg-primary text-black px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                Destaque
              </div>
            </div>
            <div onClick={() => openGallery(1)} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[1] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(2)} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[2] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(3)} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[3] || ''}")` }}></div>
            </div>
            <div onClick={() => openGallery(4)} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${midia?.[4] || ''}")` }}></div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-bold text-lg border border-white/50 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">+{midia.length > 5 ? midia.length - 5 : 0} Fotos</span>
              </div>
            </div>
          </div>
        </section>
        <div className="w-full max-w-[1280px] px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-primary text-3xl">square_foot</span>
                <span className="text-2xl font-black text-text-main">{caracteristicasimovel.tamanho}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Área Útil (m²)</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100 pl-6 w-full">
                <span className="material-symbols-outlined text-primary text-3xl">bed</span>
                <span className="text-2xl font-black text-text-main">{formatQuartos(caracteristicasimovel.quartos)}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Quartos</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100 pl-6 w-full">
                <span className="material-symbols-outlined text-primary text-3xl">shower</span>
                <span className="text-2xl font-black text-text-main">5</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Banheiros</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100 pl-6 w-full">
                <span className="material-symbols-outlined text-primary text-3xl">garage_home</span>
                <span className="text-2xl font-black text-text-main">{caracteristicasimovel.vagas}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Vagas</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main mb-4">Sobre o Imóvel</h2>
              <div className="prose text-text-muted max-w-none leading-relaxed">
                <p className="mb-4">{informacoesbasicas.descricao}</p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main mb-6">Características e Comodidades</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                {areascomuns?.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-text-muted">
                    <span className="material-symbols-outlined text-secondary">check_circle</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main mb-4">Localização</h2>
              <div className="rounded-2xl overflow-hidden h-80 w-full bg-gray-200 relative shadow-soft">
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
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">O que há por perto?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="material-symbols-outlined text-green-600 bg-green-100 p-2 rounded-full">park</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Parque Ibirapuera</p>
                      <p className="text-xs text-text-muted">1.2 km de distância</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="material-symbols-outlined text-blue-600 bg-blue-100 p-2 rounded-full">school</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Colégio Dante Alighieri</p>
                      <p className="text-xs text-text-muted">800 m de distância</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="material-symbols-outlined text-orange-600 bg-orange-100 p-2 rounded-full">restaurant</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Restaurante Fasano</p>
                      <p className="text-xs text-text-muted">500 m de distância</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="material-symbols-outlined text-purple-600 bg-purple-100 p-2 rounded-full">shopping_bag</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Shopping Iguatemi</p>
                      <p className="text-xs text-text-muted">2.5 km de distância</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-float p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-text-main mb-4">Quero mais informações</h3>
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
                   <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
                    <div className="flex flex-col gap-3">
                        <button disabled={isSubmitting} className="w-full h-12 rounded-lg bg-black text-primary font-bold hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-2 group" type="submit">
                           <span className="material-symbols-outlined">send</span>
                           {isSubmitting ? 'Enviando...' : 'Quero saber mais'}
                        </button>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 rounded-lg border-[#25D366] text-[#25D366] font-bold hover:bg-[#25D366] hover:text-white transition-colors flex items-center justify-center gap-2">
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
                  Ao enviar, você concorda com nossos <a className="underline hover:text-primary" href="#">Termos de Uso</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
        <section className="w-full max-w-[1280px] px-6 mt-20 mb-[35px]">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-main">Imóveis Semelhantes</h2>
            <p className="text-text-muted mt-2">Explore outras opções que também podem te agradar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map(similarProperty => {
                const isSaved = savedPropertyIds.includes(similarProperty.id);
                const quartos = similarProperty.caracteristicasimovel.quartos;
                return (
                  <Link href={`/sites/${broker.slug}/imovel/${similarProperty.informacoesbasicas.slug || similarProperty.id}`} key={similarProperty.id} className="group relative flex flex-col rounded-2xl bg-white border border-transparent shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <div className="absolute top-3 left-3 z-10 rounded-md bg-primary px-2 py-1 text-xs font-bold text-black uppercase tracking-wide shadow-sm">{similarProperty.informacoesbasicas.status}</div>
                        <button onClick={(e) => handleRadarClick(e, similarProperty.id)} className={cn("absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white transition-colors", isSaved && "text-red-500 bg-white")}>
                            <span className="material-symbols-outlined text-[20px]">favorite</span>
                        </button>
                        <Image alt={similarProperty.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={similarProperty.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                            {similarProperty.informacoesbasicas.valor && (
                            <p className="text-white font-bold text-2xl tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(similarProperty.informacoesbasicas.valor)}
                            </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                        <div>
                            <h3 className="text-lg font-semibold uppercase text-[#111418] group-hover:text-primary transition-colors line-clamp-1">{similarProperty.informacoesbasicas.nome}</h3>
                            <p className="text-sm text-[#617589] mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {similarProperty.localizacao.bairro}, {similarProperty.localizacao.cidade}
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-y border-gray-100 py-3 mt-1">
                            {similarProperty.caracteristicasimovel.quartos && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]">bed</span>
                                    <span className="text-sm font-semibold text-[#111418]">{formatQuartos(quartos)}</span>
                                </div>
                            )}
                            <div className="w-px h-4 bg-gray-200"></div>
                             {similarProperty.caracteristicasimovel.vagas && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]">shower</span>
                                    <span className="text-sm font-semibold text-[#111418]">{similarProperty.caracteristicasimovel.vagas}</span>
                                </div>
                             )}
                             <div className="w-px h-4 bg-gray-200"></div>
                            {similarProperty.caracteristicasimovel.tamanho && (
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[20px]">square_foot</span>
                                    <span className="text-sm font-semibold text-[#111418]">{similarProperty.caracteristicasimovel.tamanho}</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </Link>
                )
            })}
          </div>
        </section>
      </main>
      <UrbanPadraoFooter broker={broker} />

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
    </div>
  );
}

    
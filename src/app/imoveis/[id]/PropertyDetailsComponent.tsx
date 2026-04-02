'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

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

export default function PropertyDetailsComponent() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const router = useRouter();
  const { user } = useUser();

  const radarListDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'radarLists', user.uid) : null),
      [user, firestore]
  );
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];

  const extractMapSrc = (linkOrIframe: string | undefined): string | null => {
    if (!linkOrIframe) return null;
    const iframeMatch = linkOrIframe.match(/src="([^"]*)"/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    return null;
  };

  const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('/').pop()?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
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
          const qSim = query(collection(firestore, 'properties'), where('isVisibleOnSite', '==', true), where('localizacao.cidade', '==', propData.localizacao.cidade), limit(5));
          const simSnap = await getDocs(qSim);
          setSimilarProperties(simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Property)).filter(p => p.id !== propData?.id).slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [firestore, id]);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/radar'); return; }
    if (!firestore) return;
    const docRef = doc(firestore, 'radarLists', user.uid);
    if (savedPropertyIds.includes(propertyId)) {
        setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
        toast({ title: "Removido!", description: "Imóvel removido da sua lista." });
    } else {
        setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
        toast({ title: "Adicionado!", description: "Imóvel salvo na sua lista." });
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!property) return;
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: property.builderId || '',
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: property.informacoesbasicas.nome,
      message: data.message,
      source: 'Formulário de Contato Portal'
    });
    if (result.success) {
      toast({ title: 'Mensagem Enviada!', description: 'Retornaremos em breve.' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSubmitting(false);
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center py-20">Carregando detalhes do imóvel...</div>;
  if (!property) return notFound();

  const videoEmbedUrl = getYoutubeEmbedUrl(property.youtubeVideoUrl);
  const mapSrc = extractMapSrc(property.localizacao.googleMapsLink);
  const streetViewSrc = extractMapSrc(property.localizacao.googleStreetViewLink);
  const isSaved = savedPropertyIds.includes(property.id);

  return (
    <>
      <main className="pt-0 w-full pb-20">
        <section className="w-full max-w-[1280px] mx-auto px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[500px]">
            <div onClick={() => openGallery(0)} className="col-span-1 md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft aspect-[4/3] md:aspect-auto">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${property.midia?.[0] || ''}")` }}></div>
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">photo_camera</span> Ver fotos
              </div>
            </div>
            {property.midia.slice(1, 5).map((img, idx) => (
              <div key={idx} onClick={() => openGallery(idx + 1)} className="hidden md:block relative rounded-2xl overflow-hidden group cursor-pointer shadow-soft">
                <Image alt="img" src={img} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div className="border-b border-gray-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-dark-text mb-2 uppercase">{property.informacoesbasicas.nome}</h1>
                    <p className="text-gray-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                      {property.localizacao.bairro}, {property.localizacao.cidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {property.informacoesbasicas.valor && (
                      <p className="text-3xl font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.informacoesbasicas.valor)}
                      </p>
                    )}
                    <Button onClick={(e) => handleRadarClick(e, property.id)} variant="outline" size="icon" className={cn("size-12 rounded-xl border-2", isSaved ? "border-primary bg-primary/10 text-primary" : "text-black")}>
                      <span className="material-symbols-outlined">radar</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50">{formatQuartos(property.caracteristicasimovel.quartos)} Quartos</Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50">{property.caracteristicasimovel.vagas} Vagas</Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-gray-50">{property.caracteristicasimovel.tamanho} úteis</Badge>
                </div>
              </div>

              <div className="prose text-gray-600 max-w-none leading-relaxed">
                <h2 className="text-2xl font-bold mb-4 text-dark-text">Sobre o imóvel</h2>
                <div dangerouslySetInnerHTML={{ __html: property.informacoesbasicas.descricao || '' }} />
              </div>

              {videoEmbedUrl && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-gray-200">
                  <iframe src={videoEmbedUrl} className="w-full h-full" allowFullScreen></iframe>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold mb-6 text-dark-text">Diferenciais</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {property.areascomuns?.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-gray-600">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6 text-dark-text">Localização</h2>
                <Tabs defaultValue="map" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="map">Mapa</TabsTrigger>
                    <TabsTrigger value="streetview">Street View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="map" className="mt-4">
                    <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden mt-4">
                      {mapSrc ? <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }}></iframe> : <div className="flex items-center justify-center h-full">Mapa não disponível</div>}
                    </div>
                  </TabsContent>
                  <TabsContent value="streetview" className="mt-4">
                    <div className="bg-gray-100 rounded-xl h-[400px] w-full overflow-hidden mt-4">
                      {streetViewSrc ? <iframe src={streetViewSrc} width="100%" height="100%" style={{ border: 0 }}></iframe> : <div className="flex items-center justify-center h-full">Street View não disponível</div>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl shadow-float p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Tenho interesse</h3>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <Input {...form.register('name')} placeholder="Seu nome" />
                  <Input {...form.register('email')} placeholder="Seu e-mail" />
                  <Input {...form.register('phone')} placeholder="Seu telefone" />
                  <Textarea {...form.register('message')} placeholder="Mensagem" className="h-32" />
                  <Button disabled={isSubmitting} type="submit" className="w-full h-12 bg-black hover:bg-gray-900 font-bold text-white">
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-text">Imóveis Semelhantes</h2>
            <p className="text-gray-500 mt-2">Explore outras opções na região.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map(sim => {
                const isSaved = savedPropertyIds.includes(sim.id);
                const quartos = sim.caracteristicasimovel.quartos;
                return (
                  <Link key={sim.id} href={`/imoveis/${sim.informacoesbasicas.slug || sim.id}`} className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg border border-transparent hover:border-primary/20">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <div className="absolute top-3 left-3 z-10 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                            {sim.informacoesbasicas.status}
                        </div>
                        <button onClick={(e) => handleRadarClick(e, sim.id)} className={cn("absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors group/radar", isSaved ? "text-primary bg-white" : "hover:text-primary")}>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "" }}>radar</span>
                        </button>
                        <Image alt={sim.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={sim.midia[0] || "https://picsum.photos/400/300"} width={400} height={300} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 text-white">
                            {sim.informacoesbasicas.valor && (
                            <p className="font-bold text-lg leading-tight"><span className="text-[10px] font-normal text-gray-300 block mb-0.5">A partir de:</span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sim.informacoesbasicas.valor)}</p>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-sm uppercase text-dark-text group-hover:text-primary transition-colors truncate">{sim.informacoesbasicas.nome}</h3>
                        <p className="text-[11px] text-gray-500 mt-1">{sim.localizacao.bairro}, {sim.localizacao.cidade}</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-600 font-medium">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">bed</span> {formatQuartos(quartos)}</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">square_foot</span> {sim.caracteristicasimovel.tamanho}</span>
                        </div>
                    </div>
                  </Link>
                )
            })}
          </div>
        </section>
      </main>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white border-b border-white/10">
            <span className="font-bold">{selectedImageIndex + 1} / {property.midia.length}</span>
            <button onClick={closeGallery} className="size-10 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <button onClick={() => setSelectedImageIndex(p => (p - 1 + property.midia.length) % property.midia.length)} className="absolute left-4 p-4 text-white hover:text-primary"><span className="material-symbols-outlined text-4xl">chevron_left</span></button>
            <div className="relative max-h-full max-w-full">
              <img alt="Gallery" className="max-h-[80vh] w-auto object-contain" src={property.midia[selectedImageIndex]} />
            </div>
            <button onClick={() => setSelectedImageIndex(p => (p + 1) % property.midia.length)} className="absolute right-4 p-4 text-white hover:text-primary"><span className="material-symbols-outlined text-4xl">chevron_right</span></button>
          </div>
        </div>
      )}
    </>
  );
}

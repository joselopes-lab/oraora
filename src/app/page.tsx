'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, doc, arrayRemove, arrayUnion, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuthContext, useAuth } from '@/firebase';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { fetchPublishedProperties } from '@/app/sites/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createLead } from '@/app/sites/actions';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
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
    defaultValues: { email: '' },
  });

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false);
    router.push(`/imoveis?${queryString}`);
  };

  async function onNewsletterSubmit(values: z.infer<typeof newsletterSchema>) {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: 'oraora-main-site',
      name: `Lead Newsletter`,
      email: values.email,
      source: 'home',
    });
    if (result.success) {
      toast({ title: 'Inscrição realizada!', description: 'Você foi adicionado à nossa newsletter.' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSubmitting(false);
  }

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => { router.push('/'); });
    }
  };

  const radarListDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'radarLists', user.uid) : null),
    [user, firestore]
  );
  const { data: radarList } = useDoc<RadarList>(radarListDocRef);
  const savedPropertyIds = radarList?.propertyIds || [];

  const handleRadarClick = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { router.push('/radar'); return; }
    if (!firestore) return;
    const docRef = doc(firestore, 'radarLists', user.uid);
    if (savedPropertyIds.includes(propertyId)) {
      setDocumentNonBlocking(docRef, { propertyIds: arrayRemove(propertyId) }, { merge: true });
      toast({ title: "Removido!", description: "Imóvel removido da sua lista." });
    } else {
      setDocumentNonBlocking(docRef, { userId: user.uid, propertyIds: arrayUnion(propertyId) }, { merge: true });
      toast({ title: "Salvo!", description: "Imóvel adicionado ao Radar." });
    }
  };

  useEffect(() => {
    async function fetchProperties() {
      if (!firestore) return;
      try {
        const props = await fetchPublishedProperties(firestore);
        setAllProperties(props as Property[]);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }
    const setAllProperties = (props: Property[]) => {
      setProperties(props);
      const shuffled = [...props].sort(() => 0.5 - Math.random());
      setFeaturedProperties(shuffled.slice(0, 6));
    }
    fetchProperties();
  }, [firestore]);

  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';

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

  const renderPrice = (property: Property) => {
    const types = property.informacoesbasicas.transactionTypes || ['sale'];
    const salePrice = property.informacoesbasicas.salePrice || property.informacoesbasicas.valor;
    const rentPrice = property.informacoesbasicas.rentPrice;
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);

    if (types.includes('sale') && types.includes('rent')) {
      return (
        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">A PARTIR DE:</span>
          <p className="text-slate-900 font-bold text-xl leading-tight">{fmt(salePrice || 0)}</p>
          <p className="text-primary font-bold text-sm mt-1">{fmt(rentPrice || 0)}/mês</p>
        </div>
      );
    }
    if (types.includes('rent')) {
      return (
        <div className="flex flex-col items-start mt-1 text-left">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ALUGUEL:</span>
          <p className="font-bold text-xl text-primary leading-tight">{fmt(rentPrice || 0)}/mês</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start mt-1 text-left">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">A PARTIR DE:</span>
        <p className="font-bold text-xl text-slate-900 leading-tight">{fmt(salePrice || 0)}</p>
      </div>
    );
  };

  const renderBadge = (property: Property) => {
    const types = property.informacoesbasicas.transactionTypes || ['sale'];
    if (types.includes('sale') && types.includes('rent')) return "Venda + Aluguel";
    if (types.includes('rent')) return "Para Aluguel";
    return "À Venda";
  };

  const defaultContent = {
    heroTagline: 'Encontre seu novo lar',
    heroTitle: 'Descubra o imóvel perfeito para <br /> <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#5fab14]">viver seus sonhos.</span>',
    heroSubtitle: 'Navegue por milhares de anúncios, encontre o que mais combina com você e agende uma visita online. Simples, rápido e seguro.',
    featuredTagline: 'Exclusividade',
    featuredTitle: 'Imóveis em Destaque',
    featuredSubtitle: 'Curadoria exclusiva para você.',
    featuresTitle: 'Por que o Oraora é <span class="text-primary">diferente?</span>',
    featuresSubtitle: 'Combinamos inteligência de dados com atendimento humano para que você faça o melhor negócio da sua vida.',
    featuresItem1: 'Busca Inteligente',
    featuresItem2: 'Dossiê do Imóvel',
    featuresItem3: 'Assessoria Especializada',
    featuresButtonText: 'Saiba mais sobre nós',
    featuresCard1Icon: 'search',
    featuresCard1Title: 'Filtros Avançados',
    featuresCard1Description: 'Encontre exatamente o que procura filtrando por bairro, metragem e perfil.',
    featuresCard2Icon: 'rocket_launch',
    featuresCard2Title: 'Rapidez no Fechamento',
    featuresCard2Description: 'Processos digitalizados que aceleram a aprovação de crédito e documentação.',
    featuresCard3Icon: 'handshake',
    featuresCard3Title: 'Parceria de Confiança',
    featuresCard3Description: 'Conectamos você aos corretores mais bem avaliados de cada região.',
    featuresCard4Icon: 'support_agent',
    featuresCard4Title: 'Suporte Completo',
    featuresCard4Description: 'Nossa equipe acompanha você do primeiro clique até a entrega das chaves.',
    ctaTitle: 'Pronto para encontrar seu lugar?',
    ctaSubtitle: 'Cadastre-se para receber alertas de novos imóveis que correspondem ao seu perfil.',
  };
  
  const finalContent = { ...defaultContent, ...siteData?.homepage };

  const availableStates = useMemo(() => {
    return Array.from(new Set(properties.map(p => p.localizacao.estado))).filter(Boolean);
  }, [properties]);

  return (
    <div className="bg-background-light overflow-x-hidden w-full">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
          <div className="flex items-center">
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="flex size-10 items-center justify-center text-text-main"><span className="material-symbols-outlined">menu</span></button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col bg-white">
                  <SheetHeader><VisuallyHidden><SheetTitle>Menu</SheetTitle><SheetDescription>Navegação</SheetDescription></VisuallyHidden></SheetHeader>
                  <div className="p-6 border-b">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                      <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                    </Link>
                  </div>
                  <nav className="flex flex-col gap-2 p-4 text-lg font-semibold text-left">
                    <Link href="/imoveis" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">real_estate_agent</span> Imóveis</Link>
                    <Link href="/corretor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">real_estate_agent</span>Para Corretores</Link>
                    <Link href="/sobre" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">info</span>Sobre</Link>
                    <Link href="/contato" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">mail</span>Contato</Link>
                  </nav>
                  <div className="mt-auto p-6 space-y-4 border-t text-left">
                    {user ? (
                      <>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarImage src={user.photoURL || ''} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left"><p className="text-sm font-bold text-foreground">{user.displayName}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                        </div>
                        <Button asChild className="w-full h-12 text-base"><Link href={dashboardUrl}>Acessar Painel</Link></Button>
                        <Button variant="outline" className="w-full h-12 text-base" onClick={handleLogout}>Sair</Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline" className="w-full h-12 text-base"><Link href="/radar"><span className="material-symbols-outlined text-base mr-2">radar</span> Meu Radar</Link></Button>
                        <Button asChild className="w-full h-12 text-base"><Link href="/login">Sou Corretor</Link></Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <Link className="hidden lg:flex items-center gap-3" href="/">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-10 w-auto" style={{ width: 'auto' }} />
            </Link>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link className="flex items-center gap-3 lg:hidden" href="/">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-10 w-auto" style={{ width: 'auto' }} />
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
              {!isReady ? <Skeleton className="h-10 w-32 rounded-full" /> : user ? (
                <Button asChild><Link href={dashboardUrl}>Painel</Link></Button>
              ) : (
                <div className="flex gap-3">
                  <Button asChild variant="ghost" className="rounded-full px-6"><Link href="/login">Corretor</Link></Button>
                  <Button asChild className="rounded-full px-6 shadow-glow"><Link href="/radar">Meu Radar</Link></Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-grid -z-10 h-full w-full"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-800 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                {finalContent.heroTagline}
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-dark-text max-w-4xl" dangerouslySetInnerHTML={{ __html: finalContent.heroTitle }} />
              <div className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mt-6">{finalContent.heroSubtitle}</div>
            </div>
            <div className="max-w-5xl mx-auto relative z-10">
              <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
                <SearchFilters variant="urban" onSearch={handleSearch} availableStates={availableStates} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-16 lg:py-24 bg-surface text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div className="max-w-xl text-left">
                <span className="text-secondary font-bold tracking-wider uppercase text-xs mb-2 block">{finalContent.featuredTagline}</span>
                <h2 className="font-display text-3xl font-bold text-dark-text">{finalContent.featuredTitle}</h2>
                <p className="mt-3 text-gray-600">{finalContent.featuredSubtitle}</p>
              </div>
              <Link href="/imoveis" className="inline-block bg-white border border-gray-200 text-dark-text font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                Ver todos os imóveis
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-2xl w-full" />)
              ) : featuredProperties.map((property) => {
                const isSaved = savedPropertyIds.includes(property.id);
                return (
                  <Link key={property.id} href={`/imoveis/${property.informacoesbasicas.slug || property.id}`} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col text-left">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                         <Badge className="bg-white/90 backdrop-blur-sm text-black border-none font-black text-[9px] uppercase px-3 py-1 shadow-sm tracking-widest">
                           {renderBadge(property)}
                         </Badge>
                      </div>
                      <button onClick={(e) => handleRadarClick(e, property.id)} className={cn("absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white transition-colors group/radar shadow-sm", isSaved && "text-primary bg-white")}>
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "" }}>radar</span>
                      </button>
                      <Image alt={property.informacoesbasicas.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={property.midia?.[0] || property.media?.[0] || "https://picsum.photos/seed/prop/400/300"} width={400} height={300} />
                    </div>
                    <div className="p-6 flex flex-col flex-1 text-left">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors truncate mb-1 uppercase tracking-tight">{property.informacoesbasicas.nome}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-4 font-medium text-left">
                         <span className="material-symbols-outlined text-primary text-base">location_on</span> {property.localizacao.bairro}, {property.localizacao.cidade}
                      </p>
                      <div className="mb-4 text-left">
                          {renderPrice(property)}
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-left"><span className="material-symbols-outlined text-primary text-base">bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                          <span className="flex items-center gap-1.5 text-left"><span className="material-symbols-outlined text-primary text-base">square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white overflow-hidden text-left">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2 text-left">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-8" dangerouslySetInnerHTML={{ __html: finalContent.featuresTitle }} />
                <p className="text-slate-500 text-lg mb-10 leading-relaxed">{finalContent.featuresSubtitle}</p>
                <div className="space-y-6 mb-10">
                  {[finalContent.featuresItem1, finalContent.featuresItem2, finalContent.featuresItem3].filter(Boolean).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-hover">
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      </div>
                      <span className="text-slate-700 font-bold">{item}</span>
                    </div>
                  ))}
                </div>
                <Button asChild className="h-14 px-8 rounded-xl font-bold bg-slate-900 text-white hover:bg-black transition-all shadow-xl">
                  <Link href="/sobre">{finalContent.featuresButtonText}</Link>
                </Button>
              </div>
              <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: finalContent.featuresCard1Icon, title: finalContent.featuresCard1Title, desc: finalContent.featuresCard1Description },
                  { icon: finalContent.featuresCard2Icon, title: finalContent.featuresCard2Title, desc: finalContent.featuresCard2Description },
                  { icon: finalContent.featuresCard3Icon, title: finalContent.featuresCard3Title, desc: finalContent.featuresCard3Description },
                  { icon: finalContent.featuresCard4Icon, title: finalContent.featuresCard4Title, desc: finalContent.featuresCard4Description }
                ].map((card, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/40 transition-all group text-left">
                    <span className="material-symbols-outlined text-primary text-3xl mb-4 group-hover:scale-110 transition-transform block">{card.icon}</span>
                    <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-black text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[150px] opacity-10"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-8">{finalContent.ctaTitle}</h2>
            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">{finalContent.ctaSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-primary hover:bg-primary-hover text-dark-text font-bold py-7 px-10 rounded-xl text-lg transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(140,249,31,0.4)] border-none">
                <Link href="/radar">Ativar Meu Radar</Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-medium py-7 px-10 rounded-xl text-lg transition-colors backdrop-blur-sm">
                <Link href="/contato">Falar com Especialista</Link>
              </Button>
            </div>
          </div>
        </section>
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
                    <div className="flex gap-4">
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">camera_alt</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
                    </div>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link className="hover:text-primary transition-colors" href="/imoveis?finality=sale">Comprar</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="/imoveis?status=Lançamento">Lançamentos</Link></li>
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
                <p className="text-sm text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                <div className="flex items-center gap-4 text-left">
                     <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-9 rounded-full px-4">
                        <Link href="/login" className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-base">manage_accounts</span>
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

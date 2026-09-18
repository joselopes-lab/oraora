'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getProjectDetailServer } from '../../actions.server';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Maximize2, 
  FileDown, 
  ChevronLeft,
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  Layers, 
  ArrowLeft,
  Phone,
  MessageSquare,
  Building,
  Maximize,
  Minimize,
  Utensils,
  ShoppingBag,
  GraduationCap,
  ShoppingCart,
  HeartPulse,
  Pill,
  Dumbbell,
  Trees,
  Bus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurantes', icon: Utensils, queryType: 'restaurant' },
  { id: 'shopping_mall', label: 'Shopping', icon: ShoppingBag, queryType: 'shopping_mall' },
  { id: 'school', label: 'Escolas', icon: GraduationCap, queryType: 'school' },
  { id: 'supermarket', label: 'Supermercados', icon: ShoppingCart, queryType: 'supermarket' },
  { id: 'hospital', label: 'Hospitais', icon: HeartPulse, queryType: 'hospital' },
  { id: 'pharmacy', label: 'Farmácias', icon: Pill, queryType: 'pharmacy' },
  { id: 'gym', label: 'Academias', icon: Dumbbell, queryType: 'gym' },
  { id: 'park', label: 'Parques', icon: Trees, queryType: 'park' },
  { id: 'transit_station', label: 'Transporte', icon: Bus, queryType: 'transit_station' },
];

export default function ProjectPresentationClient() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Slides navigation state & direction
  const [[currentSlide, direction], setPage] = useState([0, 0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    function handleMouseMove() {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        let idToken = undefined;
        try {
          if (user) {
            idToken = await user.getIdToken();
          }
        } catch (e) {
          // ignore
        }
        const res = await getProjectDetailServer(id, idToken);
        setProject(res.project);
        setUnits(res.units || []);
      } catch (err: any) {
        console.error('Erro ao carregar apresentação:', err);
        setError(err.message || 'Erro ao carregar apresentação do empreendimento.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [user, isUserLoading, id, router]);

  // Define slides dynamically based on available data
  const slides = [];

  // Slide 1: Capa cinematográfica
  slides.push({ id: 'capa', title: 'Capa' });

  // Slide 2: Conceito
  if (project?.descricaoCompleta || project?.descricaoCurta) {
    slides.push({ id: 'conceito', title: 'Conceito' });
  }

  // Slide 3: Localização & Conveniência
  slides.push({ id: 'conveniencia', title: 'Localização & Conveniência' });

  // Slide 4: Ficha Técnica
  if (project?.numTorres || project?.numUnidades || project?.numPavimentos || project?.areaTerreno) {
    slides.push({ id: 'ficha', title: 'Ficha Técnica' });
  }

  // Slide 5: Diferenciais
  if (project?.diferenciaisEspecificos || (project?.caracteristicasGerais && project.caracteristicasGerais.length > 0)) {
    slides.push({ id: 'diferenciais', title: 'Diferenciais' });
  }

  // Slide 6: Lazer
  if (project?.lazerItens && project.lazerItens.length > 0) {
    slides.push({ id: 'lazer', title: 'Lazer' });
  }

  // Slide 7: Galeria de Mídias
  const mediaList = project?.midia && project.midia.length > 0 ? project.midia : [];
  if (mediaList.length > 0) {
    slides.push({ id: 'galeria', title: 'Galeria' });
  }

  // Slide 8: Tipologias e Unidades
  if ((project?.tipologias && project.tipologias.length > 0) || units.length > 0) {
    slides.push({ id: 'tipologias', title: 'Tipologias & Unidades' });
  }

  // Slide 9: Materiais e Downloads
  if (project?.materiais && project.materiais.length > 0) {
    slides.push({ id: 'materiais', title: 'Materiais' });
  }

  // Slide 10: Encerramento
  slides.push({ id: 'encerramento', title: 'Contato' });

  const totalSlides = slides.length;

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevSlide]) => {
      const next = prevSlide + newDirection;
      if (next < 0 || next >= totalSlides) return [prevSlide, 0];
      return [next, newDirection];
    });
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setPage(([prevSlide]) => {
      if (index < 0 || index >= totalSlides || index === prevSlide) return [prevSlide, 0];
      const dir = index > prevSlide ? 1 : -1;
      return [index, dir];
    });
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        paginate(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        paginate(-1);
      } else if (e.key === 'Escape') {
        if (fullscreenImage) setFullscreenImage(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate, fullscreenImage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">Carregando apresentação executiva...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-950/50 text-red-400 flex items-center justify-center border border-red-800">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-semibold">Empreendimento Indisponível</h2>
        <p className="text-sm text-slate-400 max-w-md">{error || 'Não foi possível carregar os dados deste empreendimento.'}</p>
        <Button onClick={() => router.back()} variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
          Voltar
        </Button>
      </div>
    );
  }

  const mainImage = mediaList[activeImageIndex] || mediaList[0] || 'https://picsum.photos/seed/realestate/1600/1000';
  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const activeSlideData = slides[currentSlide] || slides[0];

  // Framer Motion slide variants (full-screen fluid transition)
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.6 },
        opacity: { duration: 0.4 },
      },
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.6 },
        opacity: { duration: 0.4 },
      },
    }),
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      
      {/* Floating Minimalist Header (Disappears on inactivity) */}
      <motion.header 
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 h-20 px-8 lg:px-16 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-40 pointer-events-auto"
      >
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push(`/dashboard/construtoras/empreendimentos/${id}`)}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Sair da Apresentação
          </button>
          <h1 className="text-sm font-semibold tracking-wide text-slate-200 hidden md:block uppercase tracking-widest">
            {project.name}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-amber-400 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800/80">
            {currentSlide + 1} / {totalSlides} — {activeSlideData.title}
          </span>
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all hidden sm:flex"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </motion.header>

      {/* Main Full-Viewport Slide Stage */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-slate-950">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
          >
            
            {/* SLIDE 1: CAPA CINEMATOGRÁFICA */}
            {activeSlideData.id === 'capa' && (
              <div className="relative w-full h-full flex items-end p-8 sm:p-16 lg:p-24 overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <motion.img 
                    initial={{ scale: 1.02 }}
                    animate={{ scale: 1.10 }}
                    transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    src={mainImage} 
                    alt={project.name} 
                    className="w-full h-full object-cover filter brightness-[0.55]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 max-w-5xl space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500 text-slate-950 font-bold px-3.5 py-1 text-xs uppercase tracking-wider">
                      {project.status || 'Lançamento'}
                    </Badge>
                    {project.localizacao && (
                      <span className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {project.localizacao.cidade} - {project.localizacao.estado}
                      </span>
                    )}
                  </div>

                  <motion.h2 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05]"
                  >
                    {project.tituloComercial || project.name}
                  </motion.h2>

                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl sm:text-2xl text-slate-300 max-w-2xl font-light leading-relaxed"
                  >
                    {project.subtituloComercial || project.descricaoCurta || 'Exclusividade e alto padrão em cada detalhe.'}
                  </motion.p>

                  {project.precoInicial && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="pt-4 flex items-center gap-4"
                    >
                      <div className="px-6 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800">
                        <span className="block text-xs uppercase tracking-widest text-slate-400">Valores a partir de</span>
                        <span className="text-3xl font-bold text-amber-400">{formatCurrency(project.precoInicial)}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* SLIDE 2: CONCEITO */}
            {activeSlideData.id === 'conceito' && (
              <div className="relative w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-7 p-12 lg:p-24 space-y-8 flex flex-col justify-center h-full bg-slate-950">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Conceito e Propósito</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
                    Projetado para superar expectativas
                  </h3>
                  <p className="text-slate-300 text-lg sm:text-2xl font-light leading-relaxed whitespace-pre-line">
                    {project.descricaoCompleta || project.descricaoCurta}
                  </p>
                </div>
                <div className="lg:col-span-5 h-full relative overflow-hidden hidden lg:block">
                  <img src={mainImage} alt="Conceito" className="w-full h-full object-cover filter brightness-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
                </div>
              </div>
            )}

            {/* SLIDE 3: LOCALIZAÇÃO & CONVENIÊNCIA */}
            {activeSlideData.id === 'conveniencia' && (
              <div className="relative w-full h-full flex flex-col pt-24 pb-8 px-6 lg:px-16 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
                  <div>
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Localização & Conveniência</span>
                    <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                      {project?.localizacao?.bairro || 'Localização Oficial'}, {project?.localizacao?.cidade || project?.name || 'Empreendimento'}
                    </h3>
                  </div>

                  {/* Category Toggles Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      const isActive = activeCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border ${
                            isActive 
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map & Results Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                  <div className="lg:col-span-9 h-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 relative shadow-2xl">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <div ref={mapRef} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/80">
                        <MapPin className="w-12 h-12 text-amber-500 mb-3" />
                        <h4 className="text-lg font-bold text-white">
                          {project?.localizacao?.address || project?.localizacao?.bairro || 'Endereço Principal'}
                        </h4>
                        <p className="text-sm text-slate-400 max-w-md mt-1">
                          Google Maps API key não configurada. A localização oficial e o entorno estão garantidos.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* POI Sidebar / Drawer */}
                  <div className="lg:col-span-3 h-full rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 flex flex-col overflow-hidden">
                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">
                      Pontos Próximos ({pois.length})
                    </h4>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {pois.length === 0 ? (
                        <div className="text-center py-12 text-sm text-slate-500">
                          Selecione categorias acima para explorar a conveniência do entorno.
                        </div>
                      ) : (
                        pois.map((poi, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedPoi(poi)}
                            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 transition-all cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-400 uppercase">{poi.category}</span>
                              {poi.rating && <span className="text-xs text-slate-400">★ {poi.rating}</span>}
                            </div>
                            <h5 className="font-semibold text-sm text-white line-clamp-1">{poi.name}</h5>
                            <span className="text-xs text-slate-400 block line-clamp-1">{poi.address}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: FICHA TÉCNICA */}
            {activeSlideData.id === 'ficha' && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-16 max-w-6xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Especificações</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Ficha Técnica do Projeto</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {project.numTorres && (
                    <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 backdrop-blur-md shadow-xl">
                      <Building className="w-10 h-10 text-amber-500 mx-auto" />
                      <span className="block text-4xl font-bold text-white">{project.numTorres}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-widest">Torres</span>
                    </div>
                  )}
                  {project.numUnidades && (
                    <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 backdrop-blur-md shadow-xl">
                      <Building2 className="w-10 h-10 text-amber-500 mx-auto" />
                      <span className="block text-4xl font-bold text-white">{project.numUnidades}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-widest">Unidades</span>
                    </div>
                  )}
                  {project.numPavimentos && (
                    <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 backdrop-blur-md shadow-xl">
                      <Layers className="w-10 h-10 text-amber-500 mx-auto" />
                      <span className="block text-4xl font-bold text-white">{project.numPavimentos}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-widest">Pavimentos</span>
                    </div>
                  )}
                  {project.areaTerreno && (
                    <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 backdrop-blur-md shadow-xl">
                      <Maximize2 className="w-10 h-10 text-amber-500 mx-auto" />
                      <span className="block text-4xl font-bold text-white">{project.areaTerreno} m²</span>
                      <span className="text-xs text-slate-400 uppercase tracking-widest">Área do Terreno</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SLIDE 5: DIFERENCIAIS */}
            {activeSlideData.id === 'diferenciais' && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-12 max-w-6xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Diferenciais</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Arquitetura e Acabamento</h3>
                </div>
                {project.diferenciaisEspecificos && (
                  <p className="text-slate-200 text-center italic text-xl max-w-3xl mx-auto font-light leading-relaxed">
                    "{project.diferenciaisEspecificos}"
                  </p>
                )}
                {project.caracteristicasGerais && project.caracteristicasGerais.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                    {project.caracteristicasGerais.map((item: string, idx: number) => (
                      <div key={idx} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                        <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                        <span className="text-base font-medium text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 6: LAZER */}
            {activeSlideData.id === 'lazer' && project?.lazerItens && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-12 max-w-6xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Lazer & Convivência</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Clube Privativo Completo</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {project.lazerItens.map((item: string, idx: number) => (
                    <div key={idx} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-base font-medium text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 7: GALERIA */}
            {activeSlideData.id === 'galeria' && mediaList.length > 0 && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-8 max-w-6xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Galeria Visual</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Perspectivas Exclusivas</h3>
                </div>
                <div className="w-full aspect-[16/9] max-h-[550px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 relative shadow-2xl">
                  <img src={mainImage} alt="Galeria" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFullscreenImage(mainImage)}
                    className="absolute bottom-6 right-6 px-6 py-3 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-sm font-medium flex items-center gap-2 hover:bg-slate-900 transition-all"
                  >
                    <Maximize2 className="w-4 h-4" /> Ampliar Imagem
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 8: TIPOLOGIAS E UNIDADES */}
            {activeSlideData.id === 'tipologias' && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-12 max-w-6xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Tipologias & Unidades</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Plantas e Disponibilidade</h3>
                </div>
                {project.tipologias && (
                  <div className="flex flex-wrap justify-center gap-6">
                    {project.tipologias.map((tipo: string, idx: number) => (
                      <div key={idx} className="px-8 py-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center shadow-xl">
                        <span className="text-2xl font-bold text-white">{tipo}</span>
                      </div>
                    ))}
                  </div>
                )}
                {units.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    {units.slice(0, 3).map((u: any) => (
                      <div key={u.id} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="block font-bold text-lg text-white">Unidade {u.number || u.unitNumber}</span>
                          <span className="text-sm text-slate-400">{u.typology || 'Padrão'}</span>
                        </div>
                        <span className="font-bold text-xl text-amber-400">{formatCurrency(u.price || u.preco)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 9: MATERIAIS */}
            {activeSlideData.id === 'materiais' && project?.materiais && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-12 max-w-5xl mx-auto">
                <div className="text-center space-y-3">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Documentação</span>
                  <h3 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">Materiais e Downloads</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {project.materiais.map((mat: any) => (
                    <a 
                      key={mat.id}
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group shadow-xl"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <FileDown className="w-7 h-7" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">{mat.name}</h5>
                          <span className="text-xs text-slate-400 uppercase tracking-widest">{mat.category || 'Documento'}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 10: ENCERRAMENTO */}
            {activeSlideData.id === 'encerramento' && (
              <div className="relative w-full h-full flex flex-col justify-center p-8 sm:p-16 lg:p-24 space-y-10 max-w-4xl mx-auto text-center">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Próximos Passos</span>
                <h3 className="text-5xl sm:text-7xl font-bold text-white tracking-tight leading-tight">
                  Garanta sua unidade no {project.name}
                </h3>
                <p className="text-slate-300 text-xl font-light leading-relaxed max-w-2xl mx-auto">
                  Entre em contato com nossa equipe comercial para agendar uma visita e conhecer as condições exclusivas de lançamento.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-10 py-7 text-lg shadow-2xl shadow-amber-500/20">
                    <Phone className="w-5 h-5 mr-3" /> Falar com Especialista
                  </Button>
                  <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-900 px-10 py-7 text-lg">
                    <MessageSquare className="w-5 h-5 mr-3" /> Atendimento via WhatsApp
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Minimalist Footer Controls (Disappears on inactivity) */}
      <motion.footer 
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 h-24 px-8 lg:px-16 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-40 pointer-events-auto"
      >
        <Button 
          variant="outline" 
          onClick={() => paginate(-1)}
          disabled={currentSlide === 0}
          className="border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 px-6 py-6 rounded-2xl"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Anterior
        </Button>

        {/* Slide Indicators */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/60 backdrop-blur-md px-5 py-3 rounded-full border border-slate-800/80">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'w-10 bg-amber-500' : 'w-2.5 bg-slate-700 hover:bg-slate-600'}`}
              title={s.title}
            />
          ))}
        </div>

        <Button 
          onClick={() => paginate(1)}
          disabled={currentSlide === totalSlides - 1}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold disabled:opacity-30 px-6 py-6 rounded-2xl shadow-lg shadow-amber-500/10"
        >
          Próximo <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.footer>

      {/* Lightbox Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
          >
            ✕ Fechar
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

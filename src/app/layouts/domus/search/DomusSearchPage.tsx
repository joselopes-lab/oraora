'use client';
/**
 * @fileOverview Página de Catálogo de Imóveis exclusiva para o template Domus.
 */

import Image from 'next/image';
import Link from 'next/link';
import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
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
  layoutId?: string;
  homepage?: {
    cardTitleColor?: string;
    cardValueColor?: string;
    cardIconColor?: string;
    statusTagBgColor?: string;
    statusTagTextColor?: string;
    searchButtonBgColor?: string;
    searchButtonTextColor?: string;
    ctaButtonBgColor?: string;
    ctaButtonTextColor?: string;
    ctaButtonText?: string;
    ctaButtonIcon?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaSectionBgColor?: string;
    ctaSectionTitleColor?: string;
    ctaSectionSubtitleColor?: string;
    ctaSectionButtonBgColor?: string;
    ctaSectionButtonTextColor?: string;
  }
  whatsappUrl?: string;
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
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

type DomusSearchPageProps = {
  broker: Broker;
  properties: Property[];
}

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function DomusSearchPage({ broker, properties }: DomusSearchPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filtros da URL
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '5000000');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recent');

    const filteredProperties = useMemo(() => {
        return properties.filter(property => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = q === "" || 
                property.informacoesbasicas.nome.toLowerCase().includes(q) ||
                property.localizacao.bairro.toLowerCase().includes(q) ||
                property.localizacao.cidade.toLowerCase().includes(q);

            const matchesType = filterType === "all" || property.caracteristicasimovel.tipo === filterType;
            
            const price = property.informacoesbasicas.valor || 0;
            const matchesPrice = price <= parseInt(maxPrice);

            return matchesSearch && matchesType && matchesPrice;
        });
    }, [properties, searchQuery, filterType, maxPrice]);

    const sortedProperties = useMemo(() => {
        let temp = [...filteredProperties];
        if (sortBy === 'price_asc') {
            temp.sort((a, b) => (a.informacoesbasicas.valor || 0) - (b.informacoesbasicas.valor || 0));
        } else if (sortBy === 'price_desc') {
            temp.sort((a, b) => (b.informacoesbasicas.valor || 0) - (a.informacoesbasicas.valor || 0));
        }
        return temp;
    }, [filteredProperties, sortBy]);

    const itemsPerPage = 9;
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
    const paginatedProperties = sortedProperties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', searchQuery);
        params.set('type', filterType);
        params.set('maxPrice', maxPrice);
        params.set('finality', 'venda');
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setFilterType("all");
        setMaxPrice("5000000");
        router.push(pathname);
    };

    const formatQuartos = (quartosData: any): string => {
        if (!quartosData) return 'N/A';
        if (Array.isArray(quartosData)) return quartosData.join(', ');
        return String(quartosData);
    };

    const content = broker.homepage || {};

    const dynamicStyles = {
        '--background': broker.backgroundColor || '90 20% 97%',
        '--foreground': broker.foregroundColor || '110 16% 8%',
        '--primary': broker.primaryColor || '80 99% 49%',
        '--secondary': broker.secondaryColor || '110 16% 8%',
        '--accent': broker.accentColor || '97 78% 56%',
        '--card-title': content.cardTitleColor ? `hsl(${content.cardTitleColor})` : 'inherit',
        '--card-value': content.cardValueColor ? `hsl(${content.cardValueColor})` : 'hsl(var(--primary))',
        '--card-icon': content.cardIconColor ? `hsl(${content.cardIconColor})` : 'hsl(var(--primary))',
        '--status-tag-bg': content.statusTagBgColor ? `hsl(${content.statusTagBgColor})` : 'rgba(255,255,255,0.9)',
        '--status-tag-text': content.statusTagTextColor ? `hsl(${content.statusTagTextColor})` : '#000',
        '--search-button-bg': content.searchButtonBgColor ? `hsl(${content.searchButtonBgColor})` : 'hsl(var(--primary))',
        '--search-button-text': content.searchButtonTextColor ? `hsl(${content.searchButtonTextColor})` : 'hsl(var(--secondary))',
        '--cta-button-bg': content.ctaButtonBgColor ? `hsl(${content.ctaButtonBgColor})` : 'hsl(var(--primary))',
        '--cta-button-text': content.ctaButtonTextColor ? `hsl(${content.ctaButtonTextColor})` : 'hsl(var(--secondary))',
        '--cta-section-bg': content.ctaSectionBgColor ? `hsl(${content.ctaSectionBgColor})` : 'hsl(var(--secondary))',
        '--cta-section-title': content.ctaSectionTitleColor ? `hsl(${content.ctaSectionTitleColor})` : '#fff',
        '--cta-section-subtitle': content.ctaSectionSubtitleColor ? `hsl(${content.ctaSectionSubtitleColor})` : 'rgba(255,255,255,0.6)',
        '--cta-section-button-bg': content.ctaSectionButtonBgColor ? `hsl(${content.ctaSectionButtonBgColor})` : 'hsl(var(--primary))',
        '--cta-section-button-text': content.ctaSectionButtonTextColor ? `hsl(${content.ctaSectionButtonTextColor})` : 'hsl(var(--secondary))',
    } as React.CSSProperties;

    const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

    return (
        <div style={dynamicStyles} className="domus-theme font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen">
            <style jsx global>{`
                .neon-glow {
                    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
                }
                .price-slider {
                    accent-color: hsl(var(--primary));
                }
                .price-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: hsl(var(--primary)) !important;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .price-slider::-moz-range-thumb {
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: hsl(var(--primary)) !important;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
            `}</style>
            
            <DomusHeader broker={broker} />
            
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Catálogo de <span className="text-primary italic">Imóveis</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Explore nossa curadoria exclusiva de imóveis de alto padrão. Unidades selecionadas com tecnologia e transparência.
                    </p>
                </div>

                <section className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 mb-12 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Tipo de Imóvel</label>
                            <select 
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
                            >
                                <option value="all">Todos os tipos</option>
                                <option value="Apartamento">Apartamentos</option>
                                <option value="Casa">Casas de Luxo</option>
                                <option value="Cobertura">Coberturas</option>
                                <option value="Terreno">Terrenos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Cidade ou Bairro</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">place</span>
                                <input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-primary focus:border-primary text-slate-900 dark:text-white transition-all outline-none" 
                                    placeholder="Ex: João Pessoa, Manaíra" 
                                    type="text"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Faixa de Preço</label>
                                <span className="text-xs font-bold text-primary">Até {parseInt(maxPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="py-3 px-1">
                                <input 
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary price-slider" 
                                    max="5000000" 
                                    min="0" 
                                    step="50000" 
                                    type="range"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
                        <div className="flex gap-2">
                            {filterType !== 'all' && (
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                                    {filterType.toUpperCase()} <button onClick={() => setFilterType('all')} className="hover:text-black">×</button>
                                </span>
                            )}
                            <button onClick={handleClearFilters} className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors underline underline-offset-4 cursor-pointer">Limpar filtros</button>
                        </div>
                        <button onClick={handleApplyFilters} style={{ backgroundColor: 'var(--search-button-bg)', color: 'var(--search-button-text)' }} className="px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-lg">
                            <span className="material-symbols-outlined text-lg">filter_alt</span>
                            Aplicar Filtros
                        </button>
                    </div>
                </section>

                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold">{sortedProperties.length} imóveis encontrados</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Ordenar por:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
                        >
                            <option value="recent">Mais recentes</option>
                            <option value="price_asc">Menor preço</option>
                            <option value="price_desc">Major preço</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {paginatedProperties.map((property) => (
                        <Link href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} key={property.id} className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                            <div className="relative overflow-hidden h-[240px]">
                                <Image 
                                    alt={property.informacoesbasicas.nome} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    src={property.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'} 
                                    fill
                                />
                                <div className="absolute top-4 left-4" style={{ backgroundColor: 'var(--status-tag-bg)', color: 'var(--status-tag-text)' }}>
                                    <span className="backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{property.informacoesbasicas.status}</span>
                                </div>
                                <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
                                    <span className="material-symbols-outlined text-xl">favorite_border</span>
                                </button>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors uppercase" style={{ color: 'var(--card-title)' }}>{property.informacoesbasicas.nome}</h3>
                                <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">place</span>
                                    {property.localizacao.bairro}, {property.localizacao.cidade}
                                </div>
                                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-xs mb-6 border-y border-slate-50 dark:border-slate-800 py-3">
                                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base" style={{ color: 'var(--card-icon)' }}>bed</span> {formatQuartos(property.caracteristicasimovel.quartos)}</span>
                                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base" style={{ color: 'var(--card-icon)' }}>square_foot</span> {property.caracteristicasimovel.tamanho}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-extrabold" style={{ color: 'var(--card-value)' }}>{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Consulte'}</span>
                                    <button className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg hover:bg-primary hover:text-black transition-colors">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-16 mb-20 flex justify-center items-center gap-2">
                        <button 
                            onClick={() => router.push(`${pathname}?page=${currentPage - 1}`)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary hover:text-black transition-colors group disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button 
                                key={page}
                                onClick={() => router.push(`${pathname}?page=${page}`)}
                                className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-all", currentPage === page ? "bg-primary text-black font-bold border-primary shadow-sm" : "border-slate-200 dark:border-slate-800 hover:bg-primary hover:text-black")}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            onClick={() => router.push(`${pathname}?page=${currentPage + 1}`)}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary hover:text-black transition-colors group disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                )}

                <section className="py-20">
                    <div className="rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--cta-section-bg)' }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-8 items-center">
                            <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight" style={{ color: 'var(--cta-section-title)' }}>{content.ctaTitle || 'Pronto para encontrar seu próximo lar?'}</h2>
                            <p className="text-xl" style={{ color: 'var(--cta-section-subtitle)' }}>{content.ctaSubtitle || 'Agende uma consultoria personalizada agora mesmo via WhatsApp.'}</p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex min-w-[240px] items-center justify-center gap-3 rounded-full h-16 px-10 text-lg font-black shadow-lg hover:scale-[1.05] transition-transform uppercase tracking-widest" style={{ backgroundColor: 'var(--cta-section-button-bg)', color: 'var(--cta-section-button-text)' }}>
                                    <span className="material-symbols-outlined font-bold">chat</span>
                                    FALAR NO WHATSAPP
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <DomusFooter broker={broker} />
            <WhatsAppWidget brokerId={broker.id} />
        </div>
    );
}

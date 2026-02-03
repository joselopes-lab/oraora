
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
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
    searchButtonBgColor?: string;
    searchButtonTextColor?: string;
    statusTagBgColor?: string;
    statusTagTextColor?: string;
  };
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
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[];
    tamanho?: string;
    vagas?: string;
  };
};

type SearchResultsPageProps = {
  broker: Broker;
  properties: Property[];
}

function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);

    const sNormalized = s / 100;
    const lNormalized = l / 100;

    const a = sNormalized * Math.min(lNormalized, 1 - lNormalized);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = lNormalized - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

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


export default function SearchResults({ broker, properties }: SearchResultsPageProps) {
    const searchButtonBgColor = broker.homepage?.searchButtonBgColor ? hslToHex(broker.homepage.searchButtonBgColor) : '#141811';
    const searchButtonTextColor = broker.homepage?.searchButtonTextColor ? hslToHex(broker.homepage.searchButtonTextColor) : '#c3e738';
    const statusTagBgColor = broker.homepage?.statusTagBgColor ? hslToHex(broker.homepage.statusTagBgColor) : undefined;
    const statusTagTextColor = broker.homepage?.statusTagTextColor ? hslToHex(broker.homepage.statusTagTextColor) : undefined;
    
    return (
        <div className="bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
            <div className="relative flex min-h-screen w-full flex-col group/design-root">
                <UrbanPadraoHeader broker={broker} />
                <main className="flex-1 w-full flex flex-col items-center">
                    <section className="w-full bg-white border-b border-[#f0f2f4] py-8 lg:py-12">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-text-main mb-2">Encontre o imóvel ideal</h1>
                                    <p className="text-text-muted">Utilize os filtros abaixo para refinar sua busca.</p>
                                </div>
                                <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="col-span-1 md:col-span-2 lg:col-span-4">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Busca Rápida</label>
                                            <div className="flex items-center h-12 bg-white rounded-lg px-3 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                <span className="material-symbols-outlined text-text-muted mr-2">search</span>
                                                <input className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium placeholder-gray-400" placeholder="Digite o nome do condomínio, bairro ou cidade..." type="text"/>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Tipo de Imóvel</label>
                                            <div className="flex items-center h-12 bg-white rounded-lg px-3 border border-gray-200 focus-within:border-primary transition-all">
                                                <span className="material-symbols-outlined text-text-muted mr-2">home_work</span>
                                                <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                                                    <option>Todos os tipos</option>
                                                    <option>Apartamento</option>
                                                    <option>Casa</option>
                                                    <option>Cobertura</option>
                                                    <option>Terreno</option>
                                                    <option>Comercial</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Quartos</label>
                                            <div className="flex items-center h-12 bg-white rounded-lg px-3 border border-gray-200 focus-within:border-primary transition-all">
                                                <span className="material-symbols-outlined text-text-muted mr-2">bed</span>
                                                <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                                                    <option>Qualquer</option>
                                                    <option>1+</option>
                                                    <option>2+</option>
                                                    <option>3+</option>
                                                    <option>4+</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Preço Mínimo</label>
                                            <div className="flex items-center h-12 bg-white rounded-lg px-3 border border-gray-200 focus-within:border-primary transition-all">
                                                <span className="material-symbols-outlined text-text-muted mr-2">attach_money</span>
                                                <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                                                    <option>R$ 0</option>
                                                    <option>R$ 500.000</option>
                                                    <option>R$ 1.000.000</option>
                                                    <option>R$ 2.000.000</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Preço Máximo</label>
                                            <div className="flex items-center h-12 bg-white rounded-lg px-3 border border-gray-200 focus-within:border-primary transition-all">
                                                <span className="material-symbols-outlined text-text-muted mr-2">attach_money</span>
                                                <select className="w-full bg-transparent border-none focus:ring-0 text-text-main text-sm font-medium cursor-pointer">
                                                    <option>Sem limite</option>
                                                    <option>R$ 1.000.000</option>
                                                    <option>R$ 3.000.000</option>
                                                    <option>R$ 5.000.000</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-4 mt-2 justify-between items-center">
                                            <button className="text-sm font-medium text-text-muted hover:text-text-main flex items-center gap-1" type="button">
                                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                                Mais filtros avançados
                                            </button>
                                            <div className="flex w-full md:w-auto gap-4">
                                                <button className="px-6 h-12 rounded-lg border border-gray-200 font-bold text-text-muted hover:bg-gray-50 hover:text-black transition-colors flex-1 md:flex-none" type="reset">
                                                    Limpar
                                                </button>
                                                <button 
                                                  className="px-8 h-12 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 flex-1 md:flex-none transition-colors"
                                                  type="button"
                                                  style={{
                                                    backgroundColor: searchButtonBgColor,
                                                    color: searchButtonTextColor
                                                  }}
                                                >
                                                    <span className="material-symbols-outlined">search</span>
                                                    Buscar Imóveis
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-10 bg-background-light flex-1">
                        <div className="layout-container max-w-[1280px] mx-auto px-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{properties.length} Imóveis encontrados</h2>
                                    <p className="text-sm text-text-muted">Exibindo {properties.length} de {properties.length} resultados</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-text-muted">Ordenar por:</span>
                                    <div className="relative group">
                                        <select className="appearance-none bg-white border border-gray-200 text-text-main py-2 pl-4 pr-10 rounded-lg text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer">
                                            <option>Mais Relevantes</option>
                                            <option>Menor Preço</option>
                                            <option>Maior Preço</option>
                                            <option>Mais Recentes</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-lg">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                               {properties.map((property) => {
                                const quartos = property.caracteristicasimovel.quartos;
                                return (
                                <Link key={property.id} href={`/sites/${broker.slug}/imovel/${property.informacoesbasicas.slug || property.id}`} className="group relative flex flex-col rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:border-neon-green/50 transition-all duration-300 overflow-hidden">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                        <div className={cn("absolute top-3 left-3 z-10 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide shadow-sm", !statusTagBgColor && 'bg-primary text-primary-foreground')} style={{ backgroundColor: statusTagBgColor, color: statusTagTextColor }}>
                                          {property.informacoesbasicas.status}
                                        </div>
                                        <button className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">favorite</span>
                                        </button>
                                        <Image alt={property.informacoesbasicas.nome} width={400} height={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={property.midia?.[0] || 'https://picsum.photos/seed/prop/400/300'}/>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                                            {property.informacoesbasicas.valor && (
                                            <p className="text-white font-bold text-2xl tracking-tight">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(property.informacoesbasicas.valor)}
                                            </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col p-5 gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#111418] group-hover:text-primary transition-colors line-clamp-1">{property.informacoesbasicas.nome}</h3>
                                            <p className="text-sm text-[#617589] mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {property.localizacao.bairro}, {property.localizacao.cidade}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-y border-gray-100 py-3 mt-1">
                                            {property.caracteristicasimovel.quartos && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">bed</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{formatQuartos(quartos)}</span>
                                                </div>
                                            )}
                                            <div className="w-px h-4 bg-gray-200"></div>
                                             {property.caracteristicasimovel.vagas && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{property.caracteristicasimovel.vagas}</span>
                                                </div>
                                             )}
                                             <div className="w-px h-4 bg-gray-200"></div>
                                            {property.caracteristicasimovel.tamanho && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">square_foot</span>
                                                    <span className="text-sm font-semibold text-[#111418]">{property.caracteristicasimovel.tamanho}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <Image alt="Broker" width={32} height={32} className="size-8 rounded-full object-cover border border-gray-200" data-alt="Portrait of a professional male real estate broker in a suit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO3OU-VVuU6WkOiWQKjAck_mKT5ntgGjYCf0YR2g7eBlIzjvjgEkA85OqjaCN676ZUabchWSeD3YfEiV2jDhJkVG6lQpn3ILlv0vXz9e7dRDmb3_q5UKpLPPO3kimFLEgk9l30TDub4YW9FjJuceaxmrrpJS6jHjQ6RnqNNb8cW1Q1Ln4h5LKOchVt1B80329J6IMNs3EET6isYzf7I4e1b8Ba7O3cKsTgq7Xcay3931UK3kmPncXsudImp_bV64VZVyO9pFvoOuI"/>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-[#617589]">Corretor</span>
                                                    <span className="text-xs font-bold text-[#111418]">{broker.brandName}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="flex items-center justify-center size-9 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                                </button>
                                                <button className="flex items-center justify-center h-9 px-3 rounded-lg bg-[#111418] text-white text-xs font-bold hover:bg-primary transition-colors">
                                                    Ver Detalhes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                )})}
                            </div>
                            {/* Pagination */}
                            <div className="mt-16 flex justify-center pb-12">
                                <nav className="flex items-center gap-2">
                                    <button className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-not-allowed hover:bg-gray-50" disabled>
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button className="flex items-center justify-center size-10 rounded-full bg-primary text-black font-bold shadow-md">
                                        1
                                    </button>
                                    <button className="flex items-center justify-center size-10 rounded-full border border-gray-200 bg-white text-text-main font-medium hover:bg-gray-100 hover:border-gray-300 transition-all">
                                        2
                                    </button>
                                    <button className="flex items-center justify-center size-10 rounded-full border border-gray-200 bg-white text-text-main font-medium hover:bg-gray-100 hover:border-gray-300 transition-all">
                                        3
                                    </button>
                                    <span className="flex items-center justify-center size-10 text-gray-400">...</span>
                                    <button className="flex items-center justify-center size-10 rounded-full border border-gray-200 bg-white text-text-main font-medium hover:bg-gray-100 hover:border-gray-300 transition-all">
                                        8
                                    </button>
                                    <button className="flex items-center justify-center size-10 rounded-full border border-gray-200 bg-white text-text-main hover:bg-black hover:text-white hover:border-black transition-all">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-16 bg-black text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0")'}}></div>
                        <div className="layout-container max-w-[1280px] mx-auto px-6 relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Não encontrou o que procurava?</h2>
                            <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg">
                                Cadastre-se para receber alertas de novos imóveis que correspondem ao seu perfil ou fale diretamente com nossa equipe.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <input className="h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-80" placeholder="Seu melhor e-mail" type="email" />
                                <button className="h-12 px-8 rounded-lg bg-primary text-black font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                                    Receber Alertas
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
                <UrbanPadraoFooter broker={broker}/>
                <a aria-label="Chat on WhatsApp" className="fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer" href="#">
                    <span className="material-symbols-outlined text-3xl">chat</span>
                </a>
            </div>
        </div>
    );
}


'use client';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function SobrePageClient() {
    const firestore = useFirestore();
    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ oraoraSobre?: any }>(siteContentRef);
    const content = siteData?.oraoraSobre || {};

    const defaultContent = {
        headerTagline: 'Revolucionando o Mercado',
        headerTitle: 'Conectamos sonhos a <br/><span class="relative inline-block"><span class="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">novos endereços.</span><span class="absolute bottom-2 left-0 w-full h-4 bg-primary/20 -z-10 rotate-1"></span></span>',
        headerSubtitle: 'Nascemos para simplificar a jornada de quem busca o imóvel ideal. Tecnologia de ponta, transparência e segurança em cada metro quadrado.',
        videoImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQxx0WPnY7E5TAmKj6xSzXzXv3u6pExJ5cZVShv5PFbocjuhmrwuI1XRocewnwPCV3ePZbAVlm5NlYhULqf7gUOAag1uqAO48ESp87YBgP9ZWIZLXkifTbYsskZyutqDg1ISHkZYF_8aiI_PWiNZq_MskxqYmMqUc4x7ukYKDGzNdqXFTqfwPSwYldn-1Itggd30yjady9fsnJJOGU-uv9cSIXFQ2d-6IFPiE-tTAdBsnLEA4puBWSKKgapeqQcNCBX3UeJUO-jBI',
        statAnunciados: '+2 Mi',
        statNegocios: '150k',
        statCidades: '300+',
        statAvaliacao: '4.9',
        pilaresTitle: 'Nossos Pilares',
        pilaresSubtitle: 'Não somos apenas um portal de classificados. Somos uma plataforma de tecnologia que coloca as pessoas no centro de cada decisão. Acreditamos que encontrar um lar deve ser uma experiência inspiradora, não estressante.',
        pilar1Icon: 'verified_user',
        pilar1Title: 'Segurança em Primeiro Lugar',
        pilar1Description: 'Todos os anunciantes passam por uma verificação rigorosa. Garantimos que cada listagem seja real e segura para visitação.',
        pilar2Icon: 'bolt',
        pilar2Title: 'Tecnologia que Simplifica',
        pilar2Description: 'Filtros inteligentes, tour virtual 3D e agendamento online. Removemos a burocracia para você focar no que importa.',
        pilar3Icon: 'favorite',
        pilar3Title: 'Feito para Pessoas',
        pilar3Description: 'Nosso suporte é humanizado e nossa plataforma desenhada pensando na sua experiência, seja no desktop ou celular.',
        timeTitle: 'Quem faz acontecer',
        timeSubtitle: 'Um time apaixonado por tecnologia e mercado imobiliário, trabalhando de diversos lugares do mundo para entregar a melhor experiência.',
        timeMembers: [
            { name: 'Vinícius Coêlho', title: 'Founder & CEO', description: 'Visão, Produto e Plataforma', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD833a_cPywAVT1Pe29kbQ30vCVqW8H3qf3KdoV3w7b09z_3EaA8c_Vp7crO4z3J3e7aF5n2K8b0n9k0c2D7e6Z1a5W4n5d1e6Z0c2b' },
            { name: 'Zé Filho', title: 'Co-Founder & Head de Inovação', description: 'Estratégia e Novos Negócios', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { name: 'Raissa Guedes', title: 'Head de Financeiro & Operações', description: 'Gestão financeira, controle e sustentabilidade', imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { name: 'ORA', title: 'Inteligência Imobiliária do OraOra', description: 'Atendimento, Organização e Conexão Inteligente', imageUrl: 'https://images.unsplash.com/photo-1516110833944-7638c4a05210?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
        ],
        ctaTitle: 'Encontre seu lugar no mundo',
        ctaSubtitle: 'Seja para comprar, alugar ou anunciar. Oferecemos a plataforma mais completa para você realizar seu próximo passo com confiança.',
    };

    const finalContent = { ...defaultContent, ...content };

    return (
        <main className="flex-grow">
            <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
                <div className="absolute inset-0 bg-grid -z-10 h-full w-full"></div>
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-secondary-green/10 rounded-full blur-[100px] -z-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-gray-200 mb-8 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{isSiteDataLoading ? <Skeleton className="h-4 w-32" /> : finalContent.headerTagline}</span>
                        </div>
                        <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8" dangerouslySetInnerHTML={{ __html: isSiteDataLoading ? defaultContent.headerTitle : finalContent.headerTitle }}/>
                         <div className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                           {isSiteDataLoading ? (
                            <div className="space-y-2">
                                <div className="h-6 w-full bg-gray-200 animate-pulse rounded-md"></div>
                                <div className="h-6 w-5/6 mx-auto bg-gray-200 animate-pulse rounded-md"></div>
                             </div>
                           ) : (
                             <p>{finalContent.headerSubtitle}</p>
                           )}
                        </div>
                    </div>
                    <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 group cursor-pointer">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="w-20 h-20 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-dark-text shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
                            </div>
                        </div>
                        <div className="w-full h-full bg-gray-100 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url('${finalContent.videoImageUrl}')`, filter: 'brightness(0.95)' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            <div className="absolute bottom-8 left-8 text-white z-20">
                                <p className="text-sm font-medium uppercase tracking-wider mb-1">Nosso Manifesto</p>
                                <h3 className="text-2xl font-display font-bold">Construindo o futuro do morar</h3>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-gray-100 pt-12">
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-display font-bold text-dark-text mb-2">{isSiteDataLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : finalContent.statAnunciados}</div>
                            <p className="text-gray-500 font-medium">Imóveis Anunciados</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-display font-bold text-dark-text mb-2">{isSiteDataLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : finalContent.statNegocios}</div>
                            <p className="text-gray-500 font-medium">Negócios Fechados</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-display font-bold text-dark-text mb-2">{isSiteDataLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : finalContent.statCidades}</div>
                            <p className="text-gray-500 font-medium">Cidades Atendidas</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-display font-bold text-dark-text mb-2">{isSiteDataLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : finalContent.statAvaliacao}</div>
                            <p className="text-gray-500 font-medium">Avaliação Média</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="font-display text-4xl font-bold mb-6 text-white">{finalContent.pilaresTitle}</h2>
                            <p className="text-gray-300 text-lg mb-10 leading-relaxed">{finalContent.pilaresSubtitle}</p>
                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 shadow-sm flex items-center justify-center shrink-0 text-primary">
                                        <span className="material-symbols-outlined text-2xl">{finalContent.pilar1Icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-display text-xl font-bold mb-2 text-white">{finalContent.pilar1Title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{finalContent.pilar1Description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 shadow-sm flex items-center justify-center shrink-0 text-primary">
                                        <span className="material-symbols-outlined text-2xl">{finalContent.pilar2Icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-display text-xl font-bold mb-2 text-white">{finalContent.pilar2Title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{finalContent.pilar2Description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 shadow-sm flex items-center justify-center shrink-0 text-primary">
                                        <span className="material-symbols-outlined text-2xl">{finalContent.pilar3Icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-display text-xl font-bold mb-2 text-white">{finalContent.pilar3Title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{finalContent.pilar3Description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Static content for now */}
                    </div>
                </div>
            </section>
             <section className="py-24 bg-white" id="time">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="font-display text-4xl font-bold mb-4">{finalContent.timeTitle}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-16">
                        {finalContent.timeSubtitle}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {(finalContent.timeMembers || []).map((member: any, index: number) => (
                            <div key={index} className="flex flex-col items-center text-center">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg mb-4">
                                    <Image src={member.imageUrl} alt={member.name} layout="fill" objectFit="cover" />
                                </div>
                                <h3 className="font-bold text-xl text-dark-text">{member.name}</h3>
                                <p className="text-dark-text font-medium">{member.title}</p>
                                <p className="text-gray-500 text-sm mt-2">{member.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-24 bg-black text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[150px] opacity-10"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h2 className="font-display text-4xl lg:text-5xl font-bold mb-8">{finalContent.ctaTitle}</h2>
                    <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">{finalContent.ctaSubtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-primary hover:bg-primary-hover text-dark-text font-bold py-4 px-10 rounded-xl text-lg transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(140,249,31,0.4)] flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">search</span>
                            Buscar Imóveis
                        </button>
                        <button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium py-4 px-10 rounded-xl text-lg transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                            <span className="material-symbols-outlined">add_home</span>
                            Anunciar Grátis
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

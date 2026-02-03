
'use client';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { WhatsAppWidget } from '../components/WhatsAppWidget';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  layoutId?: string;
  urbanPadraoServicos?: {
    headerTagline?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    servicesTitle?: string;
    servicesSubtitle?: string;
    serviceItems?: { icon: string; title: string; description: string; }[];
    processTagline?: string;
    processTitle?: string;
    processSubtitle?: string;
    processSteps?: { title: string; description: string; }[];
    processImageUrl?: string;
    finalCtaTitle?: string;
    finalCtaSubtitle?: string;
  }
};

type ServicosPageProps = {
  broker: Broker;
};

export default function ServicosPage({ broker }: ServicosPageProps) {
    const content = broker.urbanPadraoServicos || {};
    
    const defaultServiceItems = [
      { icon: 'real_estate_agent', title: 'Assessoria Completa', description: 'Acompanhamento integral na compra ou venda de imóveis. Desde a busca do perfil ideal até a negociação final, garantindo o melhor deal.' },
      { icon: 'analytics', title: 'Avaliação de Imóveis', description: 'Laudos técnicos precisos baseados em dados reais de mercado para definir o valor justo e competitivo do seu patrimônio.' },
      { icon: 'photo_camera', title: 'Marketing Digital de Imóveis', description: 'Produção visual de alto padrão (fotos, vídeos, tour 360º) e campanhas segmentadas para atrair o público qualificado.' },
      { icon: 'gavel', title: 'Consultoria Jurídica', description: 'Análise documental minuciosa (Due Diligence) e suporte na elaboração de contratos para segurança jurídica total.' },
      { icon: 'travel_explore', title: 'Property Hunting', description: 'Serviço de busca ativa personalizada. Encontramos imóveis "off-market" e oportunidades exclusivas que atendem seus critérios.' },
      { icon: 'key', title: 'Gestão Patrimonial', description: 'Administração de imóveis para locação com foco na rentabilidade, manutenção do ativo e relacionamento com inquilinos.' },
    ];

    const defaultProcessSteps = [
      { title: 'Diagnóstico Inicial', description: 'Reunião para entender profundamente seus objetivos, perfil e necessidades financeiras.' },
      { title: 'Estratégia e Busca', description: 'Definição do plano de ação e curadoria de imóveis ou desenvolvimento da campanha de venda.' },
      { title: 'Negociação Técnica', description: 'Mediação profissional das propostas para garantir as melhores condições para você.' },
      { title: 'Fechamento e Pós-Venda', description: 'Suporte jurídico até a assinatura e acompanhamento contínuo após a entrega das chaves.' },
    ];

    const serviceItems = content.serviceItems && content.serviceItems.length > 0 ? content.serviceItems : defaultServiceItems;
    const processSteps = content.processSteps && content.processSteps.length > 0 ? content.processSteps : defaultProcessSteps;


    return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root bg-background-light text-text-main font-display antialiased overflow-x-hidden selection:bg-primary selection:text-black">
        <UrbanPadraoHeader broker={broker} />
        <main className="flex-1 w-full flex flex-col items-center">
            <section className="w-full bg-white border-b border-gray-100 py-12 lg:py-20">
                <div className="layout-container max-w-[1280px] mx-auto px-6 text-center">
                    <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-3 block">{content.headerTagline || 'Excelência em Cada Detalhe'}</span>
                    <h1 className="text-4xl lg:text-6xl font-black text-text-main tracking-tight mb-6" dangerouslySetInnerHTML={{ __html: content.headerTitle || 'Soluções Imobiliárias <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Sob Medida</span>' }}></h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
                        {content.headerSubtitle || 'Combinamos expertise de mercado, tecnologia de ponta e atendimento personalizado para oferecer uma experiência única na gestão do seu patrimônio.'}
                    </p>
                    <button className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105">
                        Solicitar Consultoria
                        <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                    </button>
                </div>
            </section>
            <section className="w-full py-16 lg:py-24 bg-background-light">
                <div className="layout-container max-w-[1280px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-text-main mb-4">{content.servicesTitle || 'Nossos Serviços Exclusivos'}</h2>
                        <p className="text-text-muted">{content.servicesSubtitle || 'Explore como podemos ajudar você a atingir seus objetivos imobiliários com segurança e eficiência.'}</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {serviceItems.map((item, index) => (
                         <div key={index} className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-primary/30 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-8xl text-primary">{item.icon}</span>
                            </div>
                            <div className="size-14 rounded-xl bg-background-light border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-colors duration-300 text-primary relative z-10">
                                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3 relative z-10">{item.title}</h3>
                            <p className="text-text-muted leading-relaxed mb-6 relative z-10 text-sm">
                                {item.description}
                            </p>
                            <a className="inline-flex items-center text-sm font-bold text-primary-hover hover:text-secondary transition-colors relative z-10" href="#">
                                Saiba mais <span className="material-symbols-outlined text-base ml-1">chevron_right</span>
                            </a>
                        </div>
                       ))}
                    </div>
                </div>
            </section>
            <section className="w-full py-20 lg:py-28 bg-white overflow-hidden">
                <div className="layout-container max-w-[1280px] mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2">
                            <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-3 block">{content.processTagline || 'Metodologia'}</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-text-main mb-6 leading-tight">{content.processTitle || 'Como Funciona Nosso Processo'}</h2>
                            <p className="text-text-muted text-lg mb-10">
                               {content.processSubtitle || 'Desenvolvemos um fluxo de trabalho transparente e eficiente para que você tenha tranquilidade em todas as etapas da negociação.'}
                           </p>
                            <div className="space-y-8 relative">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10"></div>
                                {processSteps.map((step, index) => (
                                <div key={index} className="flex gap-6 group">
                                    <div className="flex-shrink-0">
                                        <div className="size-10 rounded-full bg-white border-2 border-primary text-text-main font-bold flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:border-primary transition-all">{index + 1}</div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-text-main mb-2">{step.title}</h4>
                                        <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/10 rounded-3xl blur-2xl opacity-70"></div>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-gray-100">
                                <img alt="Processo de Trabalho" className="absolute inset-0 w-full h-full object-cover" src={content.processImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJT05dCvgoP8cpt7a_4bQFJ0NUZ2ax9W2m5KakzJgJtix5tAFHVNx1-JCPjuofPJX1WgcN7uFiPH1KUXWtrlhyJ_g8PvBom7JeG3WcWVmNK8n9lXB1rdGpCHUgnB_hVLzXb4NhTNJM5kheYV42MvwhcZcdarv1cqq9t0BsyunOoC13cGdksddBGaHlPcLlnCPcPKaZixZH6KwjLe5S0073NF3h0l0RrLlPHHHT0bvHV20dvlkPb_1kjd2Db-mUhwbcN-47A-BC0nY'}/>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
                                        <h4 className="font-bold text-text-main">Compromisso Ético</h4>
                                    </div>
                                    <p className="text-sm text-text-muted">Transparência e integridade são os pilares que sustentam cada etapa do nosso trabalho.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="w-full py-20 bg-text-main relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-10" style={{backgroundImage: "radial-gradient(#c3e738 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
                <div className="layout-container max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-black mb-6">{content.finalCtaTitle || 'Pronto para transformar seus planos?'}</h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                        {content.finalCtaSubtitle || 'Agende uma conversa sem compromisso e descubra como nossa assessoria pode fazer a diferença no seu próximo negócio imobiliário.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="h-14 px-8 rounded-full bg-primary hover:bg-primary-hover text-black text-base font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">calendar_month</span>
                            Solicitar Serviço
                        </button>
                        <button className="h-14 px-8 rounded-full bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">call</span>
                            Fale Conosco
                        </button>
                    </div>
                </div>
            </section>
        </main>
        <UrbanPadraoFooter broker={broker} />
        <WhatsAppWidget brokerId={broker.id}/>
    </div>
  );
}

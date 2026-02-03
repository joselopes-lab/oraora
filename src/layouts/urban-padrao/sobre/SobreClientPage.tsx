'use client';
import { UrbanPadraoHeader } from '../components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '../components/UrbanPadraoFooter';
import { WhatsAppWidget } from '../components/WhatsAppWidget';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  layoutId?: string;
  urbanPadraoSobre?: {
    profileImageUrl?: string;
    brokerName?: string;
    brokerTitle?: string;
    bio?: string;
    statManagedDeals?: string;
    statAssistedFamilies?: string;
    statYearsExperience?: string;
    videoUrl?: string;
    videoTitle?: string;
    videoDescription?: string;
    value1Title?: string;
    value1Description?: string;
    value2Title?: string;
    value2Description?: string;
    value3Title?: string;
    value3Description?: string;
    areas?: string[];
    differentials?: { title?: string, description?: string }[];
    awards?: { yearOrEntity?: string, title?: string }[];
  }
};

type SobrePageProps = {
  broker: Broker;
};


export default function SobreClientPage({ broker }: SobrePageProps) {
  const content = broker.urbanPadraoSobre || {};
  
  const defaultValues = {
    profileImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnnSrwSkNX4VEMzf8v2AibJQp1RcHvNb3_q0wuoHZwhVlAJKqmwIhebGEXD_ehHxVeLXegQhl11I3AK8d7sHOjyX2Ru2QsxLQ7CNKGhMFL1kuVczfW4JlWO-MgFaOLLDGfDt2hXsZyS7t5vdOo90YwN1Cwqcoemknmi74RiulnUXgpEBnQguZIsUxNueG01P_uPnYKeZbzSmXBrfvlrkH_y3PAJxi8hET-_dNaHXrJavIJPjRaZDjfN1aQrROrA0lpueLFt6_FA6I',
    brokerName: 'Ricardo Alencar',
    brokerTitle: 'Private Broker & Especialista em Luxo',
    bio: `Minha trajetória de 15 anos no mercado de alto padrão não é apenas sobre vender imóveis; é sobre entender histórias e construir legados. Iniciei minha carreira com o propósito de oferecer uma consultoria verdadeiramente pessoal, onde cada cliente tem acesso direto ao meu expertise, sem intermediários.\nAtuando nos endereços mais cobiçados de São Paulo, consolidei minha marca pessoal através da discrição, da ética inegociável e de uma curadoria de oportunidades que muitas vezes não chegam ao mercado aberto.`,
    statManagedDeals: 'R$ 500M+',
    statAssistedFamilies: '1.200',
    statYearsExperience: '15 Anos',
    videoImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzPeUZUrjmZi1J6YXvGV6PUhFRbF5C43OfQNC14zZjfRDhiA6SJGvTiMBwmOE6NONcPtqlUT-byvh0sabE8__a8rXqGsHVmCRktA8lqGHtXsQLdsEoewXy2QBy6gY780D68cWXi_y3oXYoy6essuqpeSCCySFlIh0JcOuINOy7EpKFi58DMV9dEDK6yg-ZhpdOXpU5_SFlJ77FjB-DgGMFngpcbp6tAnMRQflFN1ocdH4KTnLAGONujmpJBOrpUhWQgzI7rb4_N0E',
    videoTitle: 'Por que escolhi ser corretor',
    videoDescription: 'Uma visão pessoal sobre ética, compromisso e a paixão por conectar pessoas aos seus lares ideais.',
    value1Title: 'Minha Ética é Inegociável',
    value1Description: 'Não abro mão da transparência absoluta. Você terá acesso real a todas as informações para tomar decisões seguras, sem letras miúdas.',
    value2Title: 'Atendimento Pessoal',
    value2Description: 'Quando você me contrata, sou eu quem atende o telefone. Valorizo o contato direto e personalizado, acompanhando cada visita pessoalmente.',
    value3Title: 'Foco no Seu Resultado',
    value3Description: 'Meu objetivo não é apenas a venda, mas a valorização do seu patrimônio. Utilizo dados e análise de mercado para orientar o melhor momento de compra ou venda.',
    areas: ["Jardins & Paulista", "Itaim Bibi", "Vila Nova Conceição", "Fazenda Boa Vista"],
    awards: [
      { yearOrEntity: '2023', title: 'Top Producer Individual' },
      { yearOrEntity: 'Christie\'s', title: 'Luxury Specialist' },
      { yearOrEntity: '5 Estrelas', title: 'Atendimento Cliente' },
      { yearOrEntity: 'CRECI-SP', title: 'Certificado de Honra' },
    ]
  };
  
  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex flex-col items-center">
        <section className="w-full pt-16 pb-12 lg:pt-24 lg:pb-16 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-background-light to-transparent -z-10"></div>
          <div className="layout-container max-w-[1000px] mx-auto px-6 flex flex-col items-center text-center">
            <div className="relative mb-8 group">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative size-40 lg:size-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <Image alt={content.brokerName || defaultValues.brokerName} className="w-full h-full object-cover" width={192} height={192} src={content.profileImageUrl || defaultValues.profileImageUrl} />
              </div>
              <div className="absolute bottom-2 right-2 flex gap-2">
                <a className="size-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg transform hover:-translate-y-1" href="#">
                  <span className="text-[10px] font-bold">IN</span>
                </a>
                <a className="size-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg transform hover:-translate-y-1" href="#">
                  <span className="text-[10px] font-bold">LI</span>
                </a>
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-text-main tracking-tight mb-2">
              {content.brokerName || defaultValues.brokerName}
            </h1>
            <p className="text-lg lg:text-xl font-medium text-secondary uppercase tracking-widest mb-8">
              {content.brokerTitle || defaultValues.brokerTitle}
            </p>
            <div className="max-w-3xl mx-auto text-text-muted text-lg leading-relaxed mb-12 space-y-4">
              {(content.bio || defaultValues.bio).split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-4xl border-t border-gray-100 pt-10">
              <div className="flex flex-col items-center gap-1 group cursor-default">
                <span className="text-4xl lg:text-5xl font-black text-text-main group-hover:text-primary transition-colors duration-300">{content.statManagedDeals || defaultValues.statManagedDeals}</span>
                <span className="text-sm text-text-muted font-bold uppercase tracking-wider">em Negócios Geridos</span>
              </div>
              <div className="flex flex-col items-center gap-1 group cursor-default">
                <span className="text-4xl lg:text-5xl font-black text-text-main group-hover:text-primary transition-colors duration-300">{content.statAssistedFamilies || defaultValues.statAssistedFamilies}</span>
                <span className="text-sm text-text-muted font-bold uppercase tracking-wider">Famílias Assessoradas</span>
              </div>
              <div className="flex flex-col items-center gap-1 group cursor-default">
                <span className="text-4xl lg:text-5xl font-black text-text-main group-hover:text-primary transition-colors duration-300">{content.statYearsExperience || defaultValues.statYearsExperience}</span>
                <span className="text-sm text-text-muted font-bold uppercase tracking-wider">de Experiência Sólida</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 lg:py-20 bg-background-light">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col items-center mb-10 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-white border border-gray-200 text-text-muted text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
                Apresentação Pessoal
              </span>
              <h2 className="text-3xl font-bold text-text-main">{content.videoTitle || defaultValues.videoTitle}</h2>
            </div>
            <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black group cursor-pointer border-4 border-white ring-1 ring-gray-200 transform hover:scale-[1.01] transition-transform duration-500">
                {content.videoUrl ? (
                    <iframe src={`https://www.youtube.com/embed/${new URL(content.videoUrl).searchParams.get('v')}`} title={content.videoTitle || ''} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${defaultValues.videoImageUrl}")` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:via-black/30 transition-colors duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="relative flex items-center justify-center group/play">
                            <div className="absolute size-24 md:size-32 rounded-full bg-primary/20 animate-[ping_2s_linear_infinite]"></div>
                            <div className="absolute size-24 md:size-32 rounded-full bg-primary/10 animate-[ping_2s_linear_infinite_0.5s]"></div>
                            <div className="relative size-20 md:size-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/40 flex items-center justify-center transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-primary group-hover/play:border-primary shadow-[0_0_40px_rgba(195,231,56,0.4)]">
                                <span className="material-symbols-outlined text-white text-5xl md:text-6xl ml-2 group-hover/play:text-black transition-colors">play_arrow</span>
                            </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
          </div>
        </section>
        <section className="w-full py-16 lg:py-24 bg-white">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold text-text-main mb-4">Meus Valores e Princípios</h2>
                <p className="text-text-muted text-lg">Os pilares que sustentam minha conduta profissional e garantem a segurança do seu investimento.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-3xl bg-background-light border border-transparent hover:border-primary/30 hover:shadow-card transition-all duration-300 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="size-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-3">{content.value1Title || defaultValues.value1Title}</h3>
                  <p className="text-text-muted leading-relaxed text-sm">{content.value1Description || defaultValues.value1Description}</p>
                </div>
              </div>
              <div className="group p-8 rounded-3xl bg-background-light border border-transparent hover:border-primary/30 hover:shadow-card transition-all duration-300 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="size-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">person_check</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-3">{content.value2Title || defaultValues.value2Title}</h3>
                  <p className="text-text-muted leading-relaxed text-sm">{content.value2Description || defaultValues.value2Description}</p>
                </div>
              </div>
              <div className="group p-8 rounded-3xl bg-background-light border border-transparent hover:border-primary/30 hover:shadow-card transition-all duration-300 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="size-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">auto_graph</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-3">{content.value3Title || defaultValues.value3Title}</h3>
                  <p className="text-text-muted leading-relaxed text-sm">{content.value3Description || defaultValues.value3Description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 lg:py-24 bg-background-light border-y border-gray-100">
          <div className="layout-container max-w-[1280px] mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-secondary"></span>
                <span className="text-secondary font-bold tracking-wider uppercase text-sm">Onde Atuo</span>
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-8">Regiões que Domino</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {(content.areas?.length ? content.areas : defaultValues.areas).map(area => (
                    <div key={area} className="flex flex-col p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-primary transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">apartment</span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">SP</span>
                        </div>
                        <span className="font-bold text-text-main group-hover:text-primary transition-colors">{area}</span>
                    </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-secondary"></span>
                <span className="text-secondary font-bold tracking-wider uppercase text-sm">Meus Diferenciais</span>
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-8">Por que confiar em mim?</h2>
              <div className="space-y-6">
                <div className="flex gap-5 group">
                  <div className="shrink-0 size-14 rounded-2xl bg-white border border-gray-100 text-text-main flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                    <span className="material-symbols-outlined">handshake</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">Negociação "Harvard"</h4>
                    <p className="text-text-muted text-sm mt-1 leading-relaxed">
                      Certificado em negociação complexa, garanto que seus interesses sejam defendidos com técnica e firmeza para obter o melhor "deal".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-white">
          <div className="layout-container max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col items-center text-center gap-2 mb-10">
              <span className="material-symbols-outlined text-4xl text-primary mb-2">military_tech</span>
              <h2 className="text-2xl font-bold text-text-main">Meus Reconhecimentos</h2>
              <p className="text-text-muted max-w-lg">Prêmios que validam a dedicação individual e o compromisso com a excelência que entrego a cada cliente.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {(content.awards?.length ? content.awards : defaultValues.awards).map(award => (
                <div key={award.title} className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-100 rounded-xl w-40 hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-background-light group">
                    <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-primary transition-colors">trophy</span>
                    <div className="text-center">
                    <span className="block text-xs text-gray-400 font-bold uppercase">{award.yearOrEntity}</span>
                    <span className="block text-sm font-bold text-text-main">{award.title}</span>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-20 bg-text-main relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-10" style={{backgroundImage: "radial-gradient(#c3e738 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
          <div className="layout-container max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-black mb-6">Vamos conversar sobre seu futuro?</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Agende uma consultoria diretamente comigo. Sem intermediários, apenas uma conversa franca sobre seus objetivos imobiliários.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="h-14 px-8 rounded-full bg-primary hover:bg-primary-hover text-black text-base font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">calendar_month</span>
                Agendar Reunião Pessoal
              </button>
            </div>
          </div>
        </section>
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}

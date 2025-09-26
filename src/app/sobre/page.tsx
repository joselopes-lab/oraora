
import PublicLayout from '@/components/public-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre o Oraora | Revolucionando o Mercado Imobiliário',
  description: 'Conheça a missão, visão e valores da Oraora, a plataforma que conecta construtoras, imóveis e clientes com tecnologia e transparência.',
};


export default function SobrePage() {
    const valores = [
        { title: "Transparência", description: "Acreditamos em relações claras e confiáveis." },
        { title: "Inovação", description: "Buscamos sempre novas formas de melhorar a experiência imobiliária." },
        { title: "Colaboração", description: "Crescemos juntos com corretores, construtoras e clientes." },
        { title: "Agilidade", description: "Rapidez e eficiência fazem parte da nossa essência." },
        { title: "Confiança", description: "Segurança e seriedade em cada conexão realizada." },
    ];

    return (
        <PublicLayout>
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-secondary/30 py-20 md:py-32">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Sobre o Oraora</h1>
                        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                           Conectando corretores, construtoras e clientes com tecnologia, agilidade e transparência.
                        </p>
                    </div>
                </section>

                {/* Apresentação e Quem Somos */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Apresentação</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                O Oraora nasceu com o propósito de transformar a forma como corretores e clientes se conectam ao mercado imobiliário. Nossa plataforma integra tecnologia inteligente e automação para tornar a experiência de busca e oferta de imóveis muito mais simples, ágil e transparente.
                            </p>
                        </div>
                         <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Quem Somos</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Somos uma equipe apaixonada por inovação e pelo setor imobiliário. Unimos conhecimento técnico em tecnologia com experiência no mercado de imóveis para oferecer uma solução moderna e confiável. Nosso objetivo é dar mais autonomia aos corretores, aproximando-os de seus clientes de maneira prática e eficiente.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Missão e Visão */}
                 <section className="bg-card py-16 md:py-24">
                    <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-primary">Missão</h2>
                            <p className="text-xl text-foreground">
                                Oferecer aos corretores uma plataforma completa e automatizada que conecta construtoras, imóveis e clientes, gerando valor, praticidade e resultados.
                            </p>
                        </div>
                         <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-primary">Visão</h2>
                            <p className="text-xl text-foreground">
                                Ser referência nacional em tecnologia para o mercado imobiliário, ajudando milhares de corretores a expandirem seus negócios de forma profissional, inteligente e digital.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Valores */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Nossos Valores</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {valores.map((valor) => (
                                <div key={valor.title} className="text-center">
                                    <CheckCircle className="h-10 w-10 text-primary mx-auto mb-4"/>
                                    <h3 className="text-xl font-semibold">{valor.title}</h3>
                                    <p className="text-muted-foreground mt-2">{valor.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Manifesto */}
                 <section className="py-16 md:py-24 bg-secondary/30">
                    <div className="container mx-auto px-4 text-center max-w-4xl">
                         <h2 className="text-3xl font-bold tracking-tight mb-8">Manifesto Oraora</h2>
                         <div className="relative text-xl md:text-2xl italic text-foreground space-y-4">
                             <p className="before:content-['“'] before:absolute before:left-0 before:top-0 before:text-6xl before:text-primary/50 before:font-serif before:ml-[-1.5rem] before:mt-[-1rem] pl-4">
                                Acreditamos que o mercado imobiliário precisa ser descomplicado.
                             </p>
                             <p>Acreditamos que o corretor é peça central nesse processo e merece ferramentas inteligentes para mostrar seu valor.</p>
                             <p>Acreditamos que tecnologia é ponte, não barreira.</p>
                             <p className="font-semibold not-italic pt-4">Por isso criamos o Oraora: para dar mais tempo, mais resultados e mais liberdade a quem transforma a vida das pessoas através de imóveis.</p>
                         </div>
                    </div>
                </section>

                 {/* Propósito */}
                <section className="py-16 md:py-24 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4 text-center max-w-4xl">
                         <h2 className="text-3xl font-bold tracking-tight mb-4">Nosso Propósito</h2>
                         <p className="text-xl md:text-2xl text-primary-foreground/90">
                            Nosso propósito é revolucionar o mercado imobiliário, colocando a tecnologia a serviço do corretor para que ele possa focar no que realmente importa: atender pessoas e realizar sonhos.
                         </p>
                    </div>
                </section>


            </main>
        </PublicLayout>
    );
}

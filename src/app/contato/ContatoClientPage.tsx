'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  subject: z.string().optional(),
  message: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos.',
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function ContatoClientPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

    const siteContentRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
        [firestore]
    );
    const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ 
        logoUrl?: string;
        footerSlogan?: string,
        oraoraContato?: {
            headerTagline?: string;
            headerTitle?: string;
            headerSubtitle?: string;
            phone?: string;
            email?: string;
            addressLine1?: string;
            addressLine2?: string;
            addressHint?: string;
            instagramUrl?: string;
            linkedinUrl?: string;
            twitterUrl?: string;
        } 
    }>(siteContentRef);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            subject: 'Quero anunciar meu imóvel',
            message: '',
            terms: false,
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = await createLead({
            brokerId: 'oraora-main-site',
            name: data.name,
            email: data.email,
            phone: data.phone,
            propertyInterest: data.subject,
            message: data.message,
            source: 'Formulário de Contato',
        });

        if (result.success) {
            toast({
                title: 'Mensagem Enviada!',
                description: 'Recebemos seu contato e um de nossos especialistas retornará em breve.',
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

    const contactContent = siteData?.oraoraContato || {};

    return (
      <>
        <main className="flex-grow">
        <section className="relative pt-12 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-grid -z-10 h-full w-full"></div>
            <div className="absolute top-0 left-0 -translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="flex flex-col gap-8">
            <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-gray-200 w-fit mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{contactContent.headerTagline || 'Estamos Online'}</span>
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6" dangerouslySetInnerHTML={{__html: contactContent.headerTitle || 'Vamos conversar sobre seu <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#5fab14]">próximo imóvel?</span>'}}>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {contactContent.headerSubtitle || 'Tem alguma dúvida sobre um anúncio, precisa de ajuda para encontrar o lar ideal ou quer anunciar conosco? Nossa equipe está pronta para atender você.'}
            </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-dark-text mb-4 group-hover:bg-primary group-hover:text-dark-text transition-colors">
            <span className="material-symbols-outlined">call</span>
            </div>
            <h3 className="font-bold text-dark-text text-lg mb-1">Telefone</h3>
            <p className="text-sm text-gray-500 mb-3">Seg à Sex, 9h às 18h</p>
            <a className="text-base font-medium text-dark-text hover:text-primary transition-colors flex items-center gap-1" href={`tel:${contactContent.phone || '+551140028922'}`}>
                {contactContent.phone || '(11) 4002-8922'}
                <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </a>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-dark-text mb-4 group-hover:bg-primary group-hover:text-dark-text transition-colors">
            <span className="material-symbols-outlined">mail</span>
            </div>
            <h3 className="font-bold text-dark-text text-lg mb-1">E-mail</h3>
            <p className="text-sm text-gray-500 mb-3">Resposta em até 24h</p>
            <a className="text-base font-medium text-dark-text hover:text-primary transition-colors flex items-center gap-1" href={`mailto:${contactContent.email || 'contato@oraora.com.br'}`}>
                {contactContent.email || 'contato@oraora.com.br'}
                <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </a>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group sm:col-span-2">
            <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-dark-text flex-shrink-0 group-hover:bg-primary group-hover:text-dark-text transition-colors">
            <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
            <h3 className="font-bold text-dark-text text-lg mb-1">Escritório Principal</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
                {contactContent.addressLine1 || 'Av. Paulista, 1000 - Bela Vista'}<br/>
                {contactContent.addressLine2 || 'São Paulo - SP, 01310-100'}<br/>
                <span className="text-gray-400 text-xs mt-1 block">{contactContent.addressHint || 'Estacionamento conveniado no local'}</span>
            </p>
            </div>
            </div>
            </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Redes Sociais</span>
            <div className="h-px bg-gray-200 flex-grow"></div>
            <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-dark-text hover:text-primary hover:border-dark-text transition-all" href={contactContent.instagramUrl || '#'}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
            </a>
            <a className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-dark-text hover:text-primary hover:border-dark-text transition-all" href={contactContent.linkedinUrl || '#'}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
            </a>
            <a className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-dark-text hover:text-primary hover:border-dark-text transition-all" href={contactContent.twitterUrl || '#'}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
            </a>
            </div>
            </div>
            </div>
            <div className="relative">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-secondary-green/20 rounded-full blur-[80px] -z-10"></div>
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <h2 className="font-display text-2xl font-bold mb-6">Envie uma mensagem</h2>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Nome</FormLabel>
                        <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Telefone</FormLabel>
                        <FormControl><Input placeholder="(00) 00000-0000" type="tel" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">E-mail</FormLabel>
                    <FormControl><Input placeholder="seu@email.com" type="email" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Assunto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione um assunto" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Quero anunciar meu imóvel">Quero anunciar meu imóvel</SelectItem>
                            <SelectItem value="Tenho interesse em comprar">Tenho interesse em comprar</SelectItem>
                            <SelectItem value="Tenho interesse em alugar">Tenho interesse em alugar</SelectItem>
                            <SelectItem value="Parcerias">Parcerias</SelectItem>
                            <SelectItem value="Outros assuntos">Outros assuntos</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
                 <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Mensagem</FormLabel>
                    <FormControl><Textarea placeholder="Como podemos ajudar você hoje?" rows={4} {...field}/></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs">
                        Ao enviar, você concorda com nossa{' '}
                        <Link href="/politica-de-privacidade" className="underline hover:text-dark-text">Política de Privacidade</Link> e com os{' '}
                        <Dialog>
                            <DialogTrigger asChild>
                              <button type="button" className="underline hover:text-dark-text">Termos de Uso</button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px]">
                                <DialogHeader>
                                    <DialogTitle>Termos de Uso</DialogTitle>
                                    <DialogDescription>
                                        Última atualização: 26 de Julho de 2024
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="prose max-h-[60vh] overflow-y-auto pr-4 text-sm text-muted-foreground">
                                    <h2>1. IDENTIFICAÇÃO</h2>
                                    <p>Este site e a plataforma OraOra são operados por ORAORA SOLUÇÕES DIGITAIS INOVA SIMPLES (I.S.), pessoa jurídica inscrita no CNPJ nº 64.052.552/0001-26, com sede na Rua Rui Barbosa, nº 1486, Centro, Foz do Iguaçu/PR, e e-mail de contato contato@oraora.com.br, doravante denominada “OraOra”.</p>
                                    <h2>2. ACEITAÇÃO DOS TERMOS</h2>
                                    <p>Ao acessar, navegar, cadastrar-se ou utilizar qualquer funcionalidade do site OraOra, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a Política de Privacidade.</p>
                                    <p>Caso não concorde, o usuário deve se abster de utilizar a plataforma.</p>
                                    <h2>3. O QUE É O ORAORA</h2>
                                    <p>O OraOra é um ecossistema digital imobiliário, que atua como:</p>
                                    <ul>
                                        <li>Plataforma tecnológica (SaaS);</li>
                                        <li>Canal de distribuição de informações imobiliárias;</li>
                                        <li>Hub de visibilidade, curadoria e conexão entre corretores, construtoras e o público final.</li>
                                    </ul>
                                    <p>O OraOra não é imobiliária, não intermedeia negócios imobiliários, não participa de negociações, não recebe comissões e não firma contratos de compra, venda, locação ou promessa de imóveis.</p>
                                    <p>Toda e qualquer relação comercial ocorre diretamente entre usuários (corretores, construtoras e público final).</p>
                                    <h2>4. USUÁRIOS DA PLATAFORMA</h2>
                                    <p>A plataforma pode ser utilizada por:</p>
                                    <h3>4.1 Público Final</h3>
                                    <p>Pode navegar livremente sem cadastro.</p>
                                    <p>Algumas funcionalidades exigem criação de conta.</p>
                                    <h3>4.2 Corretores de Imóveis</h3>
                                    <p>Devem criar conta própria e comprovar registro ativo no CRECI.</p>
                                    <p>São responsáveis pelas informações, conteúdos e imóveis divulgados.</p>
                                    <h3>4.3 Construtoras</h3>
                                    <p>Possuem conta própria e são responsáveis pelas informações de seus empreendimentos.</p>
                                    <h2>5. RESPONSABILIDADE SOBRE IMÓVEIS E CONTEÚDOS</h2>
                                    <p>As informações dos imóveis são de responsabilidade exclusiva dos corretores e/ou construtoras.</p>
                                    <p>O OraOra atua apenas como plataforma de exibição, organização, curadoria e distribuição de conteúdo.</p>
                                    <p>O OraOra não garante veracidade, disponibilidade, valores, condições ou atualização dos imóveis anunciados.</p>
                                    <h2>6. MODERAÇÃO, SUSPENSÃO E EXCLUSÃO</h2>
                                    <p>O OraOra se reserva o direito de, a qualquer momento, sem aviso prévio:</p>
                                    <ul>
                                        <li>Remover anúncios;</li>
                                        <li>Excluir conteúdos;</li>
                                        <li>Suspender ou encerrar contas;</li>
                                    </ul>
                                    <p>Sempre que houver:</p>
                                    <ul>
                                        <li>Violação destes Termos;</li>
                                        <li>Uso indevido da plataforma;</li>
                                        <li>Informações falsas ou ilegais;</li>
                                        <li>Descumprimento de normas legais ou éticas.</li>
                                    </ul>
                                    <h2>7. LEADS E CONTATOS</h2>
                                    <p>Os contatos enviados pelo público final são direcionados diretamente ao corretor ou construtora responsável.</p>
                                    <p>O OraOra mantém cópia dos dados para fins operacionais, legais e de melhoria da plataforma.</p>
                                    <p>O corretor/construtora atua como <strong>Controlador</strong> dos dados dos leads.</p>
                                    <p>O OraOra atua como <strong>Operador</strong> desses dados, nos termos da LGPD.</p>
                                    <h2>8. PLANOS, PAGAMENTOS E CANCELAMENTO</h2>
                                    <p>O OraOra opera em modelo SaaS com planos mensais e renovação automática.</p>
                                    <p>O cancelamento pode ser solicitado a qualquer momento, produzindo efeitos ao final do ciclo vigente.</p>
                                    <p>Não há reembolso de valores já pagos.</p>
                                    <p>O OraOra pode alterar preços, planos e funcionalidades mediante aviso prévio.</p>
                                    <p>Novos planos, produtos ou serviços pagos podem ser criados a qualquer tempo.</p>
                                    <h2>9. PROPRIEDADE INTELECTUAL</h2>
                                    <p>Todo o conteúdo da plataforma (marca, layout, sistema, textos, códigos, funcionalidades) pertence ao OraOra ou a seus licenciantes, sendo vedada qualquer reprodução sem autorização.</p>
                                    <h2>10. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                                    <p>O OraOra não se responsabiliza por:</p>
                                    <ul>
                                        <li>Negociações imobiliárias;</li>
                                        <li>Atos praticados por usuários;</li>
                                        <li>Perdas financeiras decorrentes de contratos entre terceiros;</li>
                                        <li>Indisponibilidade temporária da plataforma.</li>
                                    </ul>
                                    <h2>11. ALTERAÇÕES DOS TERMOS</h2>
                                    <p>Estes Termos podem ser alterados a qualquer momento. O uso contínuo da plataforma implica aceitação das novas versões.</p>
                                    <h2>12. FORO</h2>
                                    <p>Fica eleito o foro da Comarca de João Pessoa/PB, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button">Fechar</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          .
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            <div className="pt-2">
                <Button disabled={isSubmitting} className="w-full bg-primary text-black font-bold py-4 px-6 rounded-xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg group" type="submit">
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    {!isSubmitting && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">send</span>}
                </Button>
            </div>
            </form>
            </Form>
            </div>
            </div>
            </div>
            </div>
            </section>
        </main>
        <footer className="bg-surface pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#">Instagram</a>
        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#">LinkedIn</a>
        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#">Twitter</a>
        </div>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a className="hover:text-primary transition-colors" href="/imoveis">Comprar</a></li>
            <li><a className="hover:text-primary transition-colors" href="/imoveis">Lançamentos</a></li>
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
            <li><a className="hover:text-primary transition-colors" href="#">Política de Cookies</a></li>
          </ul>
        </div>
        </div>
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200">
                    <Link href="/login" className="flex items-center gap-2">
                        <span className="material-symbols-outlined">manage_accounts</span>
                        Área do corretor
                    </Link>
                </Button>
                <Link href="/corretor" className="text-xs text-gray-400 hover:text-primary transition-colors">Desenvolvido por <strong>Oraora</strong></Link>
            </div>
        </div>
        </div>
        </footer>
      </>
    )
}
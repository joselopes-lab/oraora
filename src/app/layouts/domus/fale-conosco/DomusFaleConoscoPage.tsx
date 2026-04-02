'use client';
/**
 * @fileOverview Página de Contato exclusiva para o template Domus.
 * Segue fielmente o layout solicitado com suporte a captura de leads.
 */

import { DomusHeader } from '../components/DomusHeader';
import { DomusFooter } from '../components/DomusFooter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { WhatsAppWidget } from '@/app/sites/urban-padrao/components/WhatsAppWidget';
import Image from 'next/image';
import Link from 'next/link';

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
  homepage?: {
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
    mapSectionBgColor?: string;
    mapTitleColor?: string;
    mapTextColor?: string;
    mapButtonBgColor?: string;
    mapButtonTextColor?: string;
  };
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
};

type DomusFaleConoscoPageProps = {
  broker: Broker;
};

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  subject: z.string().min(1, 'Selecione um assunto.'),
  message: z.string().min(1, 'A mensagem não pode estar vazia.'),
});

type FormData = z.infer<typeof formSchema>;

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

export default function DomusFaleConoscoPage({ broker }: DomusFaleConoscoPageProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = broker.homepage || {};

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: 'Interesse em Comprar',
      message: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = await createLead({
      brokerId: broker.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      propertyInterest: data.subject,
      message: data.message,
      source: 'Formulário de Contato Domus',
    });

    if (result.success) {
      toast({
        title: 'Mensagem Enviada!',
        description: 'Recebemos seu contato e retornaremos em breve.',
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

  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
    '--cta-button-bg': content.ctaButtonBgColor ? `hsl(${content.ctaButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-button-text': content.ctaButtonTextColor ? `hsl(${content.ctaButtonTextColor})` : 'hsl(var(--secondary))',
    '--cta-section-bg': content.ctaSectionBgColor ? `hsl(${content.ctaSectionBgColor})` : 'hsl(var(--secondary))',
    '--cta-section-title': content.ctaSectionTitleColor ? `hsl(${content.ctaSectionTitleColor})` : '#fff',
    '--cta-section-subtitle': content.ctaSectionSubtitleColor ? `hsl(${content.ctaSectionSubtitleColor})` : 'rgba(255,255,255,0.6)',
    '--cta-section-button-bg': content.ctaSectionButtonBgColor ? `hsl(${content.ctaSectionButtonBgColor})` : 'hsl(var(--primary))',
    '--cta-section-button-text': content.ctaSectionButtonTextColor ? `hsl(${content.ctaSectionButtonTextColor})` : 'hsl(var(--secondary))',
    '--map-section-bg': content.mapSectionBgColor ? `hsl(${content.mapSectionBgColor})` : '#f3f4f1',
    '--map-title-color': content.mapTitleColor ? `hsl(${content.mapTitleColor})` : '#111827',
    '--map-text-color': content.mapTextColor ? `hsl(${content.mapTextColor})` : '#4b5563',
    '--map-button-bg': content.mapButtonBgColor ? `hsl(${content.mapButtonBgColor})` : '#1e293b',
    '--map-button-text': content.mapButtonTextColor ? `hsl(${content.mapButtonTextColor})` : '#ffffff',
  } as React.CSSProperties;

  const whatsappLink = broker.whatsappUrl?.replace('wa.me.com.br', 'wa.me') || '#';

  return (
    <div style={dynamicStyles} className="domus-theme font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <style jsx>{`
        .neon-glow:hover {
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
        }
        .bg-mesh {
            background-image: radial-gradient(at 0% 0%, hsl(var(--secondary) / 0.05) 0%, transparent 50%),
                              radial-gradient(at 100% 100%, hsl(var(--secondary) / 0.05) 0%, transparent 50%);
        }
      `}</style>
      
      <DomusHeader broker={broker as any} />
      
      <main className="bg-mesh min-h-screen pt-20">
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider mb-6">
                CONTATO
            </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
                Vamos encontrar seu <br/>
            <span className="text-primary italic">próximo lar juntos.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
                Tem alguma dúvida ou quer agendar uma consultoria personalizada? Nossa equipe está pronta para te atender com tecnologia e exclusividade.
            </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-24">
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined">alternate_email</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">E-mail</h3>
                  <p className="text-xl font-semibold">{broker.footerContactEmail || 'contato@oraora.com.br'}</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined">phone_iphone</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone / WhatsApp</h3>
                  <p className="text-xl font-semibold">{broker.footerContactPhone || '+55 (83) 99999-0000'}</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Endereço</h3>
                  <p className="text-xl font-semibold">{broker.footerContactAddress || 'Endereço não informado'}</p>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Siga-nos</h3>
              <div className="flex gap-4">
                {broker.instagramUrl && (
                  <a className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all" href={broker.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                  </a>
                )}
                {broker.linkedinUrl && (
                  <a className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all" href={broker.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-bold" placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-bold" placeholder="seu@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <Input className="w-full bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-bold" placeholder="(00) 00000-0000" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Assunto</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none appearance-none font-bold">
                            <option>Interesse em Comprar</option>
                            <option>Quero Vender meu Imóvel</option>
                            <option>Dúvidas Jurídicas</option>
                            <option>Outros</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sua Mensagem</FormLabel>
                        <FormControl>
                          <Textarea className="w-full bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-xl px-4 py-3.5 transition-all outline-none font-bold" placeholder="Como podemos te ajudar?" rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <Button disabled={isSubmitting} className="w-full bg-primary text-secondary py-4 rounded-xl font-bold uppercase tracking-widest text-sm neon-glow transition-all h-14" type="submit" style={{ color: 'var(--secondary)' }}>
                      {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-24">
            <div className="rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--cta-section-bg)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-[800px] mx-auto flex flex-col gap-8 items-center">
                    <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight" style={{ color: 'var(--cta-section-title)' }}>{content.ctaTitle || 'Pronto para encontrar seu próximo lar?'}</h2>
                    <p className="text-xl" style={{ color: 'var(--cta-section-subtitle)' }}>{content.ctaSubtitle || 'Agende uma consultoria personalizada agora mesmo via WhatsApp.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto px-4">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-3 rounded-full h-16 px-10 text-lg font-black shadow-lg hover:scale-[1.05] transition-all uppercase tracking-widest" style={{ backgroundColor: 'var(--cta-section-button-bg)', color: 'var(--cta-section-button-text)' }}>
                            <span className="material-symbols-outlined font-bold">chat</span>
                            FALAR NO WHATSAPP
                        </a>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <DomusFooter broker={broker as any} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}

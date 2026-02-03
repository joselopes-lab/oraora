'use client';
import { UrbanPadraoHeader } from '@/layouts/urban-padrao/components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '@/layouts/urban-padrao/components/UrbanPadraoFooter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';

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
};

type FaleConoscoPageProps = {
  broker: Broker;
};

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

export default function FaleConoscoClientPage({ broker }: FaleConoscoPageProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: 'Estou interessado em comprar',
      message: '',
      terms: false,
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
    });

    if (result.success) {
      toast({
        title: 'Mensagem Enviada!',
        description: result.message,
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
    '--background': broker.backgroundColor,
    '--foreground': broker.foregroundColor,
    '--primary': broker.primaryColor,
    '--secondary': broker.secondaryColor,
    '--accent': broker.accentColor,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex flex-col items-center pb-20">
        <div className="w-full bg-white py-12 lg:py-16 border-b border-[#f0f2f4]">
          <div className="layout-container max-w-[1280px] mx-auto px-6 text-center">
            <nav className="flex justify-center text-sm text-text-muted mb-6">
              <a className="hover:text-primary mr-2" href={`/sites/${broker.slug}`}>Início</a> /
              <span className="text-text-main font-medium ml-2">Fale Conosco</span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-black text-text-main mb-6 tracking-tight">Vamos conversar?</h1>
            <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
              Estamos prontos para atender você. Entre em contato para agendar uma visita exclusiva, tirar dúvidas sobre financiamento ou encontrar o imóvel dos seus sonhos.
            </p>
          </div>
        </div>
        <div className="w-full max-w-[1280px] px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-soft border border-gray-100">
              <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                Canais de Atendimento
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all hover:shadow-md">
                  <div className="bg-[#25D366] text-white p-3 rounded-full shrink-0 shadow-lg shadow-green-200">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">WhatsApp</p>
                    <p className="text-lg font-black text-text-main">(11) 99999-9999</p>
                  </div>
                  <button className="w-full sm:w-auto text-sm font-bold text-white bg-[#25D366] px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                    Iniciar
                  </button>
                </div>
                <div className="h-px bg-gray-100 w-full"></div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">phone_in_talk</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Telefone</p>
                    <p className="text-base font-bold text-text-main">(11) 3333-3333</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div className="break-all">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">E-mail</p>
                    <p className="text-base font-bold text-text-main">contato@corretorpremium.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">pin_drop</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Escritório Central</p>
                    <p className="text-base font-medium text-text-main">Av. Paulista, 1000 - Bela Vista<br />São Paulo - SP</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden h-64 lg:h-80 w-full bg-gray-200 relative shadow-soft group border border-gray-200">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFSXKPYHVcn6bMCHX6E36kKsWYH-Jrnidp5qgbqRJGbl2tdlfAHRWGgw_BH0FSGiuPAeKoFjGKd4iIxXaS7RDxBjhDpxchyUI6ZBIYy7at-GoSMkswUwLtYY2J431RQH8lRwvQ71Fextok_2cbHyuBu2WkdM3MerdFb1zeCcIMCEPpddgbOA9bubnLDWwsPuexTRzdQSnvapPmcLOzJ-pHK_tWJ-1E5X7glsU1dhw3RJ7oeECQqHntdfmjefwEy47loPNgWOSqzY0")`, filter: 'grayscale(100%) brightness(1.1)' }}></div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl shadow-float flex flex-col items-center transform transition-transform group-hover:-translate-y-1">
                  <span className="material-symbols-outlined text-red-500 text-4xl mb-2 animate-bounce">location_on</span>
                  <span className="font-bold text-text-main text-sm">Visite nosso escritório</span>
                  <button className="mt-3 text-xs font-bold text-primary bg-black px-4 py-2 rounded-full hover:bg-gray-900 transition-colors shadow-lg shadow-black/20">
                    Abrir no Google Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-card border border-gray-100 h-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-main mb-2">Envie uma Mensagem Direta</h2>
                <p className="text-text-muted text-sm">Preencha os campos abaixo. Nossa equipe retornará seu contato em até 24 horas.</p>
              </div>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-main ml-1" htmlFor="name">Nome Completo</label>
                    <input {...form.register('name')} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" id="name" placeholder="Digite seu nome" type="text" />
                     {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-main ml-1" htmlFor="phone">Telefone / WhatsApp</label>
                    <input {...form.register('phone')} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" id="phone" placeholder="(DDD) 00000-0000" type="tel" />
                     {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-main ml-1" htmlFor="email">E-mail Principal</label>
                  <input {...form.register('email')} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" id="email" placeholder="exemplo@email.com" type="email" />
                   {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-main ml-1" htmlFor="subject">Assunto de Interesse</label>
                  <div className="relative">
                    <select {...form.register('subject')} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 appearance-none transition-all focus:bg-white cursor-pointer text-text-main" id="subject">
                      <option>Estou interessado em comprar</option>
                      <option>Quero vender meu imóvel</option>
                      <option>Dúvidas sobre financiamento</option>
                      <option>Agendar visita</option>
                      <option>Outros assuntos</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-main ml-1" htmlFor="message">Sua Mensagem</label>
                  <textarea {...form.register('message')} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-40 resize-none p-4 transition-all focus:bg-white" id="message" placeholder={`Olá, gostaria de saber mais informações sobre...`}></textarea>
                </div>
                <div className="flex items-start gap-3 mt-2 mb-2">
                  <input {...form.register('terms')} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" id="terms" type="checkbox" />
                  <div>
                    <label className="text-xs text-text-muted leading-relaxed" htmlFor="terms">
                        Concordo com a <a className="underline hover:text-primary font-medium" href="#">Política de Privacidade</a> e autorizo o contato via WhatsApp ou e-mail.
                    </label>
                    {form.formState.errors.terms && <p className="text-xs text-red-500 mt-1">{form.formState.errors.terms.message}</p>}
                  </div>
                </div>
                <button disabled={isSubmitting} className="mt-2 w-full h-14 rounded-xl bg-black text-primary font-bold text-base hover:bg-gray-900 shadow-xl shadow-black/10 transition-all transform active:scale-95 flex items-center justify-center gap-3 group" type="submit">
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem Agora'}
                  {!isSubmitting && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}

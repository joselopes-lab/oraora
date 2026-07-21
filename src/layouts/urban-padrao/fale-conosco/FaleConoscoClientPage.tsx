'use client';
/**
 * @fileOverview Página de Contato do template Urban Padrão.
 * Atualizada para priorizar dados do objeto oraoraContato e garantir estabilidade no cliente.
 */
import { UrbanPadraoHeader } from '@/layouts/urban-padrao/components/UrbanPadraoHeader';
import { UrbanPadraoFooter } from '@/layouts/urban-padrao/components/UrbanPadraoFooter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { WhatsAppWidget } from '@/layouts/urban-padrao/components/WhatsAppWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
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
  layoutId?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
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
  };
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
    try {
      const result = await createLead({
        brokerId: broker.id,
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
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha na conexão',
        description: 'Não foi possível enviar sua mensagem agora.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const dynamicStyles = {
    '--background': broker.backgroundColor || '90 20% 97%',
    '--foreground': broker.foregroundColor || '110 16% 8%',
    '--primary': broker.primaryColor || '80 99% 49%',
    '--secondary': broker.secondaryColor || '110 16% 8%',
    '--accent': broker.accentColor || '97 78% 56%',
  } as React.CSSProperties;

  const contactContent = broker.oraoraContato || {};
  const mapAddress = contactContent.addressLine1 || broker.footerContactAddress;
  const mapUrl = mapAddress 
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`
    : null;

  return (
    <div style={dynamicStyles} className="urban-padrao-theme relative flex min-h-screen w-full flex-col group/design-root">
      <UrbanPadraoHeader broker={broker} />
      <main className="flex-1 w-full flex flex-col items-center pb-20">
        <div className="w-full bg-white py-12 lg:py-16 border-b border-[#f0f2f4]">
          <div className="layout-container max-w-[1280px] mx-auto px-6 text-center">
            <nav className="flex justify-center text-sm text-text-muted mb-6">
              <Link className="hover:text-primary mr-2" href={`/sites/${broker.slug}`}>Início</Link> /
              <span className="text-text-main font-medium ml-2">Fale Conosco</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-800 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                {contactContent.headerTagline || 'Atendimento Exclusivo'}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-text-main mb-6 tracking-tight" dangerouslySetInnerHTML={{ __html: contactContent.headerTitle || 'Vamos conversar?' }}></h1>
            <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
              {contactContent.headerSubtitle || 'Estamos prontos para atender você. Entre em contato para agendar uma visita exclusiva, tirar dúvidas sobre financiamento ou encontrar o imóvel dos seus sonhos.'}
            </p>
          </div>
        </div>
        <div className="w-full max-w-[1280px] px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">WhatsApp</p>
                    <p className="text-lg font-black text-text-main truncate">{contactContent.phone || broker.footerContactPhone || '(11) 99999-9999'}</p>
                  </div>
                  <a href={`https://wa.me/55${(contactContent.phone || broker.footerContactPhone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-sm font-bold text-white bg-[#25D366] px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors shadow-sm text-center">
                    Iniciar
                  </a>
                </div>
                <div className="h-px bg-gray-100 w-full"></div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">phone_in_talk</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Telefone</p>
                    <p className="text-base font-bold text-text-main">{contactContent.phone || broker.footerContactPhone || '(11) 3333-3333'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div className="break-all">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">E-mail</p>
                    <p className="text-base font-bold text-text-main">{contactContent.email || broker.footerContactEmail || 'contato@broker.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-3 rounded-full text-text-main shrink-0">
                    <span className="material-symbols-outlined">pin_drop</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Localização</p>
                    <p className="text-base font-medium text-text-main">
                        {contactContent.addressLine1 || broker.footerContactAddress || 'Endereço não informado'}
                        {contactContent.addressLine2 && <><br/>{contactContent.addressLine2}</>}
                    </p>
                    {contactContent.addressHint && <p className="text-xs text-text-muted mt-1 italic">{contactContent.addressHint}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden h-64 lg:h-80 w-full bg-gray-50 relative shadow-soft group border border-gray-100">
              {mapUrl ? (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale dark:invert opacity-80"
                ></iframe>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-8 text-center">
                  <span className="material-symbols-outlined text-4xl">map</span>
                  <p className="text-sm font-medium">Localização não informada no cadastro.</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-card border border-gray-100 h-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-main mb-2">Envie uma Mensagem Direta</h2>
                <p className="text-text-muted text-sm">Preencha os campos abaixo. Nossa equipe retornará seu contato em até 24 horas.</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-text-main ml-1">Nome Completo</FormLabel>
                          <FormControl>
                            <Input className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" placeholder="Digite seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-text-main ml-1">Telefone / WhatsApp</FormLabel>
                          <FormControl>
                            <Input className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" placeholder="(DDD) 00000-0000" type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-text-main ml-1">E-mail Principal</FormLabel>
                        <FormControl>
                          <Input className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 transition-all focus:bg-white" placeholder="exemplo@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-text-main ml-1">Assunto de Interesse</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <select {...field} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-12 px-4 appearance-none transition-all focus:bg-white cursor-pointer text-text-main">
                              <option value="Estou interessado em comprar">Estou interessado em comprar</option>
                              <option value="Quero vender meu imóvel">Quero vender meu imóvel</option>
                              <option value="Dúvidas sobre financiamento">Dúvidas sobre financiamento</option>
                              <option value="Agendar visita">Agendar visita</option>
                              <option value="Outros assuntos">Outros assuntos</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                              <span className="material-symbols-outlined">expand_more</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-text-main ml-1">Sua Mensagem</FormLabel>
                        <FormControl>
                          <Textarea className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary h-40 resize-none p-4 transition-all focus:bg-white" placeholder={`Olá, gostaria de saber mais informações sobre...`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3 mt-2 mb-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-xs text-text-muted leading-relaxed">
                              Ao enviar, você concorda com nossa <Link href="/politica-de-privacidade" className="underline hover:text-primary font-medium">Política de Privacidade</Link> e com os <Link href="/termos-de-uso" className="underline hover:text-primary font-medium">Termos de Uso</Link>.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <button disabled={isSubmitting} className="mt-2 w-full h-14 rounded-xl bg-black text-primary font-bold text-base hover:bg-gray-900 shadow-xl shadow-black/10 transition-all transform active:scale-95 flex items-center justify-center gap-3 group border-none cursor-pointer" type="submit">
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensagem Agora'}
                    {!isSubmitting && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>}
                  </button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
      <UrbanPadraoFooter broker={broker} />
      <WhatsAppWidget brokerId={broker.id} />
    </div>
  );
}

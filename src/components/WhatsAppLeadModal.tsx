'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { getStoredCampaignData } from '@/lib/campaign';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
});

type LeadFormData = z.infer<typeof leadSchema>;

type WhatsAppLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  broker: any;
  property?: any;
  source?: string;
  origin?: string;
};

export function WhatsAppLeadModal({ isOpen, onClose, broker, property, source = 'property_whatsapp', origin = 'whatsapp' }: WhatsAppLeadModalProps) {
  const { toast } = useToast();
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const hasWhatsApp = broker?.hasWhatsApp !== false && Boolean(broker?.whatsappNumber || broker?.hasWhatsApp);
  const brokerFirstName = broker?.displayName?.split(' ')[0] || broker?.name?.split(' ')[0] || 'Corretor';

  const onSubmit = async (data: LeadFormData) => {
    if (isSubmitting) return;

    const leadData: any = {
      brokerId: broker?.brokerId || broker?.id || '',
      name: data.name.trim(),
      email: `${data.phone.replace(/\D/g, '')}@whatsapp.lead`,
      phone: data.phone.trim(),
      source: source || 'property_whatsapp',
      origin: hasWhatsApp ? 'whatsapp' : 'form',
      message: property 
        ? `Lead interessado no imóvel: ${property.informacoesbasicas?.nome || property.id}`
        : 'Lead capturado pela página pública.',
    };

    const campaignData = getStoredCampaignData();
    if (campaignData) {
      leadData.campaignData = campaignData;
    }

    if (property) {
      leadData.propertyId = property.id;
      leadData.propertyName = property.informacoesbasicas?.nome;
      leadData.pageType = 'property';
      leadData.pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    }

    // O servidor valida a titularidade do imóvel, normaliza o contato e registra o lead
    const result = await createLead(leadData);

    if (result.success) {
      trackEvent('generate_lead', {
        propertyId: property?.id,
        origin: origin,
        tipo_contato: result.whatsappAvailable ? 'whatsapp' : 'form',
      });

      if (result.whatsappAvailable && result.whatsappUrl) {
        trackEvent('whatsapp_click', {
          propertyId: property?.id,
          origin: origin,
        });

        toast({
          title: 'Contato Enviado!',
          description: 'Redirecionando para o WhatsApp do corretor...',
        });

        form.reset();
        onClose();
        
        window.location.href = result.whatsappUrl;
      } else {
        toast({
          title: 'Interesse Registrado!',
          description: result.message || 'Seus dados foram enviados com sucesso. O corretor responsável entrará em contato em breve.',
        });

        form.reset();
        onClose();
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: result.message || 'Não foi possível registrar seu contato. Tente novamente mais tarde.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{hasWhatsApp ? 'chat_bubble' : 'contact_mail'}</span>
              <h3 className="text-sm font-bold uppercase tracking-tight">
                {hasWhatsApp ? 'Fale Conosco via WhatsApp' : `Falar com ${brokerFirstName}`}
              </h3>
          </div>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            {hasWhatsApp 
              ? 'Preencha seus dados abaixo para iniciar a conversa direta no WhatsApp.' 
              : `Deixe seus dados abaixo para que ${brokerFirstName} entre em contato com você.`}
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name-modal-shared" className="sr-only">Nome</label>
              <input
                {...form.register('name')}
                id="name-modal-shared"
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-slate-900 focus:ring-slate-900 text-sm text-slate-900 outline-none"
                placeholder="Seu nome"
              />
              {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="phone-modal-shared" className="sr-only">Telefone</label>
              <input
                {...form.register('phone')}
                id="phone-modal-shared"
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-slate-900 focus:ring-slate-900 text-sm text-slate-900 outline-none"
                placeholder="(DDD) Telefone ou Celular"
              />
              {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-12 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md",
                hasWhatsApp ? "bg-[#25D366] hover:bg-[#20ba5a]" : "bg-slate-900 hover:bg-black",
                isSubmitting && "opacity-75 cursor-not-allowed"
              )}
            >
              {isSubmitting 
                ? 'Enviando...' 
                : hasWhatsApp ? 'Iniciar Conversa' : 'Enviar Solicitação'}
              {!isSubmitting && (
                <span className="material-symbols-outlined text-lg">
                  {hasWhatsApp ? 'send' : 'check'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

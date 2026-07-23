
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '@/app/sites/actions';
import { useToast } from '@/hooks/use-toast';

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
  source: string;
  origin: string;
};

function getWhatsAppNumber(broker: any): string | null {
  if (!broker) return null;
  const fields = ['whatsapp', 'phone', 'contactPhone', 'mobilePhone', 'footerContactPhone'];
  let rawPhone = '';
  
  for (const field of fields) {
    if (broker[field] && typeof broker[field] === 'string' && broker[field].trim() !== '') {
      rawPhone = broker[field];
      break;
    }
  }
  
  if (!rawPhone) return null;
  
  const cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.length < 10) return null;
  
  return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
}

export function WhatsAppLeadModal({ isOpen, onClose, broker, property, source, origin }: WhatsAppLeadModalProps) {
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

  const onSubmit = async (data: LeadFormData) => {
    const waNumber = getWhatsAppNumber(broker);
    
    if (!waNumber) {
      toast({
        variant: 'destructive',
        title: 'WhatsApp não disponível',
        description: 'Este corretor ainda não possui um número de WhatsApp cadastrado.',
      });
      return;
    }

    const leadData: any = {
      brokerId: broker.id,
      name: data.name,
      email: `${data.phone.replace(/\D/g, '')}@whatsapp.lead`,
      phone: data.phone,
      source: source,
      origin: origin,
      message: property 
        ? `Lead interessado no imóvel: ${property.informacoesbasicas.nome}`
        : 'Lead capturado pelo widget do WhatsApp.',
    };

    if (property) {
      leadData.propertyId = property.id;
      leadData.propertyName = property.informacoesbasicas.nome;
      leadData.pageType = 'property';
      leadData.pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    }

    const result = await createLead(leadData);

    if (result.success) {
      const propertyName = property?.informacoesbasicas?.nome;
      const message = propertyName
        ? `Olá!\n\nMeu nome é ${data.name}.\n\nTenho interesse em saber mais sobre o empreendimento "${propertyName}".\n\nPoderia me passar mais informações?`
        : `Olá! Meu nome é ${data.name} e gostaria de mais informações.`;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      
      toast({
        title: 'Contato Enviado!',
        description: 'Redirecionando para o WhatsApp...',
      });
      
      form.reset();
      onClose();
      
      window.location.href = waUrl;
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: result.message,
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
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">chat_bubble</span>
              <h3 className="text-sm font-bold">Fale Conosco via WhatsApp</h3>
          </div>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Preencha seus dados abaixo para iniciar a conversa.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name-modal-shared" className="sr-only">Nome</label>
              <input
                {...form.register('name')}
                id="name-modal-shared"
                className="w-full h-11 px-3 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm text-black"
                placeholder="Seu nome"
              />
              {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="phone-modal-shared" className="sr-only">Telefone</label>
              <input
                {...form.register('phone')}
                id="phone-modal-shared"
                className="w-full h-11 px-3 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm text-black"
                placeholder="(DDD) Telefone"
              />
              {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-lg"
            >
              {isSubmitting ? 'Enviando...' : 'Iniciar Conversa'}
              {!isSubmitting && <span className="material-symbols-outlined text-lg">send</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

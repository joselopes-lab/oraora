
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLead } from '../../../app/sites/actions';
import { useToast } from '@/hooks/use-toast';

const leadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
});

type LeadFormData = z.infer<typeof leadSchema>;

type WhatsAppWidgetProps = {
  brokerId: string;
};

export function WhatsAppWidget({ brokerId }: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    const result = await createLead({
      brokerId: brokerId,
      name: data.name,
      email: `${data.phone.replace(/\D/g, '')}@whatsapp.lead`, // Create a placeholder email
      phone: data.phone,
      source: 'WhatsApp',
      message: 'Lead capturado pelo widget do WhatsApp.',
    });

    if (result.success) {
      toast({
        title: 'Contato Enviado!',
        description: 'Recebemos seus dados. Entraremos em contato em breve!',
      });
      form.reset();
      setIsOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: result.message,
      });
    }
  };

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <button
          aria-label="Chat on WhatsApp"
          className="flex items-center justify-center size-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </button>
      </div>

      <div
        className={`fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col">
          <div className="bg-gray-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">chat_bubble</span>
                <h3 className="text-sm font-bold">Fale Conosco via WhatsApp</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
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
                <label htmlFor="name-whatsapp" className="sr-only">Nome</label>
                <input
                  {...form.register('name')}
                  id="name-whatsapp"
                  className="w-full h-11 px-3 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm"
                  placeholder="Seu nome"
                />
                {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="phone-whatsapp" className="sr-only">Telefone</label>
                <input
                  {...form.register('phone')}
                  id="phone-whatsapp"
                  className="w-full h-11 px-3 rounded-lg border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary text-sm"
                  placeholder="(DDD) Telefone"
                />
                {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:text-black border border-transparent hover:border-gray-200 transition-colors"
              >
                {isSubmitting ? 'Enviando...' : 'Iniciar Conversa'}
                {!isSubmitting && <span className="material-symbols-outlined text-lg">send</span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

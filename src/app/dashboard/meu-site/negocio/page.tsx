'use client';

import { useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const businessSettingsSchema = z.object({
  enabledTransactions: z.array(z.string()).min(1, "Selecione pelo menos uma modalidade."),
});

type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;

type BrokerData = {
    businessSettings?: BusinessSettingsFormData;
};

export default function EditBusinessSettingsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const brokerDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user?.uid]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const form = useForm<BusinessSettingsFormData>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      enabledTransactions: ['sale', 'rent'],
    },
  });

  useEffect(() => {
    if (brokerData?.businessSettings) {
      form.reset(brokerData.businessSettings);
    }
  }, [brokerData, form]);

  const onSubmit = (data: BusinessSettingsFormData) => {
    if (!brokerDocRef || !user) return;

    setDocumentNonBlocking(brokerDocRef, { businessSettings: data }, { merge: true });
    toast({
      title: "Configurações Salvas!",
      description: "Suas modalidades de negócio foram atualizadas com sucesso.",
    });
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Carregando configurações...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500 text-left">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Voltar para Gerenciar Site
              </Link>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Negócio Imobiliário</h1>
              <p className="text-slate-500 mt-1">Configure as modalidades de transação que seu site deve suportar.</p>
            </div>
            <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="bg-primary hover:bg-primary-hover text-slate-900 px-8 h-12 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg border-none"
              >
                Salvar Alterações
            </Button>
          </div>

          <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-hover">
                <Building2 className="size-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Modalidades de Trabalho</h2>
            </div>
            
            <div className="space-y-8">
              <FormField
                control={form.control}
                name="enabledTransactions"
                render={() => (
                  <FormItem>
                    <div className="mb-6">
                      <FormLabel className="text-base font-bold text-slate-900">Quais modalidades você trabalha?</FormLabel>
                      <FormDescription className="text-sm text-slate-500 mt-1">
                        Selecione as opções que deseja habilitar no sistema de busca e filtragem do seu site.
                      </FormDescription>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['sale', 'rent'].map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="enabledTransactions"
                          render={({ field }) => {
                            const isChecked = field.value?.includes(type);
                            return (
                              <FormItem
                                className={cn(
                                  "flex flex-row items-center space-x-4 space-y-0 rounded-2xl border p-6 transition-all cursor-pointer",
                                  isChecked 
                                    ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                                    : "bg-slate-50 border-slate-100 hover:border-slate-300"
                                )}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, type])
                                        : field.onChange(field.value?.filter((value) => value !== type));
                                    }}
                                    className="size-5 rounded-lg border-2"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-lg font-black uppercase tracking-tight cursor-pointer">
                                    {type === 'sale' ? 'Venda' : 'Aluguel'}
                                  </FormLabel>
                                  <p className="text-xs text-slate-500 font-medium">
                                    {type === 'sale' 
                                      ? 'Habilitar busca por venda de imóveis.' 
                                      : 'Habilitar busca por locação mensal.'}
                                  </p>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage className="mt-4" />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 items-start">
                <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Como funciona a filtragem?</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Se você selecionar apenas uma modalidade, o site esconderá automaticamente as abas "Comprar | Alugar" na busca e exibirá apenas os imóveis correspondentes. 
                    Se ambas estiverem selecionadas, seus clientes poderão alternar livremente entre as opções.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </form>
      </FormProvider>
    </div>
  );
}

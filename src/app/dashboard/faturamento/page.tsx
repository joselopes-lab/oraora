'use client';
import { Button } from "@/components/ui/button";
import { useAuthContext, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ShieldCheck, CreditCard, Receipt, AlertCircle, RefreshCcw } from "lucide-react";
import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  type: string;
  badge?: string;
  price: number;
  promoPrice?: number;
  billingCycle?: string;
  features?: string[];
  description?: string;
  trialDays?: number;
};

export default function FaturamentoPage() {
  const { userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const planId = userProfile?.planId;

  const planRef = useMemoFirebase(
    () => (firestore && planId ? doc(firestore, 'plans', planId) : null),
    [firestore, planId]
  );
  const { data: plan, isLoading } = useDoc<Plan>(planRef);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const handleAddPaymentMethod = () => {
    toast({
      title: 'Método de Pagamento',
      description: 'O cadastro de formas de pagamento estará disponível em breve.',
    });
  };

  const handleBillingEmailChange = () => {
    toast({
      title: 'E-mail de Cobrança',
      description: 'A alteração de e-mail de cobrança estará disponível em breve.',
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-10 space-y-8">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const isFree = !plan || plan.price === 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-10 pt-4">
      {/* Header & Back */}
      <div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Voltar ao Dashboard
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Faturamento</h1>
        <p className="text-slate-500 mt-1 font-medium">Gerencie sua assinatura, dados de cobrança e histórico de pagamentos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Plano Atual
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  {plan ? plan.name : 'Plano Gratuito'}
                </h3>
                {plan?.description && (
                  <p className="text-sm text-slate-500 font-medium mt-1">{plan.description}</p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {isFree ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                </span>
                {!isFree && (
                  <span className="text-xs font-bold text-slate-400 block">
                    /{plan.billingCycle || 'mês'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status da Assinatura</span>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-bold text-slate-900">Ativo</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próxima Cobrança</span>
                <p className="text-sm font-bold text-slate-700">Disponível após a ativação do pagamento</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => router.push('/dashboard/planos')}
                className="bg-slate-900 text-white font-bold h-11 px-6 rounded-xl hover:bg-black transition-all shadow-md"
              >
                Alterar plano
              </Button>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Forma de pagamento</h3>
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <CreditCard className="size-5" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">Nenhuma forma de pagamento cadastrada</p>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Você poderá cadastrar sua forma de pagamento quando o pagamento online estiver disponível.
              </p>
            </div>

            <div>
              <Button
                onClick={handleAddPaymentMethod}
                variant="outline"
                className="w-full sm:w-auto h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Adicionar forma de pagamento
              </Button>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Histórico de pagamentos</h3>
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <Receipt className="size-5" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">Nenhum pagamento registrado ainda.</p>
              <p className="text-xs text-slate-500 font-medium">
                Seus pagamentos aparecerão aqui após a primeira cobrança.
              </p>
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Billing Data Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <h3 className="text-xl font-black text-slate-900">Dados de cobrança</h3>
            
            <div className="space-y-4 text-sm">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome completo</span>
                <p className="font-bold text-slate-800">{userProfile?.username || 'Não informado'}</p>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail de cobrança</span>
                  <button onClick={handleBillingEmailChange} className="text-xs font-bold text-primary hover:underline">
                    Alterar
                  </button>
                </div>
                <p className="font-bold text-slate-800">{userProfile?.email || 'Não informado'}</p>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">CPF / CNPJ</span>
                <p className="font-bold text-slate-800">Não informado</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Endereço</span>
                <p className="font-bold text-slate-800">Não informado</p>
              </div>
            </div>
          </div>

          {/* Cancellation Section */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-4">
            <h3 className="text-lg font-black text-slate-900">Cancelar assinatura</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Você pode cancelar sua assinatura a qualquer momento. O acesso permanece disponível até o final do período contratado.
            </p>
            <Button
              onClick={handleCancelClick}
              variant="outline"
              className="w-full h-11 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
            >
              Cancelar assinatura
            </Button>
          </div>

        </div>
      </div>

      {/* Cancel Modal Confirmation */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
              <AlertCircle className="size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cancelar Assinatura</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                O cancelamento de assinaturas estará disponível quando o pagamento online estiver ativo.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setIsCancelModalOpen(false)}
                className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-black transition-all shadow-md"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

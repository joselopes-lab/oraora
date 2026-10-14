'use client';
import { Button } from "@/components/ui/button";
import { useAuthContext, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ShieldCheck, CreditCard, Receipt, AlertCircle, RefreshCcw } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

type Payment = {
  id: string;
  planNameSnapshot?: string;
  planName?: string;
  amount: number;
  status: string;
  createdAt: any;
  provider?: string;
  providerCheckoutId?: string;
  externalId?: string;
};

const getPaymentStatusBadge = (status: string) => {
  const st = (status || '').toLowerCase();
  if (st === 'paid' || st === 'pago') {
    return <Badge className="bg-green-100 text-green-800 border-none font-bold text-[10px] uppercase">Pago</Badge>;
  }
  if (st === 'pending' || st === 'pendente') {
    return <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px] uppercase">Pendente</Badge>;
  }
  if (st === 'refunded' || st === 'reembolsado') {
    return <Badge className="bg-purple-100 text-purple-800 border-none font-bold text-[10px] uppercase">Reembolsado</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-800 border-none font-bold text-[10px] uppercase">{status}</Badge>;
};

export default function FaturamentoPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const planId = userProfile?.planId;

  const planRef = useMemoFirebase(
    () => (firestore && planId ? doc(firestore, 'plans', planId) : null),
    [firestore, planId]
  );
  const { data: plan, isLoading } = useDoc<Plan>(planRef);

  const paymentsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'payments'), where('userId', '==', user.uid), limit(100)) : null),
    [firestore, user]
  );
  const { data: payments, isLoading: isPaymentsLoading } = useCollection<Payment>(paymentsQuery);

  const sortedPayments = useMemo(() => {
    if (!payments) return [];
    return [...payments].sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [payments]);

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

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/planos')}
              className="text-slate-500 hover:text-slate-900 -ml-2 h-8 px-2 rounded-lg font-bold"
            >
              <ArrowLeft className="size-4 mr-1" />
              Planos e Assinatura
            </Button>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faturamento e Pagamentos</h1>
          <p className="text-sm font-medium text-slate-500">
            Gerencie sua assinatura, visualize faturas e histórico de pagamentos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/dashboard/planos')}
            className="h-11 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            Ver Planos Disponíveis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Current Subscription & Payment History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Subscription Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">
                  <CreditCard className="size-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plano Atual</span>
                  <h2 className="text-xl font-black text-slate-900">
                    {plan?.name || userProfile?.planName || 'Plano Gratuito / Inicial'}
                  </h2>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs uppercase px-3 py-1">
                Ativo
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Valor</span>
                <p className="text-lg font-black text-slate-900">
                  {plan?.price ? `R$ ${plan.price.toFixed(2)}` : 'R$ 0,00'}
                  <span className="text-xs font-medium text-slate-500 ml-1">/{plan?.billingCycle || 'mês'}</span>
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Renovação</span>
                <p className="text-sm font-bold text-slate-800">Automática</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status de Acesso</span>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="size-4" /> Verificado
                </p>
              </div>
            </div>
          </div>

          {/* Payment History Table Section */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Histórico de Pagamentos</h3>
                  <p className="text-xs text-slate-500 font-medium">Todos os pagamentos realizados na sua conta</p>
                </div>
              </div>
            </div>

            {isPaymentsLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">Carregando histórico...</div>
            ) : sortedPayments.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Receipt className="size-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">Nenhum pagamento encontrado</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Quando você realizar assinaturas ou compras de planos, os recibos e comprovantes aparecerão aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-600 text-xs uppercase">Plano / Descrição</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs uppercase">Valor</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs uppercase">Status</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs uppercase">Data</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs uppercase text-right">Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.map((payment) => {
                      const dateVal = payment.createdAt?.toDate ? payment.createdAt.toDate() : (payment.createdAt ? new Date(payment.createdAt) : new Date());
                      return (
                        <TableRow key={payment.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-900">
                            {payment.planNameSnapshot || payment.planName || 'Assinatura OraOra'}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800">
                            R$ {(payment.amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium">
                            {isNaN(dateVal.getTime()) ? '-' : dateVal.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-400">
                            {payment.externalId || payment.providerCheckoutId || payment.id.slice(0, 8)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Payment Methods & Billing Info */}
        <div className="space-y-8">
          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <h3 className="text-lg font-black text-slate-900">Forma de Pagamento</h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-700">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">PIX / Cartão</p>
                  <p className="text-xs text-slate-500">Cobrança automatizada</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] uppercase">Principal</Badge>
            </div>
            <Button
              onClick={handleAddPaymentMethod}
              variant="outline"
              className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
            >
              Adicionar Novo Cartão
            </Button>
          </div>

          {/* Billing Data Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft space-y-6">
            <h3 className="text-lg font-black text-slate-900">Dados de Cobrança</h3>
            
            <div className="space-y-4 text-sm">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">E-mail de Faturamento</span>
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

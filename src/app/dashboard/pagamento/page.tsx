'use client';
import { Button } from "@/components/ui/button";
import { useAuthContext, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ShieldCheck, CreditCard, QrCode, CheckCircle2, Loader2, User, Mail, FileText, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import PixModal from "@/components/PixModal";

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

export default function PagamentoPage() {
  const { userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');

  // PIX Payer Information
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerTaxId, setPayerTaxId] = useState('');
  const [payerPhone, setPayerPhone] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  // Sync user profile when loaded
  useEffect(() => {
    if (userProfile) {
      if (!payerName && (userProfile.username || userProfile.name)) {
        setPayerName(userProfile.username || userProfile.name || '');
      }
      if (!payerEmail && userProfile.email) {
        setPayerEmail(userProfile.email || '');
      }
      if (!payerTaxId && (userProfile.taxId || userProfile.cpf)) {
        setPayerTaxId(userProfile.taxId || userProfile.cpf || '');
      }
      if (!payerPhone && (userProfile.cellphone || userProfile.phone)) {
        setPayerPhone(userProfile.cellphone || userProfile.phone || '');
      }
    }
  }, [userProfile, payerName, payerEmail, payerTaxId, payerPhone]);

  const planId = searchParams.get('planId');
  const paramName = searchParams.get('name');
  const paramPrice = searchParams.get('price');
  const paramBilling = searchParams.get('billing');

  const planRef = useMemoFirebase(
    () => (firestore && planId ? doc(firestore, 'plans', planId) : null),
    [firestore, planId]
  );
  const { data: firestorePlan, isLoading: isFirestoreLoading } = useDoc<Plan>(planRef);

  const [apiProduct, setApiProduct] = useState<Plan | null>(null);
  const [isFetchingApiProduct, setIsFetchingApiProduct] = useState<boolean>(true);

  useEffect(() => {
    if (firestorePlan) {
      setIsFetchingApiProduct(false);
      return;
    }

    if (!planId) {
      setIsFetchingApiProduct(false);
      return;
    }

    // Try fetching product from Abacate Pay products route
    fetch('/api/products')
      .then((res) => res.json())
      .then((envelope) => {
        if (envelope.success && Array.isArray(envelope.data)) {
          const found = envelope.data.find(
            (p: any) => p.id === planId || p.externalId === planId
          );
          if (found) {
            const rawPrice = found.price ?? 0;
            const price = rawPrice >= 100 && Number.isInteger(rawPrice) ? rawPrice / 100 : rawPrice;
            setApiProduct({
              id: found.id,
              name: found.name,
              type: 'corretor',
              badge: found.badge,
              price: price,
              billingCycle: found.billingCycle || 'mensal',
              features: found.features || [],
              description: found.description,
              trialDays: found.trialDays
            });
            return;
          }
        }

        // Fallback from query params if available
        if (paramName && paramPrice !== null) {
          const rawPrice = Number(paramPrice) || 0;
          const price = rawPrice >= 100 && Number.isInteger(rawPrice) ? rawPrice / 100 : rawPrice;
          setApiProduct({
            id: planId,
            name: paramName,
            type: 'corretor',
            price: price,
            billingCycle: paramBilling || 'mensal',
            features: [
              'Acesso completo ao ecossistema',
              'Integração com Cartórios de Registro',
              'Suporte via plataforma'
            ],
            description: `Plano ${paramName} via Abacate Pay`
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch products from API:', err);
      })
      .finally(() => {
        setIsFetchingApiProduct(false);
      });
  }, [firestorePlan, planId, paramName, paramPrice, paramBilling]);

  const plan = firestorePlan || apiProduct;
  const isLoading = isFirestoreLoading || (isFetchingApiProduct && !firestorePlan);

  const formatCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      return v
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return v
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  const handleProceedPayment = async () => {
    if (!plan) return;

    if (paymentMethod === 'pix') {
      const cleanTaxId = payerTaxId.replace(/\D/g, '');
      const cleanPhone = payerPhone.replace(/\D/g, '');

      if (!payerName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Por favor, informe seu nome completo para emissão do PIX.',
          variant: 'destructive'
        });
        return;
      }

      if (!payerEmail.trim() || !payerEmail.includes('@')) {
        toast({
          title: 'E-mail obrigatório',
          description: 'Por favor, informe um e-mail válido.',
          variant: 'destructive'
        });
        return;
      }

      if (cleanTaxId.length < 11) {
        toast({
          title: 'CPF/CNPJ obrigatório',
          description: 'Informe um CPF ou CNPJ válido para registrar a cobrança no Abacate Pay.',
          variant: 'destructive'
        });
        return;
      }

      setIsGeneratingPix(true);
      try {
        const amountInCents = Math.round(plan.price < 500 ? plan.price * 100 : plan.price);
        const res = await fetch('/api/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInCents,
            expiresIn: 3600,
            description: `Assinatura ${plan.name} - OraOra`,
            customer: {
              name: payerName.trim(),
              email: payerEmail.trim(),
              taxId: cleanTaxId,
              cellphone: cleanPhone || undefined
            }
          })
        });

        const json = await res.json();
        if (json.success && json.data) {
          setPixData(json.data);
          setIsPixModalOpen(true);
        } else {
          toast({
            title: 'Erro ao gerar cobrança PIX',
            description: json.error || 'A API da Abacate Pay recusou os dados informados. Verifique seu CPF e telefone.',
            variant: 'destructive'
          });
        }
      } catch (err) {
        console.error('Erro ao gerar PIX transparente:', err);
        toast({
          title: 'Erro de conexão',
          description: 'Falha ao se comunicar com o serviço de pagamento.',
          variant: 'destructive'
        });
      } finally {
        setIsGeneratingPix(false);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        router.push('/dashboard/faturamento');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, router]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const formatCvv = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  const formatCpf = (value: string) => {
    return formatCpfCnpj(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Carregando detalhes do plano...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Plano não encontrado</h2>
        <p className="text-slate-500 text-sm">O plano selecionado não existe ou não está mais disponível.</p>
        <div className="pt-4">
          <Button onClick={() => router.push('/dashboard/planos')} className="font-bold">
            Ver Todos os Planos
          </Button>
        </div>
      </div>
    );
  }

  const isFree = plan.price === 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-10 pt-4">
      {/* Header & Back */}
      <div>
        <button 
          onClick={() => router.push('/dashboard/planos')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Voltar aos Planos
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Finalizar Assinatura</h1>
        <p className="text-slate-500 mt-1 font-medium">Revise os detalhes do plano escolhido antes de prosseguir com o pagamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Plan Summary Card */}
        <div className="md:col-span-1 bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-soft">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-white/10 px-3 py-1 rounded-full">
                Resumo do Pedido
              </span>
              <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-slate-300 font-medium">{plan.description}</p>
              )}
            </div>

            <div className="py-6 border-y border-white/10 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Valor total</span>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <span className="text-3xl font-black tracking-tight">
                  {isFree ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                </span>
                {!isFree && (
                  <span className="text-sm font-bold text-slate-400">
                    /{plan.billingCycle || 'mensal'}
                  </span>
                )}
              </div>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Benefícios Inclusos</span>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-medium text-slate-300">
                      <Check className="size-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-8 mt-8 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="size-4 text-green-400" />
            <span>Ambiente seguro e criptografado</span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-soft flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">Método de Pagamento</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => setPaymentMethod('pix')}
                className={`border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${paymentMethod === 'pix' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">PIX Transparente</h4>
                  <p className="text-xs text-slate-500 font-medium">QR Code na tela instantâneo</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMethod('credit')}
                className={`border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'credit' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${paymentMethod === 'credit' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                  <CreditCard className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Cartão de Crédito</h4>
                  <p className="text-xs text-slate-500 font-medium">Até 12x no cartão</p>
                </div>
              </div>
            </div>

            {/* PIX Payer Form */}
            {paymentMethod === 'pix' && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Dados do Pagador (Obrigatório para registro na Abacate Pay)</h4>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Cobrança Oficial
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <User className="size-3.5 text-slate-400" /> Nome Completo
                    </label>
                    <input 
                      type="text"
                      placeholder="Seu nome completo"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <FileText className="size-3.5 text-slate-400" /> CPF ou CNPJ
                    </label>
                    <input 
                      type="text"
                      placeholder="000.000.000-00"
                      value={payerTaxId}
                      onChange={(e) => setPayerTaxId(formatCpfCnpj(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" /> WhatsApp / Celular
                    </label>
                    <input 
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(formatPhone(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Mail className="size-3.5 text-slate-400" /> E-mail para Recibo
                    </label>
                    <input 
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Credit Card Form */}
            {paymentMethod === 'credit' && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-4 animate-in fade-in duration-300">
                <h4 className="font-bold text-slate-900 text-sm">Dados do cartão</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Número do cartão</label>
                    <input 
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome impresso no cartão</label>
                    <input 
                      type="text"
                      placeholder="NOME DO TITULAR"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Validade</label>
                      <input 
                        type="text"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CVV</label>
                      <input 
                        type="password"
                        placeholder="000"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(formatCvv(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CPF do titular</label>
                    <input 
                      type="text"
                      placeholder="000.000.000-00"
                      value={cardCpf}
                      onChange={(e) => setCardCpf(formatCpf(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <Button
              onClick={handleProceedPayment}
              disabled={isGeneratingPix}
              className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-black shadow-md transition-all text-base flex items-center justify-center gap-2"
            >
              {isGeneratingPix && <Loader2 className="size-5 animate-spin" />}
              <span>{isGeneratingPix ? 'Registrando Cobrança no Abacate Pay...' : (paymentMethod === 'pix' ? 'Gerar PIX QR Code' : 'Confirmar Pagamento')}</span>
            </Button>
            <p className="text-xs text-center text-slate-400 font-medium">
              Ao continuar, você concorda com os termos de serviço e política de privacidade do OraOra.
            </p>
          </div>
        </div>
      </div>

      {/* Pix Modal */}
      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        pixData={pixData}
        planName={plan.name}
        onSuccess={() => {
          setIsModalOpen(true);
          setTimeout(() => {
            router.push('/dashboard/faturamento');
          }, 2000);
        }}
      />

      {/* Success Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Parabéns!</h3>
              <p className="text-base font-bold text-slate-800">
                Seu plano {plan.name} foi contratado com sucesso.
              </p>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Agora você pode acompanhar sua assinatura e sua vida financeira dentro do OraOra.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center gap-2 text-xs font-bold text-primary">
              <Loader2 className="size-5 animate-spin" />
              <span>Preparando seu Financeiro...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  RefreshCw, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { AbacatePayProduct, AbacatePayApiResponse } from '@/app/api/products/route';

export default function PlansPage() {
  const { userProfile, isReady } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<AbacatePayProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      setError(null);

      const res = await fetch('/api/products', {
        method: 'GET',
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error(`Erro ao buscar produtos (${res.status})`);
      }

      const envelope: AbacatePayApiResponse = await res.json();

      if (envelope.success && Array.isArray(envelope.data)) {
        setProducts(envelope.data);
        setIsFallback(Boolean(envelope.isFallback));
        if (showToast) {
          toast({
            title: 'Produtos atualizados',
            description: envelope.isFallback 
              ? 'Produtos carregados em modo de demonstração (fallback ativo).' 
              : 'Lista de produtos sincronizada com o Abacate Pay.'
          });
        }
      } else {
        throw new Error(envelope.error || 'Formato de resposta inválido');
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Erro ao listar produtos do Abacate Pay:', e);
      setError(e.message || 'Falha ao conectar com o serviço de produtos.');
      if (showToast) {
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível buscar os produtos do Abacate Pay.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getCycleLabel = (cycle?: string | null, billingCycle?: string) => {
    const val = (cycle || billingCycle || '').toUpperCase();
    if (val === 'ANNUALLY' || val === 'YEARLY' || val === 'ANUAL') return 'anual';
    if (val === 'MONTHLY' || val === 'MENSAL') return 'mensal';
    if (val === 'WEEKLY' || val === 'SEMANAL') return 'semanal';
    if (val === 'DAILY' || val === 'DIARIO') return 'diário';
    if (val === 'ONCE' || val === 'AVULSO') return 'avulso';
    return cycle ? cycle.toLowerCase() : (billingCycle || 'único');
  };

  const handleSelectProduct = (product: AbacatePayProduct) => {
    const isCurrent = product.id === userProfile?.planId || product.externalId === userProfile?.planId;
    if (isCurrent) {
      toast({ 
        title: 'Plano atual', 
        description: 'Você já está cadastrado neste plano.' 
      });
      return;
    }

    // Redireciona para o checkout com os parâmetros do produto do Abacate Pay
    const billing = getCycleLabel(product.cycle, product.billingCycle);
    const params = new URLSearchParams({
      planId: product.id,
      name: product.name,
      price: String(product.price),
      billing: billing
    });

    if (product.externalId) {
      params.append('externalId', product.externalId);
    }

    router.push(`/dashboard/pagamento?${params.toString()}`);
  };

  const formatPriceDisplay = (price: number) => {
    if (price === 0) return { label: 'Grátis', subtext: 'sem mensalidade' };
    
    // Na API do Abacate Pay os preços de produtos são expressos em centavos (ex: 9700 = R$ 97,00)
    const normalizedPrice = price >= 100 && Number.isInteger(price) ? price / 100 : price;
    return {
      label: normalizedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      subtext: ''
    };
  };

  if (!isReady || isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-10 space-y-8 text-left animate-in fade-in duration-300">
        <div className="space-y-3">
          <div className="h-4 w-36 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-9 w-72 bg-slate-200 animate-pulse rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-100 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-[460px] bg-slate-100 animate-pulse rounded-3xl border border-slate-200/50"></div>
          <div className="h-[460px] bg-slate-100 animate-pulse rounded-3xl border border-slate-200/50"></div>
          <div className="h-[460px] bg-slate-100 animate-pulse rounded-3xl border border-slate-200/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-10 pt-4">
      {/* Header & Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Voltar ao Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Planos e Produtos
            </h1>
            
            {/* Status Abacate Pay */}
            {isFallback ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Exibindo catálogo local com fallback automático">
                <span className="size-2 rounded-full bg-amber-500"></span>
                Abacate Pay (Modo Demonstração)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Abacate Pay v2 Conectado
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1.5 font-medium text-sm md:text-base">
            Produtos e assinaturas disponíveis diretamente via gateway Abacate Pay com liquidação via PIX e Cartão.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts(true)}
            disabled={isRefreshing}
            className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs gap-2 flex-1 md:flex-initial"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{isRefreshing ? 'Sincronizando...' : 'Atualizar Catálogo'}</span>
          </Button>
        </div>
      </div>

      {/* Alerta de erro se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="size-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold">Aviso na sincronização</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fetchProducts(true)}
            className="bg-white border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold h-8 rounded-lg"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Aviso informativo de fallback gracioso */}
      {isFallback && !error && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2.5">
            <Zap className="size-4 text-amber-600 shrink-0" />
            <span>
              Catálogo carregado via <strong>fallback gracioso</strong>. Para conectar ao seu ambiente de produção do Abacate Pay, configure a variável <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-900">ABACATE_PAY_TOKEN</code>.
            </span>
          </div>
        </div>
      )}

      {/* Grid de Produtos */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="size-12 mx-auto text-slate-400" />
          <h3 className="text-xl font-black text-slate-900">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500 font-medium">
            Não encontramos produtos cadastrados na conta do Abacate Pay no momento.
          </p>
          <Button 
            onClick={() => fetchProducts(true)}
            className="bg-slate-900 text-white font-bold h-11 px-6 rounded-xl"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {products.map((product) => {
            const isCurrentPlan = 
              product.id === userProfile?.planId || 
              (product.externalId && product.externalId === userProfile?.planId);
            
            const isFree = product.price === 0;
            const priceInfo = formatPriceDisplay(product.price);
            const isPopular = product.badge?.toLowerCase().includes('popular') || product.name.toLowerCase().includes('pro');

            return (
              <div 
                key={product.id}
                className={`bg-white rounded-3xl p-7 border transition-all duration-200 flex flex-col justify-between relative ${
                  isCurrentPlan 
                    ? 'border-primary ring-2 ring-primary/20 shadow-md' 
                    : isPopular 
                      ? 'border-slate-300 shadow-md hover:border-slate-400 hover:shadow-lg' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Badge no topo */}
                {product.badge ? (
                  <div className={`absolute -top-3 right-6 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                    isPopular 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {product.badge}
                  </div>
                ) : isPopular ? (
                  <div className="absolute -top-3 right-6 bg-slate-900 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Recomendado
                  </div>
                ) : null}

                <div className="space-y-5">
                  {/* Cabeçalho do Card */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {product.name}
                      </h3>
                      {isCurrentPlan && (
                        <span className="text-xs font-extrabold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          Ativo
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="py-4 border-y border-slate-100 flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        {priceInfo.label}
                      </span>
                      {!isFree && (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          /{getCycleLabel(product.cycle, product.billingCycle)}
                        </span>
                      )}
                    </div>
                    {priceInfo.subtext && (
                      <span className="text-xs text-slate-400 font-medium mt-0.5">
                        {priceInfo.subtext}
                      </span>
                    )}
                  </div>

                  {/* Período de Testes */}
                  {product.trialDays !== undefined && product.trialDays !== null && product.trialDays > 0 && (
                    <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 border border-primary/10">
                      <Sparkles className="size-4 shrink-0" />
                      <span>{product.trialDays} dias de teste gratuito incluídos</span>
                    </div>
                  )}

                  {/* Benefícios / Recursos */}
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Recursos e Vantagens
                    </span>
                    <ul className="space-y-2.5">
                      {(product.features && product.features.length > 0 ? product.features : [
                        'Processamento seguro via Abacate Pay',
                        'Liquidação via PIX ou Cartão em até 12x',
                        'Acesso imediato após confirmação de pagamento'
                      ]).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                          <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ação */}
                <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
                  <Button
                    onClick={() => handleSelectProduct(product)}
                    disabled={isCurrentPlan}
                    className={`w-full h-11 rounded-xl font-bold transition-all text-sm ${
                      isCurrentPlan 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                        : isPopular
                          ? 'bg-slate-900 text-white hover:bg-black shadow-sm'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    }`}
                  >
                    {isCurrentPlan 
                      ? 'Plano Atual' 
                      : isFree 
                        ? 'Começar Gratuitamente' 
                        : 'Assinar com Abacate Pay'}
                  </Button>

                  {product.externalId && (
                    <p className="text-[11px] text-center text-slate-400 font-mono">
                      Ref: {product.externalId}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Segurança Abacate Pay */}
      <div className="mt-12 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-600">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-900">
            <ShieldCheck className="size-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Pagamentos processados com segurança</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Infraestrutura oficial Abacate Pay com liquidação via PIX instantâneo e Cartão de Crédito criptografado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <CheckCircle2 className="size-4 text-emerald-600" /> PIX Automático
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <CreditCard className="size-4 text-slate-700" /> Cartão em até 12x
          </span>
        </div>
      </div>
    </div>
  );
}

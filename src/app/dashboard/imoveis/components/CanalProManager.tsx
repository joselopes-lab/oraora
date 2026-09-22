'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthContext, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateCanalProTokenAction } from '../canal-pro-manager.actions.server';
import { updatePropertyCanalProServer } from '../canal-pro.actions.server';
import { Clipboard, RefreshCw, Loader2, CheckCircle2, AlertCircle, Building2, MapPin, Tag, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { getCanalProValidationErrors } from '@/lib/feeds/canalpro-xml-generator';

function getClientRejectionReason(prop: any, brokerId: string): string | null {
  if (!prop) return 'Imóvel inválido';
  if (prop.builderId && prop.builderId !== brokerId) return 'Imóvel de construtora';
  
  const errors = getCanalProValidationErrors(prop);
  if (errors.length > 0) {
    return errors[0].message;
  }

  return null;
}

export function CanalProManager({ brokerId }: { brokerId: string }) {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [propertyToRemove, setPropertyToRemove] = useState<any | null>(null);
  const [portfolioProperties, setPortfolioProperties] = useState<any[]>([]);

  // Fetch token and user plan data
  const userDocRef = useMemoFirebase(
    () => (firestore && brokerId ? doc(firestore, 'users', brokerId) : null),
    [firestore, brokerId]
  );
  const { data: userData } = useDoc<any>(userDocRef);

  const planDocRef = useMemoFirebase(
    () => (firestore && userData?.planId ? doc(firestore, 'plans', userData.planId) : null),
    [firestore, userData]
  );
  const { data: planData } = useDoc<any>(planDocRef);
  const planLimit = planData?.propertyLimit || 0;

  // Fetch properties from brokerProperties collection (avulso) exclusively for Canal Pro
  const brokerPropsQuery = useMemoFirebase(
    () => (firestore && brokerId ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', brokerId)) : null),
    [firestore, brokerId]
  );
  const { data: brokerProperties } = useCollection<any>(brokerPropsQuery);

  // Fetch token initial state
  useEffect(() => {
    async function fetchToken() {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', brokerId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            setToken(snap.data().canalProToken || null);
        }
        setLoading(false);
    }
    fetchToken();
  }, [firestore, brokerId]);

  // Exclusive brokerProperties (avulso) for Canal Pro
  const allProperties = useMemo(() => {
    return (brokerProperties || []).map(p => ({ ...p, isConstructor: false }));
  }, [brokerProperties]);

  const publishedCount = useMemo(() => {
    return allProperties.filter(p => p.publishToCanalPro === true).length;
  }, [allProperties]);

  const handleGenerate = async (isRegeneration: boolean = false) => {
    setLoading(true);
    const idToken = await user?.getIdToken();
    if (!idToken) {
        toast({
            variant: 'destructive',
            title: "Erro de Autenticação",
            description: "Usuário não autenticado."
        });
        setLoading(false);
        return;
    }
    const result = await generateCanalProTokenAction(idToken);
    if (result.success) {
        setToken(result.token || null);
        toast({
            title: "Sucesso",
            description: isRegeneration ? "Nova URL gerada com sucesso." : "Conexão estabelecida com sucesso."
        });
    } else {
        toast({
            variant: 'destructive',
            title: "Erro",
            description: result.error || "Erro ao gerar token."
        });
    }
    setLoading(false);
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/api/feeds/canalpro/${brokerId}?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada", description: "A URL do feed foi copiada para a área de transferência." });
  };

  const handleTogglePublish = async (propertyId: string, currentStatus: boolean) => {
    if (currentStatus) {
      const prop = allProperties.find(p => p.id === propertyId);
      setPropertyToRemove(prop);
      return;
    }

    setUpdatingId(propertyId);
    const idToken = await user?.getIdToken();
    if (!idToken) {
      setUpdatingId(null);
      toast({ variant: 'destructive', title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    const result = await updatePropertyCanalProServer(propertyId, true, idToken);
    setUpdatingId(null);

    if (result.success) {
      toast({ title: "Sucesso", description: "Imóvel publicado no Canal Pro." });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: "Erro", description: result.error || "Erro ao publicar imóvel." });
    }
  };

  const confirmRemovePublish = async () => {
    if (!propertyToRemove) return;
    const propertyId = propertyToRemove.id;
    setPropertyToRemove(null);

    setUpdatingId(propertyId);
    const idToken = await user?.getIdToken();
    if (!idToken) {
      setUpdatingId(null);
      toast({ variant: 'destructive', title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    const result = await updatePropertyCanalProServer(propertyId, false, idToken);
    setUpdatingId(null);

    if (result.success) {
      toast({ title: "Sucesso", description: "Imóvel removido do Canal Pro." });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: "Erro", description: result.error || "Erro ao remover imóvel." });
    }
  };

  if (loading && !token) return <div className="flex justify-center py-12"><Loader2 className="animate-spin size-8 text-primary" /></div>;

  const hasToken = !!token;
  const feedUrl = hasToken ? `${window.location.origin}/api/feeds/canalpro/${brokerId}?token=${token}` : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Properties Distribution Section (Left Column ~65%) */}
      <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-soft border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Selecione os Imóveis para Distribuição</h3>
            <p className="text-sm text-slate-500">
              Escolha quais imóveis você deseja enviar ao Canal Pro.
            </p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2">
            <span>{publishedCount} de {planLimit > 0 ? planLimit : allProperties.length} imóveis publicados</span>
          </div>
        </div>

        {allProperties.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Nenhum imóvel encontrado em sua carteira.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {allProperties.map(prop => {
              const mediaArr = prop.midia || prop.media || prop.imagens || prop.images || prop.fotos || prop.galeria || [];
              const photo = mediaArr[0];
              const photoUrl = typeof photo === 'string' ? photo : photo?.url;
              const title = prop.informacoesbasicas?.nome || prop.titulo || prop.title || 'Imóvel sem título';
              const loc = prop.localizacao || {};
              const locationStr = [loc.bairro || loc.neighborhood, [loc.cidade || loc.city, loc.estado || loc.state].filter(Boolean).join('/')].filter(Boolean).join(' • ') || 'Localização não informada';
              
              const info = prop.informacoesbasicas || {};
              const rawPrice = info.salePrice ?? info.precoVenda ?? info.valor ?? info.rentPrice ?? prop.salePrice ?? prop.precoVenda ?? prop.valor ?? prop.price;
              const price = parsePrice(rawPrice);
              const priceFormatted = price > 0 ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço sob consulta';
              
              const txTypes = info.transactionTypes || [];
              const finalidade = (prop.finalidade || '').toLowerCase();
              const isSale = txTypes.includes('sale') || finalidade.includes('venda');
              const isRent = txTypes.includes('rent') || finalidade.includes('aluguel');
              let operation = 'Venda';
              if (isSale && isRent) operation = 'Venda / Aluguel';
              else if (isRent) operation = 'Aluguel';

              const rejectionReason = getClientRejectionReason(prop, brokerId);
              const isPublished = prop.publishToCanalPro === true;
              const isUpdating = updatingId === prop.id;

              return (
                <div key={prop.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="relative size-24 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                    {photoUrl ? (
                      <img src={photoUrl} alt={title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{locationStr}</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{operation} • {priceFormatted}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      {prop.isConstructor ? (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-400" /> Imóvel de construtora
                        </span>
                      ) : rejectionReason ? (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                          <AlertCircle className="size-3" /> {rejectionReason}
                        </span>
                      ) : isPublished ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleTogglePublish(prop.id, true)}
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold rounded-lg h-8"
                        >
                          {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3 mr-1 text-emerald-600" />}
                          Publicado no Canal Pro
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleTogglePublish(prop.id, false)}
                          className="bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg h-8 shadow-sm"
                        >
                          {isUpdating && <Loader2 className="size-3 animate-spin mr-1" />}
                          Publicar no Canal Pro
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection Card (Right Column ~35%) */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-soft border border-slate-100 space-y-6">
          <div>
              <h3 className="text-lg font-extrabold text-slate-900">Conexão Canal Pro</h3>
              <p className="text-sm text-slate-500">
                  {hasToken ? "Conectado e pronto para sincronização." : "Publique seus imóveis selecionados nos canais parceiros."}
              </p>
          </div>

          {!hasToken ? (
              <Button onClick={() => handleGenerate()} className="font-bold rounded-xl shadow-sm w-full">
                  Conectar Canal Pro
              </Button>
          ) : (
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 break-all text-xs text-slate-700 font-mono">
                      {feedUrl}
                  </div>
                  <div className="flex flex-col gap-2">
                      <Button onClick={copyUrl} variant="outline" className="rounded-xl flex items-center justify-center gap-2 w-full">
                          <Clipboard className="size-4" /> Copiar URL
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" className="rounded-xl flex items-center justify-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 w-full">
                                  <RefreshCw className="size-4" /> Gerar nova conexão
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Gerar nova conexão?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Gerar uma nova conexão invalidará a URL atual do Canal Pro. Deseja continuar?
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleGenerate(true)} className="bg-amber-600 hover:bg-amber-700">
                                      Sim, gerar nova
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
                  <p className="text-xs text-slate-400">
                      Copie a URL do feed e informe ao Canal Pro para conectar seus imóveis.
                  </p>
              </div>
          )}
      </div>

      {/* Confirmation Dialog for Removal */}
      <AlertDialog open={!!propertyToRemove} onOpenChange={(open) => !open && setPropertyToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este imóvel do Canal Pro?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele deixará de ser enviado no próximo processamento do feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemovePublish} className="bg-destructive hover:bg-destructive/90 text-white">
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

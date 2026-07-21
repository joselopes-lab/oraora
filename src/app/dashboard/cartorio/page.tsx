'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthContext, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { 
  CartorioService, 
  CartorioServiceItem, 
  CartorioProcess, 
  ProcessDocument, 
  ProcessMessage 
} from '@/services/cartorioService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Coins, 
  UploadCloud, 
  User, 
  Bot, 
  Activity,
  FileCheck,
  ChevronRight,
  MessageSquare,
  Search,
  ArrowUpDown,
  Filter,
  UserCheck,
  Sparkle
} from 'lucide-react';
import PublicRequest from './components/PublicRequest';

const cartorioService = CartorioService.getInstance();

export default function CartorioIntegrationPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'servicos' | 'processos'>('servicos');
  const [services, setServices] = useState<CartorioServiceItem[]>([]);
  const [processes, setProcesses] = useState<CartorioProcess[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<CartorioProcess | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'nome' | 'prazo' | 'valor'>('nome');

  // Request flow states
  const [solicitarService, setSolicitarService] = useState<CartorioServiceItem | null>(null);
  const [clientSelectionOpen, setClientSelectionOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedCrmClient, setSelectedCrmClient] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [publicRequestOpen, setPublicRequestOpen] = useState(false);

  // Loading states
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  
  // AI States
  const [analyzingProcess, setAnalyzingProcess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Form states
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const brokerId = user?.uid || 'broker-demo-id';

  // Load CRM Clients dynamically from Firestore
  const leadsQuery = useMemoFirebase(
    () => {
      if (!firestore || !user?.uid) return null;
      return query(
        collection(firestore, 'leads'),
        where('brokerId', '==', user.uid)
      );
    },
    [firestore, user?.uid]
  );

  const { data: crmClients, isLoading: loadingClients } = useCollection<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>(leadsQuery);

  // Read tab parameter from URL safe on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'servicos' || tabParam === 'processos') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Carregar dados iniciais do Cartório
  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const list = await cartorioService.listServices();
      setServices(list);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível buscar os serviços do Cartório.',
      });
    } finally {
      setLoadingServices(false);
    }
  }, [toast]);

  const loadProcesses = useCallback(async () => {
    setLoadingProcesses(true);
    try {
      const list = await cartorioService.listBrokerProcesses(brokerId);
      setProcesses(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProcesses(false);
    }
  }, [brokerId]);

  useEffect(() => {
    loadServices();
    loadProcesses();
  }, [loadServices, loadProcesses]);

  // Carregar detalhes do processo selecionado
  const loadProcessDetails = useCallback(async (id: string) => {
    try {
      const p = await cartorioService.getProcessDetails(id);
      if (p) {
        setSelectedProcess(p);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível carregar os detalhes do processo.',
      });
    }
  }, [toast]);

  // Configurar Pooling (Tempo real) do Processo selecionado
  useEffect(() => {
    if (!selectedProcessId) {
      setSelectedProcess(null);
      setAiAnalysis(null);
      return;
    }

    loadProcessDetails(selectedProcessId);

    const unsubscribe = cartorioService.onProcessUpdate(selectedProcessId, (updatedProcess) => {
      setSelectedProcess(updatedProcess);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedProcessId, loadProcessDetails]);

  // Autoscroll do chat quando chegam novas mensagens
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedProcess?.messages]);

  // Filter and Sort services
  const filteredAndSortedServices = useMemo(() => {
    let result = [...services];

    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower)
      );
    }

    if (selectedCategory !== 'todos') {
      result = result.filter(s => s.category === selectedCategory);
    }

    result.sort((a, b) => {
      if (sortBy === 'nome') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'prazo') {
        return a.estimatedDays - b.estimatedDays;
      } else if (sortBy === 'valor') {
        return a.price - b.price;
      }
      return 0;
    });

    return result;
  }, [services, searchTerm, selectedCategory, sortBy]);

  // Filter CRM clients for selection
  const filteredClients = useMemo(() => {
    const clients = crmClients || [];
    if (clientSearchTerm.trim() === '') return clients;
    const lower = clientSearchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      (c.phone && c.phone.includes(lower))
    );
  }, [crmClients, clientSearchTerm]);

  const handleOpenSolicitarFlow = (service: CartorioServiceItem) => {
    setSolicitarService(service);
    setSelectedCrmClient(null);
    setClientSearchTerm('');
    setClientSelectionOpen(true);
  };

  const handleSelectClient = (client: typeof filteredClients[0]) => {
    setSelectedCrmClient(client);
    setClientSelectionOpen(false);
    setPublicRequestOpen(true);
  };

  const handleRequestSuccess = async (newProcess: CartorioProcess) => {
    setPublicRequestOpen(false);
    setSolicitarService(null);
    setSelectedCrmClient(null);
    
    // Refresh processes list
    await loadProcesses();
    
    // Select the newly created process and switch view
    setSelectedProcessId(newProcess.id);
    setActiveTab('processos');
  };

  // Envio de Mensagem no Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProcessId || sendingMsg) return;

    const textToSend = chatInput;
    setChatInput('');
    setSendingMsg(true);

    try {
      const updated = await cartorioService.sendMessage(selectedProcessId, textToSend);
      setSelectedProcess(updated);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: 'Sua mensagem não pôde ser enviada. Verifique sua conexão.',
      });
      setChatInput(textToSend);
    } finally {
      setSendingMsg(false);
    }
  };

  // Upload simulado de documento com conversão Base64
  const handleFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProcessId) return;

    setUploadingDocId(docId);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const updated = await cartorioService.uploadComplementaryDocument(
          selectedProcessId,
          docId,
          file.name,
          base64String
        );
        setSelectedProcess(updated);
        toast({
          title: 'Documento Recebido!',
          description: `O arquivo "${file.name}" foi enviado ao Oficial para análise.`,
        });
      };
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no envio',
        description: 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setUploadingDocId(null);
    }
  };

  // Análise Inteligente de Processo via Gemini
  const handleAnalyzeProcess = async () => {
    if (!selectedProcessId) return;
    setAnalyzingProcess(true);
    setAiAnalysis(null);

    try {
      const response = await fetch('/api/ai/analyze-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: selectedProcessId }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analista de IA ocupado',
        description: 'Não foi possível gerar a análise técnica de processo neste momento.',
      });
    } finally {
      setAnalyzingProcess(false);
    }
  };

  const getStatusBadge = (status: CartorioProcess['status']) => {
    switch (status) {
      case 'novo':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Recebido no Cartório</Badge>;
      case 'em_analise':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">Em Qualificação Territorial</Badge>;
      case 'aguardando_documentos':
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none">Nota de Exigência (Ajustes)</Badge>;
      case 'concluido':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Ato Registrado (Concluído)</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">Cancelado</Badge>;
    }
  };

  return (
    <div id="cartorio-integration-hub" className="text-left animate-in fade-in duration-500 max-w-[1440px] mx-auto p-6 md:p-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">gavel</span>
            Integração Cartórios de Registro
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Conecte o App do Corretor diretamente à serventia extrajudicial. Envie documentos, consulte exigências e obtenha certidões em tempo real.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={loadProcesses} 
            disabled={loadingProcesses}
            className="border-slate-200 h-11 px-5 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={cn("size-4 mr-2", loadingProcesses && "animate-spin")} />
            Sincronizar
          </Button>
        </div>
      </div>

      {selectedProcessId && selectedProcess ? (
        /* ================= VISTA DO DETALHE DO PROCESSO SELECIONADO ================= */
        <div className="space-y-8">
          <button 
            onClick={() => setSelectedProcessId(null)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-transparent border-none cursor-pointer p-1"
          >
            <ArrowLeft className="size-4" /> Voltar para a lista de processos
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coluna Central: Dados Gerais, Documentos e Linha do Tempo */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Card de Informação do Processo */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Processo ID: {selectedProcess.id}</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{selectedProcess.serviceName}</h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Aberto em {new Date(selectedProcess.createdAt).toLocaleDateString('pt-BR')} • Atualizado em tempo real</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(selectedProcess.status)}
                    <span className="text-xs text-slate-400 italic font-medium flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Atualizado há poucos segundos
                    </span>
                  </div>
                </div>

                {/* Linha do Tempo */}
                <div className="mt-8">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Activity className="size-4 text-primary" /> Estágios de Qualificação do Cartório
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 relative">
                    {selectedProcess.timeline.map((milestone, idx) => (
                      <div key={milestone.id} className="relative flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                            milestone.status === 'done' ? "bg-emerald-100 text-emerald-800" :
                            milestone.status === 'current' ? "bg-amber-100 text-amber-800 animate-pulse" :
                            "bg-slate-100 text-slate-400"
                          )}>
                            {milestone.status === 'done' ? '✓' : idx + 1}
                          </span>
                          {milestone.date && <span className="text-[10px] font-bold text-slate-400">{milestone.date}</span>}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-2">{milestone.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">{milestone.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checklist de Documentos solicitados */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2 flex items-center gap-2">
                  <FileCheck className="size-5 text-primary" /> Documentos Necessários (Conformidade Legal)
                </h3>
                <p className="text-slate-500 text-xs mb-6">Insira arquivos em PDF de alta resolução de acordo com os requisitos estabelecidos.</p>

                <div className="space-y-4">
                  {selectedProcess.documents.map((doc) => (
                    <div key={doc.id} className="p-4 md:p-6 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4 text-left">
                        <div className={cn(
                          "p-3 rounded-xl shrink-0 mt-0.5",
                          doc.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                          doc.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                          doc.status === 'submitted' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {doc.status === 'approved' ? <CheckCircle2 className="size-6" /> :
                           doc.status === 'rejected' ? <XCircle className="size-6" /> :
                           doc.status === 'submitted' ? <Clock className="size-6" /> : <FileText className="size-6" />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                            {doc.name}
                            {doc.status === 'pending' && <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200">Pendente</Badge>}
                            {doc.status === 'submitted' && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-none">Recebido</Badge>}
                            {doc.status === 'approved' && <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-none">Qualificado e Aceito</Badge>}
                            {doc.status === 'rejected' && <Badge className="text-[10px] bg-rose-100 text-rose-800 border-none">Exigência Emitida</Badge>}
                          </h4>
                          <p className="text-slate-400 text-xs font-semibold">Exigência cartorial para análise do ato imobiliário.</p>
                          {doc.fileName && (
                            <p className="text-slate-600 text-xs font-semibold flex items-center gap-1">
                              Anexo: <span className="underline font-bold">{doc.fileName}</span>
                            </p>
                          )}
                          {doc.feedback && (
                            <p className="text-rose-600 text-xs font-medium flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg border border-rose-100 mt-2">
                              <AlertCircle className="size-3.5 shrink-0" /> Exigência: {doc.feedback}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações para o Documento */}
                      <div className="shrink-0 flex items-center">
                        {doc.status !== 'approved' ? (
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="application/pdf"
                              id={`upload-${doc.id}`}
                              className="hidden"
                              onChange={(e) => handleFileUpload(doc.id, e)}
                              disabled={uploadingDocId === doc.id}
                            />
                            <Button 
                              variant="outline" 
                              asChild
                              className="border-slate-200 text-xs font-bold h-10 rounded-xl hover:bg-slate-50 cursor-pointer"
                            >
                              <label htmlFor={`upload-${doc.id}`}>
                                {uploadingDocId === doc.id ? (
                                  <RefreshCw className="size-3.5 mr-2 animate-spin" />
                                ) : (
                                  <UploadCloud className="size-4 mr-2" />
                                )}
                                {doc.status === 'rejected' ? 'Reenviar Documento' : 'Enviar Documento'}
                              </label>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="size-3.5" /> Pronto
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Lateral: Chat em Tempo Real com Escreventes e Análise de IA */}
            <div className="space-y-8">
              
              {/* Card Analista de IA Decoupled */}
              <div className="bg-slate-900 rounded-2xl shadow-xl border border-white/5 p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/15 rounded-full blur-[60px] -z-0 pointer-events-none translate-x-12 -translate-y-12"></div>
                
                <div className="relative space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                      <Sparkles className="size-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base tracking-tight">Parecer do Consultor de IA</h3>
                      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Gemini Flash Integration</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed text-left">
                    Dúvidas com exigências, prazos ou termos jurídicos do Cartório? Solicite um diagnóstico do nosso analista de conformidade jurídica alimentado por IA.
                  </p>

                  <Button 
                    onClick={handleAnalyzeProcess}
                    disabled={analyzingProcess}
                    className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold h-11 rounded-xl transition-all border-none shadow-[0_4px_20px_rgba(0,233,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {analyzingProcess ? (
                      <>
                        <RefreshCw className="size-4 mr-1 animate-spin" />
                        Qualificando Processo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-1" />
                        Analisar com IA
                      </>
                    )}
                  </Button>

                  {/* Resultado do Parecer da IA */}
                  {aiAnalysis && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 md:p-5 mt-4 text-left max-h-[380px] overflow-y-auto space-y-3 font-sans scrollbar-thin">
                      <h4 className="text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-widest border-b border-white/5 pb-2">
                        <Sparkles className="size-3.5" /> Diagnóstico Legal & Recomendações
                      </h4>
                      <div className="text-xs text-slate-200 space-y-3 leading-relaxed">
                        {aiAnalysis.split('\n').map((line, idx) => {
                          if (line.trim().startsWith('###')) {
                            return <h5 key={idx} className="font-bold text-white text-sm mt-4 mb-2">{line.replace('###', '').trim()}</h5>;
                          }
                          if (line.trim().startsWith('**')) {
                            return <p key={idx} className="font-bold text-slate-200 mt-2">{line.replace(/\*\*/g, '').trim()}</p>;
                          }
                          if (line.trim().startsWith('-')) {
                            return <li key={idx} className="ml-3 list-disc text-slate-300 pl-1">{line.replace('-', '').trim()}</li>;
                          }
                          return <p key={idx} className="text-slate-300">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Canal de Atendimento do Cartório (Chat) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[520px] overflow-hidden">
                <header className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="size-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 font-bold text-slate-600">
                        CT
                      </div>
                      <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">Serventia Extrajudicial</h4>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Escrevente Conectado</p>
                    </div>
                  </div>
                </header>

                {/* Mensagens do Chat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                  {selectedProcess.messages.map((message) => {
                    const isSystem = message.sender === 'system';
                    const isBroker = message.sender === 'broker';

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center my-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-center max-w-[90%] leading-relaxed">
                            {message.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={message.id} 
                        className={cn(
                          "flex flex-col max-w-[85%] text-left",
                          isBroker ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-2xl shadow-sm text-sm leading-relaxed",
                          isBroker 
                            ? "bg-[#00e900]/10 text-slate-900 rounded-tr-none border border-[#00e900]/20" 
                            : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                        )}>
                          {message.text}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 ml-1 flex items-center gap-1">
                          {isBroker ? <User className="size-2.5" /> : <Bot className="size-2.5 text-primary" />}
                          {isBroker ? 'Você' : 'Oficial de Registro'} • {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input do Chat */}
                <footer className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tire dúvidas sobre exigências..." 
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none" 
                    />
                    <button 
                      type="submit" 
                      disabled={sendingMsg || !chatInput.trim()}
                      className="absolute right-2 p-2 bg-[#00e900] text-black rounded-lg hover:brightness-105 transition-all cursor-pointer border-none disabled:opacity-40"
                    >
                      <Send className="size-4" />
                    </button>
                  </form>
                </footer>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* ================= VISTA DE LISTA DE SERVIÇOS E PROCESSOS ATIVOS ================= */
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Abas Segmentadas */}
          <div className="flex border-b border-slate-100 gap-6 shrink-0">
            <button 
              onClick={() => setActiveTab('servicos')}
              className={cn(
                "py-4 text-sm font-bold tracking-wide uppercase cursor-pointer border-none bg-transparent transition-all relative",
                activeTab === 'servicos' ? "text-slate-900 border-b-2 border-primary font-black" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Serviços Disponíveis ({filteredAndSortedServices.length})
            </button>
            <button 
              onClick={() => setActiveTab('processos')}
              className={cn(
                "py-4 text-sm font-bold tracking-wide uppercase cursor-pointer border-none bg-transparent transition-all relative",
                activeTab === 'processos' ? "text-slate-900 border-b-2 border-primary font-black" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Processos do Corretor ({processes.length})
            </button>
          </div>

          {activeTab === 'servicos' ? (
            /* LISTA DE SERVIÇOS COM FILTROS DE BUSCA */
            <div className="space-y-6">
              
              {/* Barra de Filtros e Busca */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  
                  {/* Busca por Nome */}
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="size-4.5" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Pesquisar por nome ou descrição do serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  {/* Filtros de Categoria e Ordenação */}
                  <div className="flex flex-wrap items-center gap-3">
                    
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Filter className="size-3.5 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoria:</span>
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer"
                      >
                        <option value="todos">Todas</option>
                        <option value="escritura">Escritura</option>
                        <option value="registro">Registro</option>
                        <option value="documental">Documental</option>
                        <option value="financeiro">Financeiro</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <ArrowUpDown className="size-3.5 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ordenar por:</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer"
                      >
                        <option value="nome">Nome</option>
                        <option value="prazo">Prazo Estimado</option>
                        <option value="valor">Valor</option>
                      </select>
                    </div>

                  </div>

                </div>
              </div>

              {/* Grid de Serviços */}
              <div className="grid md:grid-cols-2 gap-6">
                {loadingServices ? (
                  <div className="col-span-2 text-center py-20 text-slate-400 italic font-semibold">Carregando catálogo de serviços imobiliários...</div>
                ) : filteredAndSortedServices.length > 0 ? (
                  filteredAndSortedServices.map((service) => {
                    // Calculate a realistic average completion time
                    const averageDays = service.estimatedDays > 2 ? service.estimatedDays - 2 : service.estimatedDays;
                    return (
                      <div 
                        key={service.id} 
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all gap-6 text-left relative overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/25 border-none font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full">
                              {service.category}
                            </Badge>
                            <div className="flex flex-wrap items-center text-slate-600 font-bold text-xs gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3.5 text-slate-400" /> Prazo: {service.estimatedDays} dias
                              </span>
                              <span className="flex items-center gap-1">
                                <Coins className="size-3.5 text-slate-400" /> R$ {service.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-black text-slate-900 text-lg tracking-tight leading-tight">{service.name}</h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{service.description}</p>
                          </div>

                          {/* Historical Average Concluded Time info block */}
                          <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-50 p-3 rounded-xl">
                            <Sparkle className="size-4 text-emerald-500 animate-pulse" />
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Médio de Conclusão</p>
                              <p className="text-xs font-bold text-emerald-700">{averageDays} dias úteis (Média do Cartório)</p>
                            </div>
                          </div>

                          {/* Required Documents list preview */}
                          <div className="bg-slate-50/50 p-4 rounded-xl space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Documentos Obrigatórios:</h4>
                            <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                              {service.documentsConfig.map((doc) => (
                                <li key={doc.id} className="leading-tight">{doc.name}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleOpenSolicitarFlow(service)}
                          className="w-full bg-[#00e900] text-black hover:brightness-105 font-bold h-11 rounded-xl transition-all border-none flex items-center justify-center gap-1.5"
                        >
                          Solicitar Serviço
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-20 text-slate-400 italic">
                    Nenhum serviço encontrado para os filtros atuais.
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* LISTA DE PROCESSOS ATIVOS DO CORRETOR */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loadingProcesses ? (
                <div className="text-center py-20 text-slate-400 italic font-semibold">Carregando seus processos ativos...</div>
              ) : processes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {processes.map((p) => (
                    <div 
                      key={p.id} 
                      className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors text-left"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {p.id}</span>
                          {getStatusBadge(p.status)}
                        </div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight leading-none mt-1">{p.serviceName}</h3>
                        <p className="text-slate-400 text-xs font-semibold">
                          Iniciado em {new Date(p.createdAt).toLocaleDateString('pt-BR')} • {p.documents.filter(d => d.status === 'approved').length} de {p.documents.length} documentos aprovados
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <Button 
                          onClick={() => setSelectedProcessId(p.id)}
                          variant="outline"
                          className="border-slate-200 text-xs font-bold h-11 px-5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                        >
                          <MessageSquare className="size-4 mr-2" />
                          Acessar Processo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-20 text-slate-400 italic">
                  <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                    <span className="material-symbols-outlined text-5xl opacity-20 text-slate-900">gavel</span>
                    <h3 className="font-bold text-slate-700 text-lg">Nenhum processo em andamento</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Você ainda não iniciou nenhum processo de regularização ou escritura com o Cartório parceiro. Visite a aba de serviços para começar.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('servicos')} 
                      className="bg-primary hover:bg-primary-hover text-slate-900 font-bold h-10 px-5 rounded-xl border-none cursor-pointer"
                    >
                      Ver Serviços Cartoriais
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ================= FLOW DIALOGS ================= */}

      {/* STEP 1: SELECT CRM CLIENT */}
      <Dialog open={clientSelectionOpen} onOpenChange={setClientSelectionOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-100 text-left">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="size-5 text-primary" /> Selecionar Cliente do CRM
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Vincule um cliente já cadastrado no seu CRM à solicitação do serviço cartorial.
            </DialogDescription>
          </DialogHeader>

          {/* Search clients input */}
          <div className="mt-4 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="size-4" />
            </span>
            <input 
              type="text"
              placeholder="Pesquisar por nome, email ou telefone..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Clients list */}
          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {loadingClients ? (
              <div className="text-center py-10 text-slate-400 italic text-xs">Buscando seus clientes...</div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{client.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{client.email}</p>
                  </div>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="text-primary hover:text-primary-hover font-bold text-xs"
                  >
                    Selecionar
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-3">
                <p className="text-xs italic">Nenhum cliente encontrado no CRM.</p>
                <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                  Você precisa ter clientes cadastrados para poder iniciar um processo no Cartório.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setClientSelectionOpen(false)}
              className="border-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 2: PUBLIC REQUEST (PORTAL DE SOLICITAÇÃO) */}
      <Dialog open={publicRequestOpen} onOpenChange={setPublicRequestOpen}>
        <DialogContent className="max-w-4xl bg-white rounded-3xl p-6 md:p-8 border-none text-left scrollbar-thin overflow-y-auto max-h-[90vh]">
          {solicitarService && selectedCrmClient && (
            <PublicRequest 
              service={solicitarService}
              client={selectedCrmClient}
              brokerId={brokerId}
              onClose={() => setPublicRequestOpen(false)}
              onSuccess={handleRequestSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

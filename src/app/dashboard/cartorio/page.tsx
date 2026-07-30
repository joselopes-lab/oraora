'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthContext, useFirestore, useMemoFirebase, useCollection, useFirebase } from '@/firebase';
import { uploadFile } from '@/lib/storage';
import { collection, query, where } from 'firebase/firestore';
import { 
  CartorioService, 
  CartorioServiceItem, 
  CartorioProcess, 
  ProcessDocument,
  normalizeProcess
} from '@/services/cartorioService';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import CartorioTabs from './components/CartorioTabs';
import ServicesTab from './components/ServicesTab';
import ProcessesTab from './components/ProcessesTab';
import AboutTab from './components/AboutTab';
import ProcessDetailView from './components/ProcessDetailView';
import RequestDialog from './components/RequestDialog';

const cartorioService = CartorioService.getInstance();

export default function CartorioIntegrationPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { storage } = useFirebase();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'servicos' | 'processos' | 'como-funciona'>('como-funciona');
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

  const brokerId = user?.uid || '';

  // Load CRM Clients dynamically from Firestore
  const leadsQuery = useMemoFirebase(
    () => {
      if (!firestore || !brokerId) return null;
      return query(
        collection(firestore, 'leads'),
        where('brokerId', '==', brokerId)
      );
    },
    [firestore, brokerId]
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
      if (tabParam === 'servicos' || tabParam === 'processos' || tabParam === 'como-funciona' || tabParam === 'sobre') {
        setActiveTab(tabParam === 'sobre' ? 'como-funciona' : tabParam);
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
    if (!brokerId) return;
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
    const localProcess = processes.find((p) => p.id === id);
    if (localProcess && (localProcess.status?.toLowerCase() === 'rascunho' || id.startsWith('RASCUNHO-'))) {
      setSelectedProcess(normalizeProcess(localProcess));
      return;
    }

    try {
      const p = await cartorioService.getProcessDetails(id);
      if (p) {
        setSelectedProcess(normalizeProcess(p));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível carregar os detalhes do processo.',
      });
    }
  }, [processes, toast]);

  // Configurar Pooling (Tempo real) do Processo selecionado
  useEffect(() => {
    if (!selectedProcessId) {
      setSelectedProcess(null);
      setAiAnalysis(null);
      return;
    }

    const localProcess = processes.find((p) => p.id === selectedProcessId);
    if (localProcess && (localProcess.status?.toLowerCase() === 'rascunho' || selectedProcessId.startsWith('RASCUNHO-'))) {
      setSelectedProcess(normalizeProcess(localProcess));
      return;
    }

    loadProcessDetails(selectedProcessId);

    const unsubscribe = cartorioService.onProcessUpdate(selectedProcessId, (updatedProcess) => {
      setSelectedProcess(normalizeProcess(updatedProcess));
    });

    return () => {
      unsubscribe();
    };
  }, [selectedProcessId, loadProcessDetails, processes]);

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
      result = result.filter(s => {
        const name = s.name || s.title || "";
        const desc = s.description || s.summary || "";
        const cat = s.category || "";
        return name.toLowerCase().includes(lower) ||
               desc.toLowerCase().includes(lower) ||
               cat.toLowerCase().includes(lower);
      });
    }

    if (selectedCategory !== 'todos') {
      result = result.filter(s => (s.category || "") === selectedCategory);
    }

    result.sort((a, b) => {
      if (sortBy === 'nome') {
        const nameA = a.name ?? a.title ?? '';
        const nameB = b.name ?? b.title ?? '';
        return nameA.localeCompare(nameB, 'pt-BR');
      } else if (sortBy === 'prazo') {
        const daysA = a.estimatedDays ?? (parseInt(String(a.duration || a.estimatedTime)) || Number.MAX_SAFE_INTEGER);
        const daysB = b.estimatedDays ?? (parseInt(String(b.duration || b.estimatedTime)) || Number.MAX_SAFE_INTEGER);
        return daysA - daysB;
      } else if (sortBy === 'valor') {
        const priceA = Number(a.price ?? 0);
        const priceB = Number(b.price ?? 0);
        return priceA - priceB;
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

    if (solicitarService && brokerId) {
      const docsConfig = solicitarService.documentsConfig || solicitarService.documents || [];
      const newProcess: CartorioProcess = normalizeProcess({
        id: `RASCUNHO-${Date.now()}`,
        serviceId: solicitarService.id,
        serviceName: solicitarService.name,
        brokerId,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        status: 'rascunho',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        history: [],
        events: [],
        documents: docsConfig.map((doc: any, idx: number) => ({
          id: typeof doc === 'string' ? `doc-${idx}` : (doc.id || `doc-${idx}`),
          name: typeof doc === 'string' ? doc : (doc.name || doc.nome || 'Documento'),
          required: true,
          status: 'pending'
        })),
        timeline: [
          {
            id: 'step-1',
            title: 'Rascunho Criado',
            description: 'Aguardando envio de documentos e confirmação.',
            status: 'current',
            date: new Date().toLocaleDateString('pt-BR')
          },
          {
            id: 'step-2',
            title: 'Enviado ao Cartório',
            description: 'Aguardando recepção pelo escrevente.',
            status: 'pending'
          }
        ]
      });

      setProcesses(prev => [newProcess, ...prev]);
      setSelectedProcessId(newProcess.id);
      setActiveTab('processos');
      setSolicitarService(null);
      setSelectedCrmClient(null);
    }
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

  // Upload de documento para o Firebase Storage e salvamento de metadados
  const handleFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProcessId || !storage) return;

    setUploadingDocId(docId);
    try {
      const path = `cartorio/${selectedProcessId}`;
      const downloadURL = await uploadFile(storage, path, file, () => {});
      const storagePath = `${path}/${file.name}`;
      const nowStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const isDraft = selectedProcess?.status?.toLowerCase() === 'rascunho' || selectedProcessId.startsWith('RASCUNHO-');

      if (isDraft && selectedProcess) {
        const updatedDocs = selectedProcess.documents.map(d => {
          if (d.id === docId) {
            return {
              ...d,
              status: 'submitted' as const,
              fileName: file.name,
              fileUrl: downloadURL,
              downloadURL,
              storagePath,
              tipo: file.type,
              tamanho: file.size,
              uploadedAt: nowStr,
              uploadedBy: user?.uid
            };
          }
          return d;
        });
        const updatedProc = {
          ...selectedProcess,
          documents: updatedDocs,
          updatedAt: new Date().toISOString()
        };
        setSelectedProcess(updatedProc);
        setProcesses(prev => prev.map(p => p.id === updatedProc.id ? updatedProc : p));
      } else {
        try {
          const updated = await cartorioService.uploadComplementaryDocument(
            selectedProcessId,
            docId,
            file.name,
            downloadURL,
            storagePath,
            file.type,
            file.size,
            user?.uid
          );
          setSelectedProcess(updated);
          setProcesses(prev => prev.map(p => p.id === updated.id ? updated : p));
        } catch (error) {
          if (selectedProcess) {
            const updatedDocs = selectedProcess.documents.map(d => {
              if (d.id === docId) {
                return {
                  ...d,
                  status: 'submitted' as const,
                  fileName: file.name,
                  fileUrl: downloadURL,
                  downloadURL,
                  storagePath,
                  tipo: file.type,
                  tamanho: file.size,
                  uploadedAt: nowStr,
                  uploadedBy: user?.uid
                };
              }
              return d;
            });
            const updatedProc = {
              ...selectedProcess,
              documents: updatedDocs,
              updatedAt: new Date().toISOString()
            };
            setSelectedProcess(updatedProc);
            setProcesses(prev => prev.map(p => p.id === updatedProc.id ? updatedProc : p));
          }
        }
      }

      toast({
        title: 'Documento Enviado!',
        description: `O arquivo "${file.name}" foi enviado com sucesso para o Firebase Storage.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no envio',
        description: 'Não foi possível enviar o arquivo para o Firebase Storage.',
      });
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  const handleViewDocument = (doc: ProcessDocument) => {
    if (doc.fileUrl) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${doc.fileUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    } else {
      toast({
        title: 'Visualizar Documento',
        description: `Arquivo: ${doc.fileName || doc.name}`,
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedProcess || !selectedProcessId) return;

    try {
      try {
        await cartorioService.uploadComplementaryDocument(selectedProcessId, docId, '', '');
      } catch (err) {
        // ignore backend failure on delete
      }

      const updatedDocs = selectedProcess.documents.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            status: 'pending' as const,
            fileName: undefined,
            fileUrl: undefined,
            uploadedAt: undefined,
            feedback: undefined
          };
        }
        return d;
      });

      setSelectedProcess({
        ...selectedProcess,
        documents: updatedDocs,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Documento Excluído',
        description: 'O documento retornou para o status Pendente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o documento.',
      });
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

  // Envio formal do Rascunho para o Cartório
  const handleSubmitToCartorio = async () => {
    if (!selectedProcess || !brokerId) return;

    try {
      const draftId = selectedProcess.id;
      const customData = {
        origin: 'BROKER',
        originName: 'OraOra Corretor',
        brokerId,
        clientId: selectedProcess.clientId,
        clientName: selectedProcess.clientName,
        clientEmail: selectedProcess.clientEmail,
        status: 'em_analise',
        documents: selectedProcess.documents,
        messages: selectedProcess.messages,
      };

      const apiResult = await cartorioService.openRequest(
        selectedProcess.serviceId,
        brokerId,
        customData
      );

      const officialStatus = (apiResult.status && apiResult.status !== 'rascunho') ? apiResult.status : 'em_analise';
      const updatedProcess: CartorioProcess = {
        ...selectedProcess,
        ...apiResult,
        id: apiResult.id || selectedProcess.id,
        protocol: apiResult.protocol || selectedProcess.protocol || apiResult.id,
        status: officialStatus as any,
        createdAt: apiResult.createdAt || selectedProcess.createdAt,
        updatedAt: apiResult.updatedAt || new Date().toISOString(),
        documents: (apiResult.documents && apiResult.documents.length > 0) 
          ? apiResult.documents 
          : selectedProcess.documents,
        messages: (apiResult.messages && apiResult.messages.length > 0) 
          ? apiResult.messages 
          : selectedProcess.messages,
        timeline: (apiResult.timeline && apiResult.timeline.length > 0) 
          ? apiResult.timeline 
          : [
              {
                id: 'step-1',
                title: 'Rascunho Criado',
                description: 'Solicitação criada.',
                status: 'done',
                date: new Date().toLocaleDateString('pt-BR')
              },
              {
                id: 'step-2',
                title: 'Enviado ao Cartório',
                description: 'Processo enviado para qualificação do escrevente.',
                status: 'current',
                date: new Date().toLocaleDateString('pt-BR')
              }
            ]
      };

      setProcesses(prev => prev.map(p => p.id === draftId ? updatedProcess : p));
      setSelectedProcessId(updatedProcess.id);
      setSelectedProcess(updatedProcess);

      toast({
        title: 'Enviado ao Cartório!',
        description: `O processo foi enviado com sucesso sob o protocolo ${updatedProcess.protocol || updatedProcess.id}.`,
      });
    } catch (error) {
      console.error('Erro ao enviar processo ao cartório:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no envio',
        description: 'Ocorreu um erro ao enviar a solicitação ao Cartório.',
      });
    }
  };

  const getStatusBadge = (status: CartorioProcess['status']) => {
    switch (status) {
      case 'rascunho':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">Rascunho</Badge>;
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
      {selectedProcessId && selectedProcess ? (
        <ProcessDetailView 
          selectedProcess={selectedProcess}
          onBack={() => setSelectedProcessId(null)}
          getStatusBadge={getStatusBadge}
          uploadingDocId={uploadingDocId}
          onFileUpload={handleFileUpload}
          onViewDocument={handleViewDocument}
          onDeleteDocument={handleDeleteDocument}
          analyzingProcess={analyzingProcess}
          aiAnalysis={aiAnalysis}
          onAnalyzeProcess={handleAnalyzeProcess}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendingMsg={sendingMsg}
          onSendMessage={handleSendMessage}
          chatBottomRef={chatBottomRef}
          onSubmitToCartorio={handleSubmitToCartorio}
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Consultoria Cartorial</h1>
            <p className="text-slate-500 text-sm font-medium">Serviços</p>
          </div>

          <CartorioTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            servicesCount={filteredAndSortedServices.length}
            processesCount={processes.length}
          />

          <div className="mt-8">
            {activeTab === 'servicos' ? (
              <ServicesTab 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                loadingServices={loadingServices}
                services={filteredAndSortedServices}
                onSolicitar={handleOpenSolicitarFlow}
              />
            ) : activeTab === 'processos' ? (
              <ProcessesTab 
                loadingProcesses={loadingProcesses}
                processes={processes}
                services={services}
                onSelectProcess={setSelectedProcessId}
                onGoToServices={() => setActiveTab('servicos')}
                getStatusBadge={getStatusBadge}
              />
            ) : (
              <AboutTab />
            )}
          </div>
        </div>
      )}

      <RequestDialog 
        solicitarService={solicitarService}
        clientSelectionOpen={clientSelectionOpen}
        setClientSelectionOpen={setClientSelectionOpen}
        clientSearchTerm={clientSearchTerm}
        setClientSearchTerm={setClientSearchTerm}
        loadingClients={loadingClients}
        filteredClients={filteredClients}
        onSelectClient={handleSelectClient}
        publicRequestOpen={publicRequestOpen}
        setPublicRequestOpen={setPublicRequestOpen}
        selectedCrmClient={selectedCrmClient}
        brokerId={brokerId}
        onRequestSuccess={handleRequestSuccess}
      />
    </div>
  );
}

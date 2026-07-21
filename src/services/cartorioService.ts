'use client';

export interface DocumentConfig {
  id: string;
  name: string;
  required: boolean;
  description: string;
}

export interface CartorioServiceItem {
  id: string;
  name: string;
  description: string;
  category: 'financeiro' | 'documental' | 'registro' | 'escritura' | 'outro';
  price: number;
  estimatedDays: number;
  documentsConfig: DocumentConfig[];
  portalOpeningUrl: string;
}

export interface ProcessDocument {
  id: string;
  name: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  fileUrl?: string;
  fileName?: string;
  feedback?: string;
}

export interface ProcessMessage {
  id: string;
  sender: 'broker' | 'cartorio' | 'system';
  text: string;
  createdAt: string;
}

export interface ProcessMilestone {
  id: string;
  title: string;
  description: string;
  status: 'done' | 'current' | 'upcoming';
  date?: string;
}

export interface CartorioProcess {
  id: string;
  serviceId: string;
  serviceName: string;
  brokerId: string;
  status: 'novo' | 'em_analise' | 'aguardando_documentos' | 'concluido' | 'cancelado';
  createdAt: string;
  updatedAt: string;
  documents: ProcessDocument[];
  messages: ProcessMessage[];
  timeline: ProcessMilestone[];
}

/**
 * SDK de Integração do Cartório para o App do Corretor.
 * Mantém zero regras de negócio no app do corretor, delegando tudo ao sistema do Cartório.
 */
export class CartorioService {
  private static instance: CartorioService;
  private activePolls: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): CartorioService {
    if (!CartorioService.instance) {
      CartorioService.instance = new CartorioService();
    }
    return CartorioService.instance;
  }

  /**
   * Listar todos os serviços disponíveis no Cartório.
   */
  public async listServices(): Promise<CartorioServiceItem[]> {
    try {
      const response = await fetch('/api/cartorio/services');
      if (!response.ok) throw new Error('Erro ao buscar serviços do Cartório');
      return await response.json();
    } catch (error) {
      console.error('listServices error:', error);
      return [];
    }
  }

  /**
   * Buscar detalhes específicos de um serviço cartorial.
   */
  public async getServiceDetails(serviceId: string): Promise<CartorioServiceItem | null> {
    try {
      const response = await fetch(`/api/cartorio/services?id=${serviceId}`);
      if (!response.ok) throw new Error('Erro ao buscar detalhes do serviço');
      return await response.json();
    } catch (error) {
      console.error('getServiceDetails error:', error);
      return null;
    }
  }

  /**
   * Abrir uma nova solicitação/processo cartorial.
   */
  public async openRequest(serviceId: string, brokerId: string, customData?: any): Promise<CartorioProcess> {
    try {
      const response = await fetch('/api/cartorio/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, brokerId, customData }),
      });
      if (!response.ok) throw new Error('Erro ao abrir processo cartorial');
      return await response.json();
    } catch (error) {
      console.error('openRequest error:', error);
      throw error;
    }
  }

  /**
   * Consultar processos do corretor logado.
   */
  public async listBrokerProcesses(brokerId: string): Promise<CartorioProcess[]> {
    try {
      const response = await fetch(`/api/cartorio/processes?brokerId=${brokerId}`);
      if (!response.ok) throw new Error('Erro ao buscar processos do corretor');
      return await response.json();
    } catch (error) {
      console.error('listBrokerProcesses error:', error);
      return [];
    }
  }

  /**
   * Buscar detalhes de um processo específico.
   */
  public async getProcessDetails(processId: string): Promise<CartorioProcess | null> {
    try {
      const response = await fetch(`/api/cartorio/processes/${processId}`);
      if (!response.ok) throw new Error('Erro ao carregar detalhes do processo');
      return await response.json();
    } catch (error) {
      console.error('getProcessDetails error:', error);
      return null;
    }
  }

  /**
   * Enviar um documento complementar para o processo.
   */
  public async uploadComplementaryDocument(
    processId: string, 
    docId: string, 
    fileName: string, 
    fileBase64: string
  ): Promise<CartorioProcess> {
    try {
      const response = await fetch(`/api/cartorio/processes/${processId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_document',
          docId,
          fileName,
          fileData: fileBase64,
        }),
      });
      if (!response.ok) throw new Error('Erro ao enviar documento complementar');
      return await response.json();
    } catch (error) {
      console.error('uploadComplementaryDocument error:', error);
      throw error;
    }
  }

  /**
   * Enviar uma mensagem na timeline do processo.
   */
  public async sendMessage(processId: string, text: string): Promise<CartorioProcess> {
    try {
      const response = await fetch(`/api/cartorio/processes/${processId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          text,
        }),
      });
      if (!response.ok) throw new Error('Erro ao enviar mensagem');
      return await response.json();
    } catch (error) {
      console.error('sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Registra uma inscrição de atualizações em tempo real para um processo.
   * Utiliza um mecanismo robusto de pooling que simula a escuta em tempo real do Cartório.
   */
  public onProcessUpdate(processId: string, callback: (updatedProcess: CartorioProcess) => void): () => void {
    // Evita acumular pools repetidas
    if (this.activePolls.has(processId)) {
      clearInterval(this.activePolls.get(processId)!);
    }

    let lastUpdatedAt = '';

    const poll = async () => {
      try {
        const p = await this.getProcessDetails(processId);
        if (p && p.updatedAt !== lastUpdatedAt) {
          lastUpdatedAt = p.updatedAt;
          callback(p);
        }
      } catch (err) {
        console.error('Erro na escuta em tempo real do processo:', err);
      }
    };

    // Primeira execução imediata
    poll();

    // Intervalo de verificação de 3 segundos
    const interval = setInterval(poll, 3000);
    this.activePolls.set(processId, interval);

    // Retorna função de cancelamento de inscrição (cleanup)
    return () => {
      clearInterval(interval);
      this.activePolls.delete(processId);
    };
  }
}



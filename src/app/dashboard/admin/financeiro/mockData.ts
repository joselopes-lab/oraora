/**
 * @fileOverview mockData.ts - TEMPORARY UI MOCK — replace with financial data source later
 */

export interface MockPayment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientTaxId?: string;
  clientCellphone?: string;
  planName: string;
  amount: number; // in cents
  method: 'PIX' | 'Cartão de Crédito' | 'Boleto';
  date: string;
  dateTime: string;
  status: 'Pago' | 'Pendente' | 'Reembolsado' | 'Em disputa' | 'Perdido';
  provider: string;
  checkoutId: string;
  timeline: { time: string; event: string }[];
}

export interface MockClientPlan {
  id: string;
  clientName: string;
  clientEmail: string;
  planName: string;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  accessStart: string;
  accessEnd: string;
  accessStatus: 'Ativo' | 'Próximo do vencimento' | 'Expirado' | 'Suspenso';
  paymentHistory: {
    date: string;
    plan: string;
    amount: number;
    method: string;
    status: 'Pago' | 'Pendente' | 'Reembolsado';
  }[];
}

export const adminFinanceMockData = {
  kpis: {
    receitaRecebida: 12845000, // R$ 128.450,00 in cents
    aReceber: 1420000, // R$ 14.200,00 in cents
    clientesPagantes: 342,
    ticketMedio: 37550 // R$ 375,50 in cents
  },
  revenueEvolution: [
    { month: 'Abr', value: 95000 },
    { month: 'Mai', value: 104000 },
    { month: 'Jun', value: 112000 },
    { month: 'Jul', value: 118000 },
    { month: 'Ago', value: 124000 },
    { month: 'Set', value: 128450 }
  ],
  payments: [
    {
      id: 'PAY-8921',
      clientName: 'Carlos Alberto Imóveis',
      clientEmail: 'carlos@imoveiscarlos.com.br',
      clientTaxId: '123.456.789-00',
      clientCellphone: '(11) 98765-4321',
      planName: 'Plano Pro Anual',
      amount: 149000, // R$ 1.490,00
      method: 'PIX' as const,
      date: '28/09/2026',
      dateTime: '28/09/2026 às 14:32',
      status: 'Pago' as const,
      provider: 'AbacatePay',
      checkoutId: 'chk_trans_01',
      timeline: [
        { time: '28/09/2026 14:30', event: 'Cobrança gerada' },
        { time: '28/09/2026 14:32', event: 'Pagamento PIX confirmado' }
      ]
    },
    {
      id: 'PAY-8920',
      clientName: 'Ana Paula Corretora',
      clientEmail: 'ana@anapaulacorretora.com',
      clientTaxId: '987.654.321-11',
      clientCellphone: '(21) 99123-4567',
      planName: 'Plano Enterprise Mensal',
      amount: 49900, // R$ 499,00
      method: 'Cartão de Crédito' as const,
      date: '28/09/2026',
      dateTime: '28/09/2026 às 11:15',
      status: 'Pago' as const,
      provider: 'AbacatePay',
      checkoutId: 'chk_trans_02',
      timeline: [
        { time: '28/09/2026 11:15', event: 'Cobrança gerada' },
        { time: '28/09/2026 11:15', event: 'Cartão aprovado' }
      ]
    },
    {
      id: 'PAY-8919',
      clientName: 'Marcos Vinicius',
      clientEmail: 'marcos@viniimoveis.com.br',
      clientTaxId: '456.123.789-22',
      clientCellphone: '(31) 98888-7777',
      planName: 'Plano Pro Mensal',
      amount: 19900, // R$ 199,00
      method: 'PIX' as const,
      date: '27/09/2026',
      dateTime: '27/09/2026 às 18:40',
      status: 'Pendente' as const,
      provider: 'AbacatePay',
      checkoutId: 'chk_trans_03',
      timeline: [
        { time: '27/09/2026 18:40', event: 'Cobrança gerada - aguardando PIX' }
      ]
    }
  ] as MockPayment[],
  clientPlans: [
    {
      id: 'CLI-01',
      clientName: 'Carlos Alberto Imóveis',
      clientEmail: 'carlos@imoveiscarlos.com.br',
      planName: 'Plano Pro Anual',
      lastPaymentAmount: 149000,
      lastPaymentDate: '28/09/2026',
      accessStart: '28/09/2026',
      accessEnd: '28/09/2027',
      accessStatus: 'Ativo' as const,
      paymentHistory: [
        { date: '28/09/2026', plan: 'Plano Pro Anual', amount: 149000, method: 'PIX', status: 'Pago' as const }
      ]
    },
    {
      id: 'CLI-02',
      clientName: 'Ana Paula Corretora',
      clientEmail: 'ana@anapaulacorretora.com',
      planName: 'Plano Enterprise Mensal',
      lastPaymentAmount: 49900,
      lastPaymentDate: '28/09/2026',
      accessStart: '28/09/2026',
      accessEnd: '28/10/2026',
      accessStatus: 'Ativo' as const,
      paymentHistory: [
        { date: '28/09/2026', plan: 'Plano Enterprise Mensal', amount: 49900, method: 'Cartão de Crédito', status: 'Pago' as const }
      ]
    },
    {
      id: 'CLI-03',
      clientName: 'Marcos Vinicius',
      clientEmail: 'marcos@viniimoveis.com.br',
      planName: 'Plano Pro Mensal',
      lastPaymentAmount: 19900,
      lastPaymentDate: '27/09/2026',
      accessStart: '27/09/2026',
      accessEnd: '27/10/2026',
      accessStatus: 'Próximo do vencimento' as const,
      paymentHistory: [
        { date: '27/09/2026', plan: 'Plano Pro Mensal', amount: 19900, method: 'PIX', status: 'Pendente' as const }
      ]
    }
  ] as MockClientPlan[]
};

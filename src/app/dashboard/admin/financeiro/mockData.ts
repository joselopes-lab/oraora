/**
 * @fileOverview mockData.ts - TEMPORARY UI MOCK — replace with financial data source later
 */

export interface MockPayment {
  id: string;
  clientName: string;
  clientEmail: string;
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
    { month: 'Ago', value: 122000 },
    { month: 'Set', value: 128450 }
  ],
  revenueByPlan: [
    { plan: 'Studio Pro Annual', share: '55%', value: 'R$ 70.640' },
    { plan: 'Broker Elite Monthly', share: '30%', value: 'R$ 38.535' },
    { plan: 'Standard Starter', share: '15%', value: 'R$ 19.275' }
  ],
  paymentStatusSummary: {
    pagos: 310,
    pendentes: 18,
    reembolsados: 6,
    emDisputa: 4,
    perdidos: 4
  },
  payments: [
    {
      id: 'PAY-9821',
      clientName: 'Carlos Eduardo Mendes',
      clientEmail: 'carlos.mendes@corretor.com.br',
      planName: 'Studio Pro Annual',
      amount: 347000,
      method: 'PIX',
      date: '25/09/2026',
      dateTime: '25/09/2026 às 14:32',
      status: 'Pago',
      provider: 'AbacatePay',
      checkoutId: 'chk_abct_892341',
      timeline: [
        { time: '25/09/2026 14:30', event: 'Pagamento criado no checkout' },
        { time: '25/09/2026 14:32', event: 'Confirmação PIX recebida via webhook' }
      ]
    },
    {
      id: 'PAY-9820',
      clientName: 'Mariana Souza Lima',
      clientEmail: 'mariana.lima@imoveis.com',
      planName: 'Broker Elite Monthly',
      amount: 19700,
      method: 'Cartão de Crédito',
      date: '25/09/2026',
      dateTime: '25/09/2026 às 11:15',
      status: 'Pago',
      provider: 'AbacatePay',
      checkoutId: 'chk_abct_892210',
      timeline: [
        { time: '25/09/2026 11:14', event: 'Autorização de cartão iniciada' },
        { time: '25/09/2026 11:15', event: 'Pagamento confirmado' }
      ]
    },
    {
      id: 'PAY-9819',
      clientName: 'Roberto Alcantara',
      clientEmail: 'roberto@alcantaraimoveis.com',
      planName: 'Standard Starter',
      amount: 9900,
      method: 'Boleto',
      date: '24/09/2026',
      dateTime: '24/09/2026 às 16:00',
      status: 'Pendente',
      provider: 'AbacatePay',
      checkoutId: 'chk_abct_891905',
      timeline: [
        { time: '24/09/2026 16:00', event: 'Boleto gerado e enviado por e-mail' }
      ]
    },
    {
      id: 'PAY-9818',
      clientName: 'Fernanda Vasconcelos',
      clientEmail: 'fernanda@fvimoveis.com',
      planName: 'Studio Pro Annual',
      amount: 347000,
      method: 'PIX',
      date: '23/09/2026',
      dateTime: '23/09/2026 às 09:40',
      status: 'Reembolsado',
      provider: 'AbacatePay',
      checkoutId: 'chk_abct_890123',
      timeline: [
        { time: '23/09/2026 09:40', event: 'Pagamento confirmado' },
        { time: '23/09/2026 15:20', event: 'Solicitação de reembolso pelo cliente atendida' }
      ]
    },
    {
      id: 'PAY-9817',
      clientName: 'Lucas Silveira',
      clientEmail: 'lucas@silveiraimoveis.com',
      planName: 'Broker Elite Monthly',
      amount: 19700,
      method: 'Cartão de Crédito',
      date: '22/09/2026',
      dateTime: '22/09/2026 às 18:10',
      status: 'Em disputa',
      provider: 'AbacatePay',
      checkoutId: 'chk_abct_889982',
      timeline: [
        { time: '22/09/2026 18:10', event: 'Pagamento aprovado' },
        { time: '23/09/2026 10:00', event: 'Chargeback / Disputa aberta pelo portador do cartão' }
      ]
    }
  ] as MockPayment[],

  clientsSummary: {
    pagantes: 342,
    acessosAtivos: 330,
    proximosVencimento: 12,
    suspensos: 8
  },

  clientsAndPlans: [
    {
      id: 'CLI-001',
      clientName: 'Carlos Eduardo Mendes',
      clientEmail: 'carlos.mendes@corretor.com.br',
      planName: 'Studio Pro Annual',
      lastPaymentAmount: 347000,
      lastPaymentDate: '25/09/2026',
      accessStart: '25/09/2026',
      accessEnd: '25/09/2027',
      accessStatus: 'Ativo',
      paymentHistory: [
        { date: '25/09/2026', plan: 'Studio Pro Annual', amount: 347000, method: 'PIX', status: 'Pago' }
      ]
    },
    {
      id: 'CLI-002',
      clientName: 'Mariana Souza Lima',
      clientEmail: 'mariana.lima@imoveis.com',
      planName: 'Broker Elite Monthly',
      lastPaymentAmount: 19700,
      lastPaymentDate: '25/09/2026',
      accessStart: '25/09/2026',
      accessEnd: '25/10/2026',
      accessStatus: 'Ativo',
      paymentHistory: [
        { date: '25/09/2026', plan: 'Broker Elite Monthly', amount: 19700, method: 'Cartão de Crédito', status: 'Pago' },
        { date: '25/08/2026', plan: 'Broker Elite Monthly', amount: 19700, method: 'Cartão de Crédito', status: 'Pago' }
      ]
    },
    {
      id: 'CLI-003',
      clientName: 'Roberto Alcantara',
      clientEmail: 'roberto@alcantaraimoveis.com',
      planName: 'Standard Starter',
      lastPaymentAmount: 9900,
      lastPaymentDate: '24/09/2026',
      accessStart: '24/08/2026',
      accessEnd: '24/09/2026',
      accessStatus: 'Próximo do vencimento',
      paymentHistory: [
        { date: '24/09/2026', plan: 'Standard Starter', amount: 9900, method: 'Boleto', status: 'Pendente' },
        { date: '24/08/2026', plan: 'Standard Starter', amount: 9900, method: 'Boleto', status: 'Pago' }
      ]
    },
    {
      id: 'CLI-004',
      clientName: 'Marcos Vinicius Prado',
      clientEmail: 'marcos@pradoimoveis.com',
      planName: 'Broker Elite Monthly',
      lastPaymentAmount: 19700,
      lastPaymentDate: '10/08/2026',
      accessStart: '10/07/2026',
      accessEnd: '10/09/2026',
      accessStatus: 'Expirado',
      paymentHistory: [
        { date: '10/08/2026', plan: 'Broker Elite Monthly', amount: 19700, method: 'Cartão de Crédito', status: 'Pago' }
      ]
    }
  ] as MockClientPlan[]
};

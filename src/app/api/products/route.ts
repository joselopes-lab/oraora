import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';

export interface AbacatePayProduct {
  id: string;
  externalId?: string;
  name: string;
  description?: string;
  price: number; // in cents or standard unit
  quantity?: number;
  features?: string[];
  badge?: string;
  billingCycle?: string;
  cycle?: string | null;
  currency?: string;
  status?: string;
  devMode?: boolean;
  imageUrl?: string | null;
  trialDays?: number | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AbacatePayApiResponse {
  data: AbacatePayProduct[];
  success: boolean;
  error: string | null;
  isFallback?: boolean;
}

// Fallback gracioso para dados mockados em ambiente de desenvolvimento
const MOCK_PRODUCTS: AbacatePayProduct[] = [
  {
    id: 'prod_starter_oraora',
    externalId: 'corretor_starter',
    name: 'Plano Starter Corretor',
    description: 'Ideal para corretores autônomos iniciando sua presença digital e gestão de carteira.',
    price: 0,
    quantity: 1,
    billingCycle: 'mensal',
    badge: 'Iniciante',
    trialDays: 14,
    features: [
      'Até 10 imóveis cadastrados',
      'Site do corretor exclusivo com link personalizado',
      'Gestão básica de leads e CRM imobiliário',
      'Acesso ao Radar de Oportunidades',
      'Suporte via e-mail e comunidade'
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prod_pro_oraora',
    externalId: 'corretor_pro',
    name: 'Plano Pro Corretor',
    description: 'Para corretores em alta performance com integração direta a cartórios e inteligência artificial.',
    price: 9700, // R$ 97,00 (centavos)
    quantity: 1,
    billingCycle: 'mensal',
    badge: 'Mais Popular',
    trialDays: 7,
    features: [
      'Imóveis ilimitados na carteira',
      'Site profissional com domínio próprio',
      'Integração direta com Cartórios (RI em tempo real)',
      'IA OraOra para avaliação e matchmaking de clientes',
      'Geração de contratos e fichas cadastrais em PDF',
      'Suporte prioritário via WhatsApp'
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prod_elite_oraora',
    externalId: 'corretor_elite',
    name: 'Plano Imobiliária & Equipe',
    description: 'Solução completa para imobiliárias, equipes de corretores e correspondentes bancários.',
    price: 19700, // R$ 197,00 (centavos)
    quantity: 1,
    billingCycle: 'mensal',
    badge: 'Completo',
    features: [
      'Múltiplos corretores e gestão de comissões',
      'Esteira de fechamento automatizada ponta a ponta',
      'Consultas cartorárias com desconto por lote',
      'CRM de alta conversão multiusuário',
      'Relatórios analíticos de mercado e BM',
      'Gerente de conta e onboarding dedicado'
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prod_cartorio_pack',
    externalId: 'creditos_cartorio_pack',
    name: 'Pacote de Certidões Cartório',
    description: 'Créditos avulsos para emissão e consulta de matrículas atualizadas diretamente no Cartório de Registro de Imóveis.',
    price: 4990, // R$ 49,90 (centavos)
    quantity: 1,
    billingCycle: 'avulso',
    badge: 'Adicional',
    features: [
      'Consulta de matrícula atualizada em minutos',
      'Validação jurídica da titularidade e gravames',
      'Histórico de ônus reais e averbações',
      'Integração instantânea com o dossiê do imóvel'
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

export async function GET() {
  try {
    const token = process.env.ABACATE_PAY_TOKEN || await getSecret('ABACATE_PAY_TOKEN');

    if (!token) {
      console.warn('[AbacatePay] ABACATE_PAY_TOKEN não configurado. Utilizando fallback gracioso com dados de demonstração.');
      return NextResponse.json<AbacatePayApiResponse>({
        data: MOCK_PRODUCTS,
        success: true,
        error: null,
        isFallback: true
      });
    }

    const response = await fetch('https://api.abacatepay.com/v2/products/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AbacatePay] Erro na API (${response.status}):`, errorText);
      
      // Fallback gracioso em caso de erro da API remota
      return NextResponse.json<AbacatePayApiResponse>({
        data: MOCK_PRODUCTS,
        success: true,
        error: null,
        isFallback: true
      });
    }

    const result = await response.json();

    // Tratamento do envelope de resposta v2: { "data": [...], "success": true, "error": null }
    let products: AbacatePayProduct[] = [];
    if (Array.isArray(result)) {
      products = result;
    } else if (result && Array.isArray(result.data)) {
      products = result.data;
    } else if (result && result.products && Array.isArray(result.products)) {
      products = result.products;
    } else {
      products = MOCK_PRODUCTS;
    }

    return NextResponse.json<AbacatePayApiResponse>({
      data: products,
      success: true,
      error: null,
      isFallback: false
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[AbacatePay] Exceção na chamada da API Abacate Pay:', error?.message || error);
    
    // Fallback gracioso em caso de erro de conexão ou timeout
    return NextResponse.json<AbacatePayApiResponse>({
      data: MOCK_PRODUCTS,
      success: true,
      error: null,
      isFallback: true
    });
  }
}

import { AIService } from './aiService';

export interface RegionalFeature {
  title: string;
  description: string;
}

export interface RegionalContext {
  summary: string;
  features: RegionalFeature[];
  updatedAt: string;
  source: string;
  reliability: string;
}

const regionalCache = new Map<string, { timestamp: number; data: RegionalContext }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export class RegionalContextService {
  public static async getRegionalContext(bairro: string, cidade: string, estado: string): Promise<RegionalContext> {
    const cleanBairro = (bairro || 'Região').trim();
    const cleanCidade = (cidade || '').trim();
    const cleanEstado = (estado || '').trim();

    const cacheKey = `${cleanBairro.toLowerCase()}_${cleanCidade.toLowerCase()}_${cleanEstado.toLowerCase()}`;
    const cached = regionalCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const prompt = `
Aja como um analista urbano e especialista em inteligência territorial imobiliária.
Gere um contexto regional estritamente factual, original e neutro para o seguinte local:
Bairro: ${cleanBairro}
Cidade: ${cleanCidade}
Estado: ${cleanEstado}

REGRAS OBRIGATÓRIAS:
1. NÃO invente dados, preços, distâncias ou nomes de estabelecimentos específicos.
2. NÃO utilize termos de apelo de marketing exagerados (ex: "bairro mais nobre", "melhor investimento", "alta valorização garantida").
3. NÃO inclua links, URLs ou referências a fontes externas (Google, YouTube, etc.).
4. Forneça o resultado em formato JSON válido com a seguinte estrutura exata:
{
  "summary": "Um parágrafo coeso e original descrevendo o perfil urbano, localização e características da região.",
  "features": [
    {
      "title": "Categoria (ex: Orla e lazer, Gastronomia, Comércio e serviços, Mobilidade, Educação, Saúde, Turismo)",
      "description": "Descrição factual de 1 a 2 frases sobre este aspecto na região."
    }
  ]
}
Retorne APENAS o JSON puro, sem blocos de código markdown ou texto adicional.
`;

    try {
      const responseText = await AIService.generate(prompt);
      
      if (!responseText.startsWith('Erro na geração de IA:')) {
        // Limpar blocos de código markdown se houver
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (parsed && typeof parsed.summary === 'string' && Array.isArray(parsed.features)) {
          const result: RegionalContext = {
            summary: parsed.summary,
            features: parsed.features,
            updatedAt: new Date().toISOString(),
            source: 'ai_synthesis',
            reliability: 'medium'
          };

          regionalCache.set(cacheKey, {
            timestamp: now,
            data: result
          });

          return result;
        }
      }
    } catch (error) {
      console.error('Erro ao processar resposta do contexto regional via IA:', error);
    }

    // Fallback factual estruturado e robusto (nunca retorna null)
    const fallback: RegionalContext = {
      summary: `Este imóvel está localizado no bairro ${cleanBairro}, na cidade de ${cleanCidade} - ${cleanEstado}. A região apresenta características urbanas consolidadas, oferecendo infraestrutura de suporte local e acesso às vias principais para moradores e visitantes.`,
      features: [
        {
          title: "Localização",
          description: `Bairro ${cleanBairro} situado em ${cleanCidade} (${cleanEstado}), com conectividade viária e proximidade aos pontos de interesse da região.`
        },
        {
          title: "Infraestrutura Local",
          description: "Área urbana equipada com comércios locais, serviços essenciais e conveniências para o dia a dia."
        }
      ],
      updatedAt: new Date().toISOString(),
      source: 'fallback_factual',
      reliability: 'medium'
    };

    regionalCache.set(cacheKey, {
      timestamp: now,
      data: fallback
    });

    return fallback;
  }
}

'use server';
/**
 * @fileOverview A property search AI agent that can be used to power a chatbot.
 *
 * This file defines a Genkit flow that acts as a conversational AI agent
 * for searching and providing information about real estate properties.
 *
 * - propertyChatAgent - The main chat agent flow.
 * - getPropertyInformation - A tool used by the agent to fetch property data.
 * - GetPropertyInformationInput - The input schema for the getPropertyInformation tool.
 * - GetPropertyInformationOutput - The output schema for the getPropertyInformation tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  defineTool,
  generate,
} from 'genkit/ai';
import { MessageData, Part, Role, toJSONSchema } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';
import { type MessageData as GenkitMessageData, type Part as GenkitPart } from 'genkit';


const GetPropertyInformationInputSchema = z.object({
  city: z.string().optional().describe('A cidade onde o imóvel está localizado, por exemplo, "João Pessoa".'),
  bedrooms: z.string().optional().describe('O número de quartos que o imóvel deve ter.'),
  priceMin: z.number().optional().describe('O preço mínimo do imóvel.'),
  priceMax: z.number().optional().describe('O preço máximo do imóvel.'),
});
export type GetPropertyInformationInput = z.infer<typeof GetPropertyInformationInputSchema>;

const GetPropertyInformationOutputSchema = z.object({
  properties: z.array(z.object({
    name: z.string().describe('O nome do imóvel.'),
    city: z.string().describe('A cidade onde o imóvel está localizado.'),
    bedrooms: z.string().describe('O número de quartos do imóvel.'),
    price: z.string().describe('O preço do imóvel, formatado como "R$ X.XXX.XXX,XX".'),
    url: z.string().describe('A URL completa para a página de detalhes do imóvel.'),
  })).describe('Uma lista de imóveis que correspondem aos critérios de busca.'),
});
export type GetPropertyInformationOutput = z.infer<typeof GetPropertyInformationOutputSchema>;


const formatPrice = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const displayBedrooms = (bedrooms: string[] | string | undefined): string => {
    if (!bedrooms || bedrooms.length === 0) return 'N/A';
    if (Array.isArray(bedrooms)) return bedrooms.join(', ');
    return bedrooms;
};

export const getPropertyInformation = defineTool(
  {
    name: 'getPropertyInformation',
    description: 'Obtém informações sobre imóveis com base em critérios como cidade, número de quartos e faixa de preço. Use esta ferramenta para responder a perguntas sobre imóveis disponíveis.',
    inputSchema: GetPropertyInformationInputSchema,
    outputSchema: GetPropertyInformationOutputSchema,
  },
  async (input: GetPropertyInformationInput) => {
    const buildersSnapshot = await getDocs(query(collection(db, 'builders'), where('isVisibleOnSite', '==', true)));
    const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

    if (visibleBuilderIds.length === 0) {
      return { properties: [] };
    }
    
    let constraints = [
      where('isVisibleOnSite', '==', true)
    ];

    if (input.city) {
      constraints.push(where('localizacao.cidade', '==', input.city));
    }
    if (input.priceMin) {
      constraints.push(where('informacoesbasicas.valor', '>=', input.priceMin));
    }
    if (input.priceMax) {
      constraints.push(where('informacoesbasicas.valor', '<=', input.priceMax));
    }
    
    const allProperties = await queryInBatches<Property>(
      'properties',
      'builderId',
      visibleBuilderIds,
      constraints
    );

    let filteredProperties = allProperties;
    if (input.bedrooms) {
        filteredProperties = allProperties.filter(p => {
            const propQuartos = p.caracteristicasimovel.unidades.quartos;
            if (!propQuartos) return false;
            if (Array.isArray(propQuartos)) return propQuartos.includes(input.bedrooms!);
            return propQuartos === input.bedrooms;
        });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br';

    const properties = filteredProperties.map(p => ({
        name: p.informacoesbasicas.nome,
        city: p.localizacao.cidade || 'N/A',
        bedrooms: displayBedrooms(p.caracteristicasimovel.unidades.quartos),
        price: formatPrice(p.informacoesbasicas.valor),
        url: `${baseUrl}/imoveis/${p.slug || p.id}`,
    }));

    return { properties };
  }
);

const propertyChatAgent = ai.defineFlow(
  {
    name: 'propertyChatAgent',
    inputSchema: z.array(z.custom<MessageData>()),
    outputSchema: z.custom<Part>(),
  },
  async (messages) => {
    const systemPrompt = `Você é o "Corretor Virtual Oraora", um assistente de IA amigável e prestativo especializado em ajudar os usuários a encontrar imóveis. Sua principal função é usar a ferramenta 'getPropertyInformation' para buscar imóveis que correspondam aos critérios do usuário.

    Diretrizes de Interação:
    1. Sempre se apresente como "Corretor Virtual Oraora" em sua primeira mensagem.
    2. Faça perguntas para esclarecer os critérios de busca do usuário, como cidade, número de quartos e faixa de preço, caso não sejam fornecidos.
    3. Use a ferramenta 'getPropertyInformation' sempre que tiver informações suficientes para uma busca.
    4. Ao apresentar os resultados, liste cada imóvel de forma clara com seu nome, cidade, número de quartos e preço. Forneça sempre o link (URL) para cada imóvel.
    5. Se nenhum imóvel for encontrado, informe o usuário de forma amigável e sugira que ele refine seus critérios de busca.
    6. Seja sempre educado, profissional e use uma linguagem clara e acessível em português do Brasil.`;
    
    const model = ai.model('gemini-2.0-flash');

    const history: GenkitMessageData[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content.map(part => {
        if ('toolRequest' in part) {
          // A IA está solicitando o uso de uma ferramenta.
          return { toolRequest: part.toolRequest };
        }
        if ('toolResponse' in part) {
          // Estamos fornecendo o resultado de uma ferramenta.
          return { toolResponse: part.toolResponse };
        }
        // É uma mensagem de texto simples.
        return { text: part.text ?? '' };
      })
    }));

    const response = await generate({
      model: model,
      tools: [getPropertyInformation],
      prompt: systemPrompt,
      history: history,
      config: {
        temperature: 0.3,
      },
    });

    return response.output()!.content[0] as Part;
  }
);

export { propertyChatAgent };

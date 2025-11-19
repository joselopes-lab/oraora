'use server';

/**
 * @fileOverview This file defines a Genkit flow for discovering new home builder companies in Brazil.
 *
 * - discoverBuilders - A function that takes a list of existing builder names and returns a list of new ones not present in the input list.
 * - DiscoverBuildersInput - The input type for the discoverBuilders function.
 * - DiscoverBuildersOutput - The return type for the discoverBuilders function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiscoverBuildersInputSchema = z.object({
  existingBuilderNames: z.array(z.string()).describe('A list of home builder names that are already known.'),
  state: z.string().optional().describe('The Brazilian state (e.g., "SP", "RJ") to focus the search on.'),
  city: z.string().optional().describe('The city to focus the search on.'),
});
export type DiscoverBuildersInput = z.infer<typeof DiscoverBuildersInputSchema>;

const DiscoveredBuilderSchema = z.object({
    name: z.string().describe('The official name of the home builder company.'),
    website: z.string().url().describe('The official website URL of the home builder.'),
    address: z.string().optional().describe('The full physical address of the company headquarters.'),
    city: z.string().optional().describe('The city where the company is located.'),
    state: z.string().optional().describe('The state (e.g., "SP", "RJ") where the company is located.'),
    phone: z.string().optional().describe('The main contact phone number.'),
    whatsapp: z.string().optional().describe('The main WhatsApp contact number.'),
    email: z.string().optional().describe('The main contact email address.'),
    instagram: z.string().optional().describe('The company\'s Instagram handle, like "@username".'),
});

const DiscoverBuildersOutputSchema = z.object({
  discoveredBuilders: z.array(DiscoveredBuilderSchema).describe('A list of newly discovered home builder companies.'),
});
export type DiscoverBuildersOutput = z.infer<typeof DiscoverBuildersOutputSchema>;

export async function discoverBuilders(input: DiscoverBuildersInput): Promise<DiscoverBuildersOutput> {
  return discoverBuildersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'discoverBuildersPrompt',
  input: { schema: DiscoverBuildersInputSchema },
  output: { schema: DiscoverBuildersOutputSchema },
  prompt: `Você é um especialista em pesquisa de mercado do setor imobiliário no Brasil.
Sua tarefa é encontrar 10 novas construtoras e incorporadoras que estão ativas no mercado brasileiro.

{{#if state}}
FOCO DA BUSCA: Sua pesquisa deve se concentrar em empresas localizadas em {{#if city}}{{city}} - {{/if}}{{state}}.
{{/if}}

A lista a seguir contém construtoras que já conhecemos. Você DEVE encontrar empresas que NÃO estão nesta lista:
{{#each existingBuilderNames}}
- {{this}}
{{/each}}

Critérios para sua busca:
1.  A empresa deve ser uma construtora ou incorporadora brasileira.
2.  **CRÍTICO: O site oficial da empresa DEVE estar funcional e acessível. Verifique o site antes de incluir a empresa na lista.**
3.  A empresa deve ter projetos imobiliários (lançamentos ou prontos) claramente visíveis em seu site.
4.  Não inclua empresas que já estão na lista fornecida.

Para cada nova empresa encontrada, forneça o máximo de informações de contato que puder encontrar publicamente no site ou em fontes confiáveis:
- Nome oficial
- URL do site
- Endereço físico completo (se disponível)
- Cidade
- Estado (sigla, ex: SP)
- Telefone principal
- WhatsApp (se disponível)
- E-mail de contato
- Usuário do Instagram (ex: @username)

Estruture a saída conforme o schema JSON solicitado.`,
});

const discoverBuildersFlow = ai.defineFlow(
  {
    name: 'discoverBuildersFlow',
    inputSchema: DiscoverBuildersInputSchema,
    outputSchema: DiscoverBuildersOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

import { EditorialRules } from './types';

/**
 * @fileOverview Regras de SEO, GEO e AI do Editorial Engine.
 */

export const ORAORA_EDITORIAL_RULES: EditorialRules = {
  tone: [
    "Elegante",
    "Profissional",
    "Consultivo",
    "Baseado em evidências"
  ],
  mandatory: [
    "Apenas fatos comprovados",
    "Citação de fontes obrigatória",
    "Sem promessas de ganhos financeiros"
  ],
  seo: {
    keywordDensity: "1.5% a 2.5%",
    headingStructure: "H1 único, seguido de H2 e H3 em ordem lógica",
    internalLinking: "Mínimo de 2 links para outras entidades do Knowledge Graph"
  },
  aiProtocol: [
    "1. Recuperar contexto do KnowledgeService.",
    "2. Pesquisar referências externas (se habilitado).",
    "3. Cruzar informações de múltiplas fontes.",
    "4. Validar dados técnicos contra o inventário real.",
    "5. Identificar e relatar conflitos de dados no log.",
    "6. Redigir seguindo o template correspondente."
  ]
};

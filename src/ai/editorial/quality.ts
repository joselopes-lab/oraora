/**
 * @fileOverview Sistema de Score de Qualidade e Checklist Editorial.
 */

export const CONTENT_QUALITY_SCORE_CRITERIA = [
  { factor: "SEO", weight: 0.20, description: "Otimização de palavras-chave e meta tags." },
  { factor: "Factual Accuracy", weight: 0.30, description: "Conformidade com os dados reais do sistema." },
  { factor: "Readability", weight: 0.15, description: "Clareza, fluidez e tom de voz." },
  { factor: "Authority", weight: 0.15, description: "Citação de fontes e profundidade técnica." },
  { factor: "GEO Readiness", weight: 0.20, description: "Estruturação para motores generativos." }
];

export const EDITORIAL_CHECKLIST = [
  "Dados reais conferidos via Knowledge Graph?",
  "Estrutura H1-H3 respeita o template?",
  "Links internos para bairros/construtoras presentes?",
  "CTA está alinhado com o objetivo da página?",
  "Ausência de linguagem sensacionalista?",
  "Metadados JSON-LD preparados?",
  "Fontes citadas corretamente?"
];

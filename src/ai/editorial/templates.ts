import { ContentType, ContentTemplate } from './types';

/**
 * @fileOverview Templates de estrutura de conteúdo para o Editorial Engine.
 */

export const EDITORIAL_TEMPLATES: Record<ContentType, ContentTemplate> = {
  cidade: {
    title: "Panorama de Mercado: {cidade}",
    sections: 4,
    wordCount: { min: 400, max: 600 },
    structure: {
      h1: "Análise Imobiliária de {cidade}",
      h2: ["Infraestrutura e Mobilidade", "Perfil do Mercado Imobiliário", "Principais Vetores de Crescimento"],
      cta: "Explorar imóveis em {cidade}",
      conclusion: true
    }
  },
  bairro: {
    title: "Guia do Bairro: {bairro}, {cidade}",
    sections: 5,
    wordCount: { min: 300, max: 500 },
    structure: {
      h1: "Viver no {bairro}: O que você precisa saber",
      h2: ["Estilo de Vida e Comodidades", "Valorização do m² no {bairro}", "Segurança e Lazer"],
      h3: ["Destaques da Região"],
      cta: "Ver oportunidades no {bairro}",
      conclusion: true
    }
  },
  construtora: {
    title: "Construtora {nome}: Legado e Qualidade",
    sections: 3,
    wordCount: { min: 300, max: 450 },
    structure: {
      h1: "Portfólio e DNA da Construtora {nome}",
      h2: ["Padrão de Acabamento", "Histórico de Entregas"],
      cta: "Conhecer empreendimentos da {nome}",
      conclusion: true
    }
  },
  empreendimento: {
    title: "Dossiê: {nome}",
    sections: 5,
    wordCount: { min: 400, max: 700 },
    structure: {
      h1: "Detalhes do Empreendimento {nome}",
      h2: ["Conceito Arquitetônico", "Diferenciais Técnicos", "Áreas Comuns e Lazer"],
      h3: ["Tipologias Disponíveis"],
      cta: "Receber material completo do {nome}",
      conclusion: true
    }
  },
  condominio: {
    title: "Condomínio {nome}: Infraestrutura",
    sections: 3,
    wordCount: { min: 250, max: 400 },
    structure: {
      h1: "Viver no Condomínio {nome}",
      h2: ["Segurança e Serviços", "Localização Interna"],
      cta: "Ver unidades no {nome}",
      conclusion: true
    }
  },
  corretor: {
    title: "Consultoria: {nome}",
    sections: 3,
    wordCount: { min: 300, max: 500 },
    structure: {
      h1: "Estratégia de Atendimento: {nome}",
      h2: ["Especialidades e Foco", "Diferenciais Competitivos"],
      cta: "Falar com {nome}",
      conclusion: true
    }
  },
  artigo: {
    title: "{titulo}",
    sections: 4,
    wordCount: { min: 600, max: 1200 },
    structure: {
      h1: "{titulo}",
      h2: ["Análise de Contexto", "Implicações para o Investidor"],
      cta: "Consultar especialista",
      conclusion: true
    }
  },
  'landing-page': {
    title: "Oportunidade: {oferta}",
    sections: 6,
    wordCount: { min: 500, max: 800 },
    structure: {
      h1: "{headline_impactante}",
      h2: ["O Ativo", "A Região", "Potencial Financeiro"],
      cta: "Garantir Reserva",
      conclusion: false
    }
  },
  faq: {
    title: "Dúvidas Frequentes: {contexto}",
    sections: 1,
    wordCount: { min: 150, max: 400 },
    structure: {
      h1: "Principais dúvidas sobre {contexto}",
      h2: ["Perguntas Técnicas"],
      cta: "Tirar outra dúvida",
      conclusion: false
    }
  },
  'institucional': {
    title: "Oraora: {pagina}",
    sections: 3,
    wordCount: { min: 300, max: 600 },
    structure: {
      h1: "{titulo_institucional}",
      h2: ["Nossa Missão", "Tecnologia e Transparência"],
      cta: "Entrar para a rede",
      conclusion: true
    }
  }
};

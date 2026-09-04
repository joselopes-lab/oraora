export interface CorretorCampanha {
  id: string;
  slug: string;
  nome: string;
  fotoUrl: string;
  fotoOohUrl?: string; // Fotografia de alta resolução em painel/outdoor (opcional)
  especialidade: string;
  cidade: string;
  estado: string; // Ex: "SP", "RJ"
  creci: string; // Marcado como [Exemplo Mock]
  site?: string;
  instagram?: string;
  frase: string;
  biografia: string;
  destaqueOoh?: boolean; // Se é destaque principal nos mockups urbanos
  ordemExibicao: number;
}

export const CORRETORES_MOCK_CAMPANHA: CorretorCampanha[] = [
  {
    id: "corretor-01",
    slug: "carla-lira",
    nome: "Carla Lira [Perfil Exemplo Mock]",
    fotoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    fotoOohUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=85",
    especialidade: "Imóveis de Alto Padrão",
    cidade: "São Paulo",
    estado: "SP",
    creci: "CRECI 000000-F [Exemplo]",
    site: "https://exemplo-carlalira.com.br",
    instagram: "@carlalira.imoveis.exemplo",
    frase: "Mais do que encontrar um imóvel, gosto de ajudar pessoas a encontrar o lugar certo para uma nova fase.",
    biografia: "Com mais de 12 anos de atuação no mercado imobiliário paulistano, Carla construiu sua trajetória baseada em escuta ativa, discrição e rigor técnico na condução de grandes negociações.",
    destaqueOoh: true,
    ordemExibicao: 1,
  },
  {
    id: "corretor-02",
    slug: "marcelo-ribeiro",
    nome: "Marcelo Ribeiro [Perfil Exemplo Mock]",
    fotoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80",
    fotoOohUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1600&q=85",
    especialidade: "Lançamentos e Investimentos",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    creci: "CRECI 00000-F [Exemplo]",
    site: "https://exemplo-marceloribeiro.com.br",
    instagram: "@marceloribeiro.imoveis",
    frase: "O mercado é feito de números, mas a decisão é sempre humana.",
    biografia: "Especialista em análise de viabilidade e investimentos residenciais na Zona Sul carioca. Conecta investidores a oportunidades exclusivas com transparência e agilidade.",
    destaqueOoh: true,
    ordemExibicao: 2,
  },
  {
    id: "corretor-03",
    slug: "beatriz-siqueira",
    nome: "Beatriz Siqueira [Perfil Exemplo Mock]",
    fotoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1200&q=80",
    fotoOohUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1600&q=85",
    especialidade: "Residencial e Famílias",
    cidade: "Curitiba",
    estado: "PR",
    creci: "CRECI 00000-F [Exemplo]",
    site: "https://exemplo-beatrizsiqueira.com.br",
    instagram: "@beatrizsiqueira.imoveis",
    frase: "Cada chave entregue representa um novo capítulo na vida de uma família.",
    biografia: "Apaixonada por transformar o processo de mudança em uma experiência leve e segura. Atua fortemente auxiliando famílias na conquista do primeiro imóvel e expansão patrimonial.",
    destaqueOoh: false,
    ordemExibicao: 3,
  },
  {
    id: "corretor-04",
    slug: "gabriel-moraes",
    nome: "Gabriel Moraes [Perfil Exemplo Mock]",
    fotoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
    fotoOohUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1600&q=85",
    especialidade: "Comercial e Corporativo",
    cidade: "Belo Horizonte",
    estado: "MG",
    creci: "CRECI 00000-F [Exemplo]",
    instagram: "@gabrielmoraes.negocios",
    frase: "Negócios imobiliários sólidos nascem de parcerias de longo prazo.",
    biografia: "Focado em galpões logísticos, salas comerciais e grandes áreas corporativas em Minas Gerais. Estrutura operações complexas com rigor técnico e proximidade.",
    destaqueOoh: false,
    ordemExibicao: 4,
  },
];

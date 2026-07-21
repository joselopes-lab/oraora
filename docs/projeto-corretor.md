# Oraora: Ecossistema de Inteligência Imobiliária

Este documento descreve as funcionalidades e a arquitetura do projeto Oraora, uma plataforma SaaS de alta performance para corretores de imóveis, construtoras e clientes finais.

## 1. Arquitetura e Infraestrutura
*   **Framework**: Next.js 15 (App Router) com TypeScript.
*   **Estilização**: Tailwind CSS com componentes Shadcn/UI e sistema de temas dinâmicos (HSL).
*   **Backend**: Firebase (Firestore para dados, Auth para usuários, Storage para mídia).
*   **Multi-Tenancy**: Sistema que permite que cada corretor tenha seu próprio site público em um subdomínio ou caminho específico (ex: `oraora.com.br/sites/slug-do-corretor`).
*   **Domínios Customizados**: Integração com Google App Hosting para registro e validação de domínios próprios, com geração automática de SSL e gestão de registros DNS (Apex e WWW).

## 2. Funcionalidades para o Corretor (Broker)
### Gestão de Site e Marca
*   **Editor de Conteúdo**: Interface para editar Home, Sobre, Serviços e Contato sem código.
*   **Customização Visual**: Alteração dinâmica de cores (Primary/Secondary) e troca de imagens de layout.
*   **Carteira de Destaques**: Seletor de imóveis (globais de construtoras ou avulsos) para exibição na vitrine do site.
*   **Oralink**: Cartão de visitas digital (estilo Linktree) com links sociais, vitrine de imóveis e QR Code gerado em alta definição para impressão.

### CRM e Vendas
*   **Funil de Vendas (Kanban)**: Gestão de leads por etapas (Prospecção, Visitas, Proposta, Fechamento) com histórico de mudanças e rastreamento de tempo por etapa.
*   **Dossiê do Cliente**: Visão 360º do lead, incluindo documentos, notas internas, histórico de atividades e propostas.
*   **Jornada de Compra**: Acompanhamento estruturado do progresso da venda, com checklists de documentação e financiamento bancário.

### Ferramentas de Produtividade
*   **Agenda Inteligente**: Gestão de visitas, reuniões e tarefas com vinculação direta a clientes.
*   **Controle Financeiro**: Fluxo de caixa com receitas (comissões) e despesas, suporte a parcelamentos, recorrência e metas mensais.

## 3. Funcionalidades de Inteligência Artificial (Genkit)
*   **Inteligência de Mercado (FipeZAP)**: IA que analisa imagens de relatórios imobiliários, extrai dados de m² e gera insights analíticos e roteiros de venda (Pitch) em linguagem natural.
*   **Análise de Investimento**: Sistema que compara o preço do m² do imóvel com a média do bairro e projeta valorização para 6, 12 e 24 meses.
*   **Recomendações Preditivas**: Sistema que cruza o perfil do cliente (Persona) com o inventário disponível para sugerir os imóveis com maior probabilidade de fechamento.
*   **Gerador de Conteúdo e SEO**: IA que cria textos para o site e gera metadados otimizados para anúncios.

## 4. Experiência do Cliente (Portal Radar)
*   **Painel do Cliente**: Área logada para o comprador acompanhar recomendações e salvar favoritos.
*   **Comparador Lado a Lado**: Ferramenta para comparar atributos técnicos (m², quartos, vagas) de até 3 imóveis salvos.
*   **Busca com Mapa**: Filtros dinâmicos (via BrasilAPI) e mapa interativo com pontos de interesse (escolas, bancos, etc.) próximos ao imóvel.

## 5. Módulos Administrativos (Admin Manager)
O Gestor Administrativo é o cérebro da operação, permitindo o controle total da plataforma SaaS.

### Gestão de Inteligência (BI)
*   **Alimentação de Mercado**: Interface para upload de relatórios (FipeZAP) onde a IA extrai automaticamente preços por bairro e variações, populando o banco de dados de inteligência da rede.
*   **Curadoria de Insights**: Revisão e publicação de scripts de venda e análises de tendência geradas por IA para os corretores.

### Monitoramento de Performance
*   **Dashboard de Acessos**: Visualização em tempo real de hits nos sites dos corretores e nos links do Oralink.
*   **Métricas de Conversão**: Rastreamento de quantos acessos se transformam em leads reais, permitindo identificar os parceiros mais performantes.

### Gestão de Rede e Usuários
*   **Controle de Usuários**: Gestão completa de permissões para Administradores, Corretores, Construtoras e Clientes.
*   **Fila de Convites**: Sistema de triagem para novos corretores interessados em entrar na plataforma.
*   **Importação Massiva**: Ferramenta para importar grandes bases de imóveis e construtoras via JSON.

### Gestão do Produto (SaaS)
*   **Configuração de Planos**: Definição de preços, ciclos de cobrança e limites técnicos (ex: limite de imóveis por plano).
*   **Editor do Portal Principal**: Gestão de todo o conteúdo da landing page institucional do Oraora.

### Comunicação e Suporte
*   **Sistema de Comunicados**: Envio de avisos globais ou segmentados (ex: apenas para construtoras) com agendamento.
*   **Central de Suporte (Tickets)**: Sistema de Help Desk para gerenciar dúvidas e problemas técnicos dos usuários da plataforma.

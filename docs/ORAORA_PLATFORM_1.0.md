# ORAORA PLATFORM 1.0 - ARQUITETURA DE TEMAS
Documento Oficial de Referência Técnica e Executiva

---

## 1. VISÃO GERAL DA ARQUITETURA

A plataforma Oraora utiliza uma arquitetura desacoplada e baseada em contratos para a entrega de sites personalizados. O fluxo de carregamento foi desenhado para garantir que o núcleo do sistema permaneça agnóstico ao design visual escolhido pelo usuário.

**Fluxo de Carregamento:**
1.  **BrokerSitePage (Host Controller):** Detecta a requisição e busca o ID do tema no banco de dados.
2.  **Theme Loader:** Atua como o motor de busca, traduzindo o ID em uma definição técnica.
3.  **Theme Registry:** Centraliza o registro e a importação dinâmica de todos os layouts.
4.  **Theme SDK:** Garante que o layout receba exatamente os dados necessários via Props Oficiais.
5.  **Layout Component:** Renderiza a interface final baseada nos dados injetados.

---

## 2. THEME SDK

O SDK é o contrato de comunicação entre a plataforma e o tema. Ele estabelece padrões rígidos para evitar que alterações visuais quebrem funcionalidades do sistema.

*   **LayoutProps:** Interface única de entrada contendo: Broker (perfil), Properties (imóveis), Content (textos de IA), Theme (cores), SEO (metadados) e Settings (regras de negócio).
*   **Manifest:** Metadados técnicos que descrevem o que o tema é e o que ele suporta.
*   **Config:** Definições de estilo (tokens) que orientam o comportamento visual do tema.
*   **Componentes:** Incentivo à reutilização de bibliotecas compartilhadas (Shadcn/UI) para manter a consistência e performance.

---

## 3. THEME REGISTRY

O Registry é o "Catálogo Técnico" da plataforma. É onde cada layout é oficialmente registrado para tornar-se carregável.

*   **Registro Centralizado:** Um único dicionário mestre onde novos temas são adicionados.
*   **Loader Inteligente:** Função responsável por instanciar o componente correto em tempo de execução.
*   **Fallback de Segurança:** Caso um tema seja desativado ou não encontrado, o sistema redireciona automaticamente para o layout padrão (Urban Padrão), garantindo que o site do cliente nunca fique fora do ar.

---

## 4. THEME CATALOG

Diferente do Registry, o Catalog gerencia a camada comercial e de marketing dos temas.

*   **Separação de Responsabilidades:** O Layout não sabe quanto custa ou em qual plano ele está incluído. Essas informações residem no Catálogo.
*   **CatalogService:** Camada de serviço que realiza o "join" entre o componente técnico e as informações de venda (preço, destaques, ordem na loja).
*   **Preparação para o Futuro:** Estrutura pronta para transição imediata de dados estáticos para dinâmicos (Firestore) sem alterar as interfaces.

---

## 5. THEME CENTER (ADMIN)

Módulo exclusivo para o Super Admin gerenciar o ecossistema de layouts sem tocar no código-fonte.

*   **Fluxo de Gestão:** Interface executiva para monitorar versões, autores e status de publicação.
*   **Metadados:** Edição de descrições comerciais, categorias e tags.
*   **Publicação Controlada:** Suporte a estágios de lançamento (Ativo, Oculto, Beta, Arquivado).

---

## 6. THEME PREVIEW ENGINE

Ambiente de "SandBox" que permite a visualização real de temas antes da ativação.

*   **Injeção de Dados Reais:** O motor utiliza os imóveis e o conteúdo de IA do próprio corretor para renderizar o preview.
*   **Simulador de Dispositivos:** Interface para testar a responsividade em Desktop, Notebook, Tablet e Mobile.
*   **Segurança:** O Preview ocorre estritamente no lado do cliente, sem permissão de escrita no banco de dados.

---

## 7. THEME ACTIVATION

Processo simplificado de persistência da escolha do usuário.

*   **Ativação Atômica:** A troca de tema altera apenas o campo "layoutId" no documento do corretor.
*   **Integridade:** Não há movimentação, duplicação ou alteração nos dados de imóveis ou de biografia durante a troca de visual.
*   **Velocidade:** Como os dados são os mesmos, a transição é percebida instantaneamente pelo usuário.

---

## 8. LAYOUTS OFICIAIS

A plataforma nasce com cinco layouts de referência:

*   **Urban Padrão:** Layout clássico, focado em performance (Legacy Compatível).
*   **Domus Luxury:** Design sofisticado para alto padrão (Legacy Compatível).
*   **Living Modern:** Equilíbrio entre modernidade e simplicidade (Legacy Compatível).
*   **Aura Clean:** Primeiro layout construído 100% sob o SDK 1.0.
*   **Vertex Premium:** Flagship de design minimalista e disruptivo (SDK 1.0).

---

## 9. REGRAS DE ARQUITETURA (GUARDA-CORPOS)

Para garantir a estabilidade e a segurança da rede, as seguintes regras são imutáveis:

1.  **Proibido Acesso Direto:** Nenhum layout pode consultar o Firestore ou Storage diretamente.
2.  **Isolamento de Lógica:** Layouts não criam Hooks, Providers ou APIs. São componentes de apresentação.
3.  **Contrato Único:** Todos os dados devem obrigatoriamente entrar via LayoutProps.
4.  **Imutabilidade do Core:** Layouts não podem alterar fluxos de IA, regras de SEO ou lógica de Middleware.

---

## 10. PADRÃO PARA NOVOS TEMAS (CHECKLIST)

Para adicionar um novo tema à plataforma, o desenvolvedor deve seguir estes passos:

1.  Criar diretório em `src/layouts/`.
2.  Definir `manifest.ts` (Identidade e Suporte).
3.  Definir `config.ts` (Estilo e Variantes).
4.  Desenvolver `Layout.tsx` (Renderização via Props).
5.  Registrar no `Theme Registry` (Vínculo Técnico).
6.  Registrar no `Theme Catalog` (Vínculo Comercial).
7.  Adicionar imagens de `preview` e `thumbnail` no repositório.

---

## 11. ROADMAP DE EVOLUÇÃO

*   **Fase 2:** Implementação de Licenciamento e Marketplace (Venda de Temas).
*   **Fase 3:** Widgets de IA embutidos nos layouts.
*   **Fase 4:** Construtor de Blocos Dinâmicos (Drag & Drop).
*   **Fase 5:** Pacotes de Layouts por nível de Assinatura (Theme Commerce).

---

## 12. OBJETIVO FINAL

A Oraora Platform 1.0 foi concebida para ser uma infraestrutura autossustentável. O objetivo final é permitir que a biblioteca de temas cresça de forma orgânica e ilimitada, transformando o Oraora na maior vitrine de tecnologia e design imobiliário do mercado, sem nunca comprometer a integridade do seu núcleo de dados.
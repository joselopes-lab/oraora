
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-start gap-4">
            <HelpCircle className="h-10 w-10 mt-2 text-primary"/>
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Central de Ajuda</h1>
                <p className="text-lg text-muted-foreground">Encontre guias, regras de negócio e como as funcionalidades do sistema operam.</p>
            </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Guia de Funcionalidades</CardTitle>
          <CardDescription>
            Clique nos tópicos abaixo para expandir e ver os detalhes de cada módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            
            <AccordionItem value="imoveis" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Imóveis
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades e Campos Obrigatórios:</h4>
                <ul>
                  <li><strong>Nome do Imóvel:</strong> O identificador principal do empreendimento.</li>
                  <li><strong>Descrição:</strong> Um texto detalhando as características e atrativos.</li>
                  <li><strong>Construtora:</strong> Todo imóvel deve ser associado a uma construtora para garantir a correta vinculação dos dados.</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Geração Automática de URL (Slug):</strong> Ao criar um novo imóvel, a URL amigável é gerada automaticamente a partir do nome para otimização em buscadores (SEO). É crucial que o slug seja único.</li>
                  <li><strong>Visibilidade no Site:</strong> A chave "Visível no site público" controla se o imóvel aparece para os usuários finais. Por padrão, novos imóveis são visíveis.</li>
                  <li><strong>Associação com Personas:</strong> Imóveis podem ser vinculados a um ou mais perfis de compradores (Personas), facilitando a recomendação para clientes e a busca segmentada no site.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="importar_imoveis" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Importar Imóveis
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>Permite cadastrar múltiplos imóveis de uma só vez através do upload de um arquivo CSV, agilizando o processo de inserção de dados em grande escala.</p>
                <h4>Passo a Passo:</h4>
                <ol>
                    <li>Na página de Imóveis, clique em <strong>"Importar Imóveis"</strong>.</li>
                    <li>Na tela de importação, baixe o <strong>arquivo modelo (.csv)</strong>. Este arquivo contém todas as colunas necessárias e o formato esperado.</li>
                    <li>Preencha a planilha com os dados dos seus imóveis. É fundamental manter a estrutura e os cabeçalhos das colunas exatamente como no modelo.</li>
                    <li>Salve o arquivo preenchido no formato CSV.</li>
                    <li>Arraste e solte o arquivo na área indicada ou clique para selecioná-lo.</li>
                    <li>O sistema irá processar o arquivo, validar os dados e cadastrar os imóveis.</li>
                </ol>
                <h4>Regras de Negócio e Campos Essenciais:</h4>
                <ul>
                  <li><strong>Formato do Arquivo:</strong> Apenas arquivos no formato <strong>CSV</strong> (separado por vírgulas) são aceitos.</li>
                  <li><strong>Estrutura do Modelo:</strong> Não altere os nomes das colunas do arquivo modelo. A ordem e o nome exato são essenciais para que o sistema interprete os dados corretamente.</li>
                  <li><strong>ID da Construtora (`builderId`):</strong> Este é um campo <strong>obrigatório</strong> em cada linha do CSV. Ele garante que cada imóvel seja corretamente associado à sua construtora. Você pode obter o ID da construtora na URL da página de edição da mesma.</li>
                  <li><strong>Campos Mínimos:</strong> Além do `builderId`, os campos `nome`, `cidade` e `estado` são essenciais para um cadastro funcional.</li>
                  <li><strong>Validação de Dados:</strong> O sistema realiza uma validação básica. Se houver erros graves de formato ou falta de dados essenciais, a importação pode falhar.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="construtoras" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Construtoras
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades e Campos Obrigatórios:</h4>
                <ul>
                  <li><strong>Nome da Construtora:</strong> O nome oficial da empresa.</li>
                  <li><strong>Email:</strong> Usado como o login de acesso da construtora ao seu painel exclusivo. Deve ser único.</li>
                  <li><strong>Estado e Cidade:</strong> A localização principal da empresa, usada para filtros e organização.</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Criação Automática de Usuário:</strong> Ao cadastrar uma construtora, um usuário é criado automaticamente no sistema de autenticação, usando o e-mail fornecido.</li>
                  <li><strong>Senha Padrão:</strong> A senha inicial para toda nova construtora é sempre <strong>`@Construtora2025`</strong>. A construtora deve ser orientada a alterá-la no primeiro acesso para garantir a segurança.</li>
                  <li><strong>Painel Exclusivo:</strong> Após o login, o usuário da construtora é redirecionado para um painel específico, onde pode gerenciar apenas seus próprios imóveis e mídias.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="corretores" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Corretores
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades e Campos Obrigatórios:</h4>
                <ul>
                  <li><strong>Nome Completo:</strong> Nome profissional do corretor.</li>
                  <li><strong>E-mail:</strong> Usado para o login, deve ser único.</li>
                  <li><strong>Senha:</strong> Deve seguir as regras de segurança da plataforma.</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Criação de Usuário:</strong> Assim como as construtoras, um usuário de acesso é criado automaticamente no momento do registro.</li>
                  <li><strong>Validação de Senha Forte:</strong> A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um caractere especial.</li>
                  <li><strong>Painel Exclusivo:</strong> Após o login, o corretor é direcionado para o seu dashboard, onde gerencia sua carteira de imóveis, clientes, leads e agenda.</li>
                  <li><strong>Página Pública:</strong> Cada corretor recebe uma página pública (`/corretor-publico/[id]`) que funciona como seu site pessoal, exibindo os imóveis que ele adicionou à sua carteira.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="leads" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Leads
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades e Regras de Negócio:</h4>
                <ul>
                    <li><strong>Visualização Centralizada:</strong> O painel do administrador exibe <strong>todos</strong> os leads gerados na plataforma, seja através do formulário de contato geral ou das páginas de imóveis.</li>
                    <li><strong>Atribuição de Corretores:</strong> Leads gerados pelo formulário principal do site chegam "sem corretor". O administrador pode então atribuir manualmente cada lead a um corretor parceiro.</li>
                    <li><strong>Atribuição Automática:</strong> Leads gerados através de um formulário na página pública de um corretor específico já são automaticamente vinculados a ele.</li>
                    <li><strong>Acompanhamento de Status:</strong> O administrador pode acompanhar o andamento de cada lead, visualizando se o status é "Novo", "Contatado" ou "Fechado" (status gerenciado pelo corretor).</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="personas" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Personas</AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                  <h4>Funcionalidades e Regras de Uso:</h4>
                  <ul>
                      <li><strong>Criação de Perfis:</strong> Defina perfis de compradores (ex: "Investidor Visionário") com critérios específicos como faixa de preço, tipo de imóvel, localização, quartos, vagas e áreas comuns.</li>
                      <li><strong>Popular com Dados Iniciais:</strong> Um botão permite cadastrar 8 personas pré-definidas para um início rápido.</li>
                      <li><strong>Associação a Imóveis:</strong> Vincule imóveis a uma ou mais personas para as quais eles são ideais. Um mesmo imóvel pode servir para várias personas.</li>
                      <li><strong>Filtragem no Site Público:</strong> Na "Área do Cliente", usuários podem selecionar uma persona para ver uma lista de imóveis recomendados para aquele perfil, criando uma vitrine personalizada.</li>
                      <li><strong>Apoio ao Corretor:</strong> Corretores podem associar clientes a personas para receber sugestões de imóveis compatíveis, agilizando o atendimento e as recomendações.</li>
                  </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="clientes" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Clientes Finais
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <ul>
                  <li><strong>Visualização de Clientes Finais:</strong> Lista todos os usuários que se cadastraram na plataforma sem uma função específica de Corretor ou Construtora.</li>
                  <li><strong>Informações de Cadastro:</strong> Exibe dados básicos como nome, e-mail, data de cadastro e status da conta (Ativo/Inativo).</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Origem do Cadastro:</strong> Esses usuários geralmente se registram através da modal de login/cadastro no site público para utilizar funcionalidades como o "Meu Radar" (favoritos).</li>
                  <li><strong>Diferença para Leads:</strong> Um "Lead" é um contato comercial pontual, gerado por um formulário de interesse. Um "Cliente Final" é um usuário com uma conta permanente na plataforma. Um lead pode se tornar um cliente ao criar uma conta.</li>
                  <li><strong>Visualização Administrativa:</strong> Esta tela serve como um ponto de consulta para o administrador ter uma visão geral dos usuários finais cadastrados na plataforma. O gerenciamento do relacionamento com esses clientes é feito pelos corretores.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="leads-construtoras" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Leads de Construtoras
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>Este menu centraliza os contatos de construtoras interessadas em se tornarem parceiras e anunciarem seus imóveis no portal Oraora.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Origem do Lead:</strong> Os leads são capturados exclusivamente através do formulário na página pública <strong>/para-construtoras</strong>.</li>
                  <li><strong>Informações Coletadas:</strong> O formulário coleta o <strong>nome da construtora</strong> e seu <strong>site</strong>.</li>
                  <li><strong>Ação do Administrador:</strong> O papel do administrador é analisar esses leads, entrar em contato com as construtoras e, caso a parceria seja firmada, realizar o cadastro formal da empresa através do menu "Construtoras".</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="leads-corretores" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Leads de Corretores
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>Este menu lista todos os corretores que solicitaram acesso à "área restrita" ou "lista VIP", demonstrando interesse em novidades ou em se tornar parceiros da plataforma.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Origem do Lead:</strong> Os leads são capturados exclusivamente através do formulário na página pública <strong>/area-corretor</strong>.</li>
                  <li><strong>Informações Coletadas:</strong> O formulário coleta <strong>nome</strong>, <strong>e-mail</strong> e <strong>WhatsApp</strong> do corretor interessado.</li>
                  <li><strong>Ação do Administrador:</strong> O administrador utiliza esta lista para contatar os corretores, oferecer acesso à plataforma e, se aplicável, realizar seu cadastro formal através da página de cadastro de corretores ou do painel de usuários.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="destaques" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Destaques
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Destaques" permite ao administrador escolher manualmente até 3 imóveis para serem exibidos com prioridade máxima nos resultados de busca do site público.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Seleção Manual:</strong> Você pode selecionar de 1 a 3 imóveis para serem os destaques principais. A ordem (Destaque 1, 2, 3) define a sequência em que eles aparecerão.</li>
                  <li><strong>Exibição Prioritária:</strong> Os imóveis selecionados como destaque sempre aparecerão no topo da lista na página `/imoveis`, independentemente de outros filtros ou ordens de classificação.</li>
                  <li><strong>Disponibilidade:</strong> Apenas imóveis marcados como "Visível no site público" podem ser selecionados para destaque.</li>
                  <li><strong>Atualização Dinâmica:</strong> Se um imóvel em destaque for excluído ou se tornar invisível, ele será automaticamente removido da lista de destaques.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="banners" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Banners
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Banners" permite inserir e gerenciar publicidade em áreas estratégicas do site. Você pode usar imagens com links ou colar códigos HTML de redes de anúncios como o Google AdSense.</p>
                <h4>Tipos e Localizações:</h4>
                <ul>
                    <li><strong>Imagem:</strong> Faça o upload de uma imagem e, opcionalmente, adicione um link de destino.</li>
                    <li><strong>HTML:</strong> Cole códigos de anúncio de terceiros.</li>
                    <li><strong>Localizações Disponíveis:</strong>
                        <ul>
                            <li><strong>Página Inicial (Topo):</strong> Banner de grande destaque na homepage.</li>
                            <li><strong>Busca (Topo):</strong> Exibido acima dos resultados de busca.</li>
                            <li><strong>Busca (Meio da Lista):</strong> Inserido entre os resultados de imóveis.</li>
                            <li><strong>Busca (Rodapé):</strong> Exibido ao final da página de resultados.</li>
                        </ul>
                    </li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Status:</strong> Um banner só é exibido no site se estiver marcado como "Ativo".</li>
                  <li><strong>Rotação:</strong> Se mais de um banner estiver ativo para a mesma localização, o sistema escolherá um aleatoriamente para exibir a cada carregamento da página, garantindo a rotação.</li>
                  <li><strong>Métricas:</strong> O sistema contabiliza automaticamente o número de <strong>visualizações</strong> (quantas vezes o banner foi carregado) e <strong>cliques</strong>, permitindo avaliar a performance de cada campanha.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="estatisticas" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Estatísticas
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Estatísticas" oferece uma visão analítica do mercado imobiliário com base nos dados cadastrados na plataforma. A principal funcionalidade é a análise do <strong>valor médio do metro quadrado (m²) por bairro</strong>.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                    <li><strong>Cálculo Automático:</strong> O sistema calcula automaticamente o valor médio do m² para cada bairro em uma cidade selecionada. Para isso, ele utiliza apenas os imóveis que possuem informações de <strong>valor de venda</strong> e <strong>tamanho (área)</strong>.</li>
                    <li><strong>Filtragem por Localização:</strong> As estatísticas são geradas com base no estado e na cidade que você selecionar nos filtros. É necessário escolher uma cidade para visualizar os dados.</li>
                    <li><strong>Resumo Inteligente:</strong> Além do gráfico, a página exibe um resumo com:
                        <ul>
                            <li>A <strong>média de valor do m²</strong> para a cidade inteira.</li>
                            <li>O bairro com o <strong>m² mais caro</strong>.</li>
                            <li>O bairro com o <strong>m² mais barato</strong>.</li>
                        </ul>
                    </li>
                    <li><strong>Visualização Gráfica:</strong> Um gráfico de barras permite comparar visualmente o valor do m² entre os diferentes bairros da cidade selecionada, facilitando a identificação de tendências e oportunidades de mercado.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="planos" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Planos
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Planos" permite ao administrador criar e gerenciar os diferentes níveis de assinatura disponíveis para corretores e construtoras na plataforma.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                    <li><strong>Tipos de Plano:</strong> Cada plano é designado para "Corretor" ou "Construtora". Isso garante que os planos corretos sejam exibidos nas respectivas áreas de assinatura (`/corretor/meu-plano` e `/dashboard-construtora/meu-plano`).</li>
                    <li><strong>Definição de Limites:</strong> É possível configurar limites para cada plano, como o número máximo de imóveis na carteira de um corretor (`propertyLimit`) ou o espaço de armazenamento para mídias (`storageLimit`).</li>
                    <li><strong>Preços Mensais e Anuais:</strong> O sistema suporta a definição de um preço mensal e um preço anual (geralmente com desconto), oferecendo flexibilidade na cobrança.</li>
                    <li><strong>Plano Gratuito:</strong> Um plano pode ser marcado como "Gratuito". Isso permite que o usuário o ative imediatamente, sem a necessidade de passar por um fluxo de pagamento.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="suporte" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Suporte
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Suporte" centraliza todos os tickets de contato e solicitações de ajuda enviados através do formulário "Fale Conosco" no site público, permitindo um gerenciamento organizado do atendimento ao cliente.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Origem dos Tickets:</strong> Todas as solicitações são criadas a partir do preenchimento do formulário na página <strong>/fale-conosco</strong>.</li>
                  <li><strong>Gerenciamento de Status:</strong> O administrador pode acompanhar o andamento de cada solicitação alterando seu status entre "Aberto", "Em andamento" e "Fechado".</li>
                  <li><strong>Visualização da Mensagem:</strong> A mensagem completa enviada pelo usuário, juntamente com seus dados de contato, pode ser visualizada diretamente no painel, facilitando o retorno.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="aparencia" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Aparência
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Aparência" permite a personalização completa da identidade visual e do conteúdo principal do site público (Homepage), garantindo que a plataforma reflita a marca da empresa.</p>
                <h4>Seções Gerenciáveis:</h4>
                <ul>
                  <li><strong>Identidade Visual:</strong>
                    <ul>
                      <li><strong>Logo e Favicon:</strong> Altere a logo principal do site e o ícone que aparece na aba do navegador.</li>
                    </ul>
                  </li>
                   <li><strong>Conteúdo da Página Inicial:</strong>
                    <ul>
                      <li><strong>Título Principal e do Formulário:</strong> Customize os textos de destaque na seção inicial.</li>
                       <li><strong>Imagem de Fundo:</strong> Altere a imagem principal da homepage.</li>
                    </ul>
                  </li>
                   <li><strong>Chamada para Corretores:</strong>
                    <ul>
                      <li>Gerencie os banners (desktop e mobile) que convidam corretores a se cadastrarem, incluindo o link de destino.</li>
                    </ul>
                  </li>
                  <li><strong>Rodapé:</strong>
                    <ul>
                      <li>Edite o texto institucional "Sobre", os títulos da seção de newsletter e os links para as redes sociais.</li>
                    </ul>
                  </li>
                   <li><strong>SEO da Página Inicial:</strong>
                    <ul>
                      <li>Otimize o título, a descrição e as palavras-chave que os mecanismos de busca (como o Google) utilizam, com a opção de usar uma ferramenta de IA para gerar sugestões.</li>
                    </ul>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="usuarios" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Usuários
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li><strong>Visualização de Usuários:</strong> Lista todos os usuários cadastrados no sistema (administradores, corretores, construtoras), exibindo nome, e-mail e função.</li>
                  <li><strong>Criação de Usuários:</strong> Permite criar novas contas de usuário diretamente pelo painel, definindo nome, e-mail, senha e atribuindo uma função.</li>
                  <li><strong>Edição de Funções:</strong> É possível alterar o nome e a função de um usuário existente. A alteração de senha deve ser feita pelo próprio usuário.</li>
                  <li><strong>Gerenciamento de Status:</strong> Um usuário pode ser "Habilitado" ou "Desabilitado" para controlar seu acesso ao sistema.</li>
                  <li><strong>Exclusão de Usuários:</strong> Remove o registro do usuário do banco de dados (mas não do sistema de autenticação, por segurança).</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Criação Segura:</strong> A criação de usuários no painel é uma tarefa administrativa. O sistema de autenticação garante que e-mails não sejam duplicados.</li>
                  <li><strong>Atribuição de Função:</strong> A função selecionada no momento do cadastro ou edição determina as permissões que o usuário terá no sistema, com base no que foi configurado no menu "Funções".</li>
                  <li><strong>Desabilitar vs. Deletar:</strong> Desabilitar um usuário é uma ação reversível que bloqueia o acesso. Deletar remove os dados do usuário da listagem, uma ação mais permanente.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="funcoes" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Funções
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidades:</h4>
                <ul>
                    <li><strong>Criação de Funções:</strong> Permite criar novas funções de usuário (ex: "Gerente de Marketing", "Editor de Conteúdo") para organizar as responsabilidades da equipe.</li>
                    <li><strong>Atribuição de Permissões:</strong> Para cada função, é possível selecionar detalhadamente quais permissões de acesso e ação o usuário terá no painel (ex: pode apenas visualizar imóveis, mas não pode criar ou deletar).</li>
                    <li><strong>Edição e Exclusão:</strong> Funções existentes podem ser modificadas para ajustar permissões ou excluídas caso não sejam mais necessárias.</li>
                </ul>
                <h4>Regras de Negócio:</h4>
                <ul>
                  <li><strong>Controle de Acesso:</strong> As permissões associadas a uma função determinam quais menus e funcionalidades um usuário pode ver e utilizar. Se um usuário não tem a permissão "Acessar Imóveis", por exemplo, este item não aparecerá em seu menu.</li>
                  <li><strong>Associação com Usuários:</strong> Ao criar ou editar um usuário no menu "Usuários", o administrador atribui uma das funções criadas aqui. O sistema então aplica automaticamente as permissões daquela função à conta do usuário.</li>
                  <li><strong>Segurança:</strong> O sistema de funções é a base da segurança e do controle de acesso do painel administrativo, garantindo que cada membro da equipe tenha acesso apenas ao que é necessário para seu trabalho.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="regioes" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">
                Regiões
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4 prose prose-sm max-w-none dark:prose-invert">
                <h4>Funcionalidade:</h4>
                <p>O menu "Regiões" permite ao administrador controlar quais estados brasileiros estarão disponíveis para busca no site público. Ao habilitar ou desabilitar um estado, você define as regiões onde seus usuários podem encontrar imóveis.</p>
                <h4>Regras de Negócio:</h4>
                <ul>
                    <li><strong>Disponibilidade no Site:</strong> Apenas os estados habilitados nesta seção aparecerão como opção no seletor de estados do site público.</li>
                    <li><strong>Filtro Duplo de Visibilidade:</strong> Para que um estado apareça no seletor, ele precisa atender a duas condições: 1) Estar habilitado neste menu; e 2) Ter pelo menos um imóvel de uma construtora visível cadastrado nele.</li>
                    <li><strong>Impacto na Busca:</strong> Desabilitar um estado remove todos os seus imóveis dos resultados de busca para o público geral, agindo como um filtro mestre de localização.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

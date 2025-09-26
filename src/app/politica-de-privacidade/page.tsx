import PublicLayout from '@/components/public-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade – Oraora',
  description: 'Conheça nossa Política de Privacidade e Proteção de Dados e saiba como o Oraora trata suas informações com segurança e transparência.',
};

export default function PoliticaDePrivacidadePage() {
  return (
    <PublicLayout>
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto bg-card p-8 md:p-12 rounded-lg border shadow-sm">
            <article className="prose prose-lg max-w-none dark:prose-invert">
                <h1>
                  <strong>POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS</strong>
                </h1>
                
                <br />
                <h2>QUEM É O RESPONSÁVEL PELOS SEUS DADOS</h2>
                <p>VFDOIS AGÊNCIA DE PUBLICIDADE, inscrita no CNPJ sob o nº 24.977.337/0001-11, é a empresa responsável pela gestão do portal Oraora, acessível em www.oraora.com.br.</p>

                <br />
                <h2>COMO FUNCIONA O SEU ACEITE</h2>
                <p>Ao acessar ou utilizar o portal Oraora, você concorda integralmente com esta Política de Privacidade e Proteção de Dados, além dos Termos de Uso disponíveis na plataforma.</p>

                <br />
                <h2>LEIS QUE NOS ORIENTAM</h2>
                <p>O Oraora atua em total conformidade com as normas brasileiras aplicáveis, especialmente:</p>
                <ul>
                    <li>Lei nº 12.965/2014 (Marco Civil da Internet);</li>
                    <li>Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).</li>
                </ul>

                <br />
                <h2>NOSSO COMPROMISSO COM A PRIVACIDADE</h2>
                <p>Temos como prioridade a segurança, integridade e privacidade de todos os dados fornecidos por usuários e anunciantes do portal. Essa política poderá ser atualizada periodicamente conforme alterações legais ou melhorias em nossos serviços.</p>

                <br />
                <h2>COMO SEUS DADOS SÃO COLETADOS</h2>
                <p>As informações coletadas podem incluir:</p>
                <ul>
                  <li>Nome, login, senha, telefone, endereço, e-mail;</li>
                  <li>CPF ou CNPJ;</li>
                  <li>Dados de acesso como IP, data e hora;</li>
                  <li>Informações de transações eletrônicas.</li>
                </ul>
                <p>Também utilizamos cookies para personalizar sua experiência.</p>

                <br />
                <h2>PARA QUE UTILIZAMOS SUAS INFORMAÇÕES</h2>
                <p>Os dados coletados são usados para:</p>
                <ul>
                    <li>Garantir o funcionamento adequado da plataforma;</li>
                    <li>Melhorar a experiência do usuário;</li>
                    <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>
                <p>O usuário é responsável pela veracidade das informações fornecidas e pela guarda de seus dados de acesso.</p>

                <br />
                <h2>POR QUANTO TEMPO MANTEMOS SEUS DADOS</h2>
                <ul>
                    <li>Registros de conexão (IP, data e hora): até 1 ano;</li>
                    <li>Dados cadastrais e fiscais: até 5 anos após o término da relação contratual;</li>
                    <li>Outros dados: durante todo o período em que houver relacionamento ativo com o usuário.</li>
                </ul>

                <br />
                <h2>QUANDO SEUS DADOS PODEM SER COMPARTILHADOS</h2>
                <p>Seus dados permanecem em sigilo, exceto nas situações em que:</p>
                <ul>
                    <li>Você autorize a divulgação;</li>
                    <li>Forem solicitados por autoridades legais;</li>
                    <li>Sejam necessários para garantir a melhor experiência de uso do portal.</li>
                </ul>
                
                <br />
                <h2>COMO PROTEGEMOS SUAS INFORMAÇÕES</h2>
                <p>O Oraora adota medidas de segurança para preservar seus dados, mas é importante reforçar que nenhum ambiente digital é 100% livre de riscos. Por isso, nunca compartilhe suas senhas ou informações sigilosas com terceiros.</p>

                <br />
                <h2>SEUS DIREITOS COMO TITULAR DE DADOS</h2>
                <p>De acordo com a LGPD, você pode a qualquer momento:</p>
                <ul>
                    <li>Solicitar acesso às suas informações;</li>
                    <li>Corrigir ou excluir seus dados;</li>
                    <li>Revogar o consentimento de uso;</li>
                    <li>Solicitar a portabilidade dos dados.</li>
                </ul>

                <br />
                <h2>COMO FALAR CONOSCO</h2>
                <p>Em caso de dúvidas, solicitações ou denúncias relacionadas à privacidade e proteção de dados:</p>
                <p>📧 E-mail: atendimento@oraora.com.br</p>
                <p>📞 Telefone/WhatsApp: (83) 9 9673-6864</p>
                <p>VFdois Agência de Publicidade – Controladora de dados do portal Oraora.</p>
            </article>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

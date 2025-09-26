
import PublicLayout from '@/components/public-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso – Oraora',
  description: 'Leia atentamente os Termos de Uso do portal Oraora. Ao acessar e navegar em nosso site, você declara estar ciente e de acordo com as condições descritas.',
};

export default function TermosDeUsoPage() {
  return (
    <PublicLayout>
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto bg-card p-8 md:p-12 rounded-lg border shadow-sm">
            <article className="prose prose-lg max-w-none dark:prose-invert">
                <h1 className="text-4xl font-bold mb-8">
                  <strong>Termos de Uso – Oraora</strong>
                </h1>
                
                <p>Antes de utilizar nosso portal, leia atentamente este Termo de Uso e nossa Política de Privacidade. Ao acessar e navegar em nosso site, você declara estar ciente e de acordo com as condições aqui descritas.</p>

                <br />

                <h2>1. Quem Somos</h2>
                <p>O portal Oraora, mantido pela empresa VFDOIS AGÊNCIA DE PUBLICIDADE LTDA, inscrita no CNPJ nº 24.977.337/0001-11, é uma plataforma digital voltada para a divulgação de lançamentos imobiliários e imóveis disponibilizados por construtoras, incorporadoras e parceiros comerciais.</p>
                <p>Nosso objetivo é simplificar a jornada de quem busca um novo imóvel, centralizando em um só lugar informações claras e atualizadas sobre os principais empreendimentos.</p>

                <br />
                <h2>2. Aceitação</h2>
                <p>O uso do portal implica a aceitação integral deste Termo de Uso e de nossa Política de Privacidade. Caso não concorde com quaisquer condições, recomendamos que não utilize a plataforma.</p>
                <p>Os Termos de Uso e a Política de Privacidade podem ser atualizados periodicamente, em razão de melhorias de funcionalidades, implementação de novas tecnologias ou mudanças na legislação. O usuário é responsável por verificar a versão vigente no momento de seu acesso.</p>
                <p>Este documento tem validade jurídica conforme regulamentação aplicável, inclusive para aceite eletrônico.</p>

                <br />
                <h2>3. Legislação Aplicável</h2>
                <p>O Oraora cumpre a legislação brasileira, especialmente:</p>
                <ul>
                    <li>Lei nº 12.965/2014 (Marco Civil da Internet)</li>
                    <li>Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD)</li>
                </ul>
                <p>Além disso, nossas atividades se orientam pelos princípios constitucionais da liberdade de expressão, comunicação, concorrência leal, propriedade privada e proteção ao consumidor.</p>

                <br />
                <h2>4. Responsabilidades</h2>
                <p>O Oraora disponibiliza um espaço digital para que construtoras e parceiros anunciem seus lançamentos e empreendimentos.</p>
                <ul>
                    <li>Não participamos da formulação, edição ou intermediação direta de anúncios.</li>
                    <li>Não nos responsabilizamos por eventuais erros, omissões ou divergências nas informações fornecidas pelos anunciantes.</li>
                    <li>Toda negociação ocorre de forma direta entre usuário e anunciante.</li>
                    <li>O usuário deve verificar, por conta própria, a veracidade, legitimidade e regularidade dos imóveis anunciados, bem como contar com profissionais habilitados (corretores, advogados, vistoriadores) para maior segurança nas transações.</li>
                </ul>

                <br />
                <h2>5. Utilização da Plataforma</h2>
                <p>O acesso ao portal é livre, mas algumas funcionalidades podem exigir cadastro.</p>
                <p>O cadastro deve ser realizado com informações verdadeiras, completas e atualizadas, sob responsabilidade exclusiva do usuário.</p>
                <p>Apenas maiores de 18 anos ou emancipados legalmente podem se cadastrar.</p>
                <p>Os anunciantes são responsáveis por:</p>
                <ul>
                    <li>Garantir que as informações fornecidas (textos, fotos, vídeos, descrições) sejam verdadeiras e atualizadas;</li>
                    <li>Ter legitimidade sobre os bens anunciados;</li>
                    <li>Manter a confidencialidade de login e senha;</li>
                    <li>Comunicar imediatamente à plataforma qualquer uso indevido de sua conta.</li>
                </ul>
                <p>Não é permitido inserir conteúdo ilegal, ofensivo, falso ou que viole direitos de terceiros.</p>

                <br />
                <h2>6. Direitos sobre os Conteúdos</h2>
                <p>Ao publicar anúncios ou informações no portal, o anunciante autoriza o Oraora, de forma gratuita e irrevogável, a utilizar tais conteúdos (textos, imagens, vídeos) para fins de divulgação e promoção na própria plataforma, em redes sociais ou em campanhas de marketing relacionadas ao portal.</p>

                <br />
                <h2>7. Exclusão e Moderação de Conteúdos</h2>
                <p>O Oraora poderá, a seu critério, remover ou suspender anúncios que:</p>
                <ul>
                    <li>Contenham informações falsas ou incompletas;</li>
                    <li>Violem direitos de terceiros ou a legislação vigente;</li>
                    <li>Não estejam de acordo com nossa Política de Uso.</li>
                </ul>

                <br />
                <h2>8. Propriedade Intelectual</h2>
                <p>Todas as marcas, logotipos, layouts, nomes de serviços, textos e conteúdos do portal são de propriedade exclusiva do Oraora, sendo proibida sua utilização sem autorização expressa.</p>

                <br />
                <h2>9. Resolução de Conflitos</h2>
                <p>Em caso de disputas relacionadas a este Termo de Uso, fica eleito o foro da comarca de João Pessoa/PB, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

                <br />
                <h2>10. Contato</h2>
                <p>Para dúvidas ou suporte sobre a utilização da plataforma, entre em contato:</p>
                <p>📞 WhatsApp: (83) 9 9673-6864</p>
                <p>✉️ E-mail: atendimento@oraora.com.br</p>
            </article>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

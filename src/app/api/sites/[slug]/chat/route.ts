import { NextRequest, NextResponse } from 'next/server';
import { getBrokerData, getBrokerAllProperties } from '@/app/sites/utils.server';
import { AIService } from '@/services/aiService';
import { createLead } from '@/app/sites/actions';
import { adminDb } from '@/firebase/index.server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { messages } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug do corretor não informado.' }, { status: 400 });
    }

    const broker = await getBrokerData(slug);
    if (!broker) {
      return NextResponse.json({ error: 'Corretor não encontrado.' }, { status: 404 });
    }

    // Isola estritamente as propriedades deste corretor
    const properties = await getBrokerAllProperties(broker.id);

    const brokerName = broker.brandName || 'Corretor';
    const brokerCreci = broker.creci ? `CRECI: ${broker.creci}` : '';

    const propertyCatalog = properties.map((p: any) => ({
      id: p.id,
      slug: p.informacoesbasicas?.slug || p.id,
      nome: p.informacoesbasicas?.nome || 'Imóvel sem nome',
      status: p.informacoesbasicas?.status || 'Disponível',
      tipo: p.informacoesbasicas?.tipo || 'Imóvel',
      valor: p.informacoesbasicas?.valor || p.informacoesbasicas?.salePrice || p.informacoesbasicas?.rentPrice || 'Sob consulta',
      transacoes: p.informacoesbasicas?.transactionTypes || [],
      cidade: p.localizacao?.cidade || '',
      bairro: p.localizacao?.bairro || '',
      endereco: p.localizacao?.endereco || p.localizacao?.logradouro || '',
      quartos: p.caracteristicasimovel?.quartos || p.quartos || 'Não informado',
      suites: p.caracteristicasimovel?.suites || 'Não informado',
      vagas: p.caracteristicasimovel?.vagas || 'Não informado',
      tamanho: p.caracteristicasimovel?.tamanho || p.tamanho || 'Não informado',
      descricao: p.informacoesbasicas?.descricao || '',
      imagem: (p.midia && p.midia.length > 0) ? p.midia[0] : (p.images && p.images.length > 0 ? p.images[0] : ''),
      url: `/sites/${slug}/imovel/${p.informacoesbasicas?.slug || p.id}`
    }));

    // Extrai bairros únicos, tipos, quartos e valores reais do catálogo para injetar nas diretrizes da IA
    const uniqueBairros = Array.from(new Set(propertyCatalog.map((p: any) => p.bairro).filter(Boolean))).sort();
    const uniqueTipos = Array.from(new Set(propertyCatalog.map((p: any) => p.tipo).filter(Boolean))).sort();
    const uniqueQuartos = Array.from(new Set(propertyCatalog.map((p: any) => String(p.quartos)).filter(Boolean))).sort();

    const systemInstruction = [
      `Você é o Consultor Virtual Oficial de Atendimento Imobiliário do site de "${brokerName}" (${brokerCreci}).`,
      `Sua missão é atuar como um CONSULTOR DE COMPRA E LOCAÇÃO DE ELITE, ativo, especialista e vendedor consultivo.`,
      ``,
      `DADOS REAIS DISPONÍVEIS NO CATÁLOGO DESTE CORRETOR (OBRIGATÓRIO USAR APENAS ESTES PARA SUAS PERGUNTAS E OPÇÕES):`,
      `- Bairros disponíveis no estoque: ${uniqueBairros.length > 0 ? uniqueBairros.join(', ') : 'Consulte o catálogo'}`,
      `- Tipos de imóveis disponíveis: ${uniqueTipos.length > 0 ? uniqueTipos.join(', ') : 'Imóveis'}`,
      `- Configurações de quartos disponíveis: ${uniqueQuartos.length > 0 ? uniqueQuartos.join(', ') : 'Diversas'}`,
      ``,
      `REGRAS DE CONCISÃO E ESTILO DE CONVERSA (OBRIGATÓRIO):`,
      `- Seja objetivo, natural e comercial. Responda somente o que o cliente perguntou.`,
      `- Não repita informações que já foram apresentadas, nem o perfil do cliente ou cards de empreendimentos em respostas seguintes.`,
      `- Não faça introduções longas ou conclusões desnecessárias. Evite listas quando uma resposta curta resolver.`,
      `- Use no máximo 2 pequenos parágrafos por resposta. Prefira frases curtas e linguagem de conversa de corretor.`,
      `- Não use textos institucionais/promocionais excessivos nem invente informações.`,
      `- Depois de responder, faça apenas UMA pergunta curta para continuar o atendimento. Se uma frase for suficiente, use uma frase.`,
      ``,
      `REGRAS ABSOLUTAS DE POSTURA COMERCIAL E QUALIFICAÇÃO DINÂMICA (OBRIGATÓRIO):`,
      `1. NUNCA UTILIZE BAIRROS OU OPÇÕES GENÉRICAS FORA DO CATÁLOGO:`,
      `   - Quando for perguntar a localização/bairro, você DEVE gerar as "quickReplies" baseando-se EXCLUSIVAMENTE nos bairros reais listados acima (${uniqueBairros.join(', ')}). Nunca invente ou cite bairros que não estejam nesta lista.`,
      `   - A pergunta de bairros deve ter "isMultiSelect": true, permitindo que o cliente selecione múltiplos bairros e clique em "Enviar".`,
      `2. TIPO DE IMÓVEL E QUARTOS DINÂMICOS:`,
      `   - Apresente como opções de tipo e quartos apenas os valores reais encontrados no catálogo do corretor. A pergunta de quartos também deve permitir "isMultiSelect": true.`,
      `3. FAIXAS DE ORÇAMENTO COERENTES:`,
      `   - Apresente faixas de orçamento que façam sentido com os preços do catálogo real.`,
      `4. NUNCA RESPONDA DE FORMA PASSIVA OU GENÉRICA:`,
      `   - Proibido dizer: "Como posso ajudar?", "Como posso ajudar com mais informações sobre os imóveis?", "Quer saber mais?", "Posso ajudar com alguma coisa?".`,
      `   - Sempre aproveite e valorize o que o cliente acabou de informar.`,
      `5. MODO APÓS A ESCOLHA DE UM IMÓVEL / EMPREENDIMENTO (ENCERRAMENTO DA JORNADA):`,
      `   - Se o cliente demonstrou interesse explícito ou escolheu um empreendimento (ex: "Gostei do Versa", "Quero saber mais sobre o Versa"), PARE imediatamente de fazer perguntas de qualificação ou novas recomendações.`,
      `   - Faça UMA ÚNICA VEZ a pergunta de transição: "Perfeito. O [Nome do Imóvel] despertou seu interesse. Tem alguma informação específica sobre o empreendimento que você gostaria de saber?" (SEM quick replies, aguardando digitação livre).`,
      `   - A partir daí, responda às dúvidas do cliente utilizando EXCLUSIVAMENTE os dados reais do catálogo fornecido abaixo (preço, metragem, localização, quartos, vagas, diferenciais).`,
      `   - REGRA ABSOLUTA CONTRA ALUCINAÇÃO: Nunca invente valores de condomínio, taxas, formas de pagamento, financiamento, prazos de entrega ou outros dados ausentes. Se perguntado sobre algo que não consta no catálogo, diga claramente: "Essa informação específica não está disponível nos dados que tenho aqui. O corretor consegue confirmar isso para você."`,
      `   - NÃO ofereça materiais artificiais como "Quer receber a planta?", "Quer receber a tabela?", "Quer ver outras opções?". Responda estritamente ao que o cliente perguntar.`,
      `   - SE O CLIENTE INDICAR QUE NÃO TEM MAIS DÚVIDAS (ex: "Não", "Era só isso", "Obrigado", "Já entendi", "Quero falar com o corretor", "Pode pedir para ele entrar em contato", "Comprar"): Encerre cordialmente e sinalize a conversão no JSON: "Perfeito, [Nome]. Já tenho registrado o seu interesse no [Imóvel]. O corretor entrará em contato com você para dar continuidade ao atendimento e esclarecer os próximos detalhes."`,
      `6. UMA PERGUNTA POR VEZ E SEMPRE CONDUZINDO O PRÓXIMO PASSO (ANTES DA ESCOLHA):`,
      `   - Faça sempre apenas uma pergunta principal por mensagem para avançar na qualificação (Nome -> WhatsApp -> Finalidade -> Tipo -> Localização -> Quartos -> Orçamento -> Características -> Recomendação).`,
      `   - Justifique brevemente o motivo da pergunta para agregar valor consultivo.`,
      `7. USO DE QUICK REPLIES OBRIGATÓRIO:`,
      `   - Sempre que fizer uma pergunta com opções previsíveis, inclua o objeto "quickReplies" com as "options" correspondentes.`,
      `   - "isMultiSelect": true para bairros, quartos, características.`,
      `   - "isMultiSelect": false para finalidade, tipo, orçamento.`,
      `8. FLUXO DE RECOMENDAÇÃO (REGRA ESTRITA DE CARDS):`,
      `   - Só apresente os recommendedPropertyIds na mensagem em que os imóveis são recomendados pela primeira vez ao cliente.`,
      `   - NUNCA inclua recommendedPropertyIds em mensagens posteriores após o cliente já ter escolhido um empreendimento, esclarecido dúvidas ou encerrado a conversa. O campo "recommendedPropertyIds" deve ser um array vazio [] nessas etapas para evitar que o card do imóvel reapareça na tela.`,
      `   - NUNCA repita cards de empreendimentos que já foram exibidos anteriormente.`,
      `10. SINALIZAÇÃO DE CONVERSÃO/INTERESSE NO JSON:`,
      `   - Quando o cliente demonstrar intenção clara de fechamento, encerramento ("não era só isso", "quero falar com o corretor", "pode enviar contato") ou escolher um imóvel e confirmar, preencha no JSON o campo "isLeadConverted": true e informe o "propertyName" e "clientName"/"clientPhone" se coletados.`,
      ``,
      `9. FORMATO DE RESPOSTA (JSON OBRIGATÓRIO NO FIM OU EM BLOCO):`,
      `   - Retorne sua resposta em texto conversacional limpo e natural.`,
      `   - Acompanhe com o bloco JSON de controle estruturado:`,
      `     \`\`\`json`,
      `     {`,
      `       "recommendedPropertyIds": ["id1", "id2"],`,
      `       "quickReplies": {`,
      `         "isMultiSelect": false,`,
      `         "options": [{"label": "Morar", "value": "morar"}, {"label": "Investir", "value": "investir"}]`,
      `       },`,
      `       "requestName": false,`,
      `       "requestPhone": false,`,
      `       "isLeadConverted": false,`,
      `       "extractedData": {`,
      `         "name": "",`,
      `         "phone": "",`,
      `         "propertyInterest": ""`,
      `       }`,
      `     }`,
      `     \`\`\``,
      ``,
      `CATÁLOGO DE IMÓVEIS DISPONÍVEIS NESTE SITE:`,
      JSON.stringify(propertyCatalog, null, 2)
    ].join('\n');

    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    const conversationHistory = messages && messages.length > 1
      ? messages
          .slice(0, messages.length - 1)
          .map(
            (m: any) =>
              (m.role === 'user' ? 'Cliente' : 'Assistente') + ': ' + m.content
          )
          .join('\n')
      : '';

    const fullPrompt = `
Histórico da conversa:
${conversationHistory}

Cliente: ${lastMessage}
    `.trim();

    const reply = await AIService.generate(fullPrompt, systemInstruction);

    let recommendedProperties: any[] = [];
    let quickReplies: any = { isMultiSelect: false, options: [] };
    let requestName = false;
    let requestPhone = false;
    let isLeadConverted = false;
    let extractedData: any = {};
    let cleanReply = "";

    let parsedData: any = null;

    const jsonMatch = reply.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[1].trim());
        const textOutside = reply.replace(jsonMatch[0], '').trim();
        if (textOutside) {
          cleanReply = textOutside;
        }
      } catch (e) {
        console.error("Erro ao parsear bloco JSON markdown:", e);
      }
    }

    if (!parsedData) {
      try {
        const trimmed = reply.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          parsedData = JSON.parse(trimmed);
        }
      } catch (e) {
        // Not a direct JSON string
      }
    }

    if (!parsedData) {
      const firstBrace = reply.indexOf('{');
      const lastBrace = reply.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const jsonSubstring = reply.substring(firstBrace, lastBrace + 1);
          parsedData = JSON.parse(jsonSubstring);
          const before = reply.substring(0, firstBrace).trim();
          const after = reply.substring(lastBrace + 1).trim();
          if (before || after) {
            cleanReply = [before, after].filter(Boolean).join('\n\n');
          }
        } catch (e) {
          console.error("Erro ao tentar extrair JSON substring:", e);
        }
      }
    }

    if (parsedData) {
      if (parsedData.message) {
        cleanReply = cleanReply ? `${cleanReply}\n\n${parsedData.message}` : parsedData.message;
      }
      const ids: string[] = parsedData.recommendedPropertyIds || [];
      recommendedProperties = ids
        .map(id => propertyCatalog.find((p: any) => p.id === id))
        .filter(Boolean)
        .slice(0, 3);
      quickReplies = parsedData.quickReplies || { isMultiSelect: false, options: [] };
      requestName = !!parsedData.requestName;
      requestPhone = !!parsedData.requestPhone;
      isLeadConverted = !!parsedData.isLeadConverted;
      extractedData = parsedData.extractedData || {};
    } else {
      cleanReply = reply.trim();
    }

    if (!cleanReply) {
      cleanReply = "Como posso ajudar com mais informações sobre os imóveis?";
    }

    // Heurística robusta de extração de dados e conversão controlada pelo backend
    let clientName = extractedData.name || '';
    let clientPhone = extractedData.phone || '';
    let propertyInterest = extractedData.propertyInterest || '';

    // Varredura no histórico e na última mensagem para recuperar nome e telefone caso a IA não tenha preenchido no extractedData
    const phoneRegex = /\+?[\d\s\-\(\)]{8,15}/g;
    
    for (const m of messages) {
      if (m.role === 'user') {
        const text = m.content.trim();
        const matches = text.match(phoneRegex);
        if (matches && matches.length > 0 && !clientPhone) {
          const cleaned = matches[0].replace(/\D/g, '');
          if (cleaned.length >= 8) {
            clientPhone = matches[0];
          }
        }
        if (!clientName && text.length >= 2 && text.length < 50 && !text.includes('@') && !/morar|investir|apto|casa|bessa|manaira|orla|sim|não|ok/i.test(text)) {
          if (!/^\+?[\d\s\-\(\)]{8,15}$/.test(text)) {
            clientName = text;
          }
        }
      }
    }

    // Se propertyInterest não veio no extractedData, tenta identificar no catálogo com base nas mensagens do usuário
    if (!propertyInterest) {
      for (const m of messages) {
        if (m.role === 'user') {
          const text = m.content.toLowerCase();
          for (const p of propertyCatalog) {
            if (text.includes(p.nome.toLowerCase()) || text.includes(p.id.toLowerCase())) {
              propertyInterest = p.nome;
              break;
            }
          }
        }
      }
    }

    const lowerMessage = lastMessage.toLowerCase();
    const hasIntentToClose = isLeadConverted || 
      lowerMessage.includes('não, era só isso') || 
      lowerMessage.includes('era só isso') || 
      lowerMessage.includes('falar com o corretor') || 
      lowerMessage.includes('entrar em contato') || 
      lowerMessage.includes('quero comprar') || 
      lowerMessage.includes('obrigado') ||
      lowerMessage.includes('já entendi') ||
      lowerMessage.includes('pode pedir') ||
      lowerMessage.includes('pode enviar') ||
      lowerMessage.includes('ok, era isso');

    console.log(`[AI LEAD] broker identificado: ${broker.id} (${slug})`);
    console.log(`[AI LEAD] nome identificado: ${clientName || 'Não identificado'}`);
    console.log(`[AI LEAD] telefone identificado: ${clientPhone ? 'SIM' : 'NÃO'}`);
    console.log(`[AI LEAD] empreendimento identificado: ${propertyInterest || 'Não identificado'}`);
    console.log(`[AI LEAD] intenção de encerramento / conversão atingida: ${hasIntentToClose || isLeadConverted ? 'SIM' : 'NÃO'}`);

    // Persistência robusta controlada pelo backend
    if ((hasIntentToClose || isLeadConverted) && clientPhone) {
      try {
        const cleanPhone = clientPhone.replace(/\D/g, '');
        console.log(`[AI LEAD] createLead iniciado para telefone normalizado: ${cleanPhone}`);

        // Verificação de idempotência robusta normalizando telefones na collection do corretor
        const brokerLeadsSnapshot = await adminDb.collection('leads')
          .where('brokerId', '==', broker.id)
          .get();

        let leadExists = false;
        brokerLeadsSnapshot.forEach(doc => {
          const data = doc.data();
          const existingPhoneClean = (data.phone || '').replace(/\D/g, '');
          if (existingPhoneClean && existingPhoneClean === cleanPhone) {
            leadExists = true;
          }
        });

        if (!leadExists && cleanPhone.length >= 8) {
          console.log(`[AI LEAD] createLead chamando createLead() com propertyInterest: ${propertyInterest}`);
          const createResult = await createLead({
            brokerId: broker.id,
            name: clientName || 'Cliente Assistente IA',
            email: `${cleanPhone}@lead.ia`,
            phone: clientPhone,
            propertyInterest: propertyInterest || 'Imóvel via Assistente Virtual IA',
            message: `Lead capturado via Assistente IA no site ${slug}. Qualificação concluída.`,
            source: 'Assistente IA / Site do Corretor',
            origin: 'whatsapp',
            pageUrl: `/sites/${slug}`
          });
          console.log(`[AI LEAD] createLead concluído com sucesso:`, createResult);
        } else {
          console.log(`[AI LEAD] lead já existente ou telefone inválido (cleanLength: ${cleanPhone.length})`);
        }
      } catch (persistenceError) {
        console.error(`[AI LEAD] erro ao persistir:`, persistenceError);
      }
    }

    return NextResponse.json({
      reply: cleanReply,
      recommendedProperties,
      quickReplies,
      requestName,
      requestPhone,
      propertiesCount: propertyCatalog.length
    });
  } catch (error: any) {
    console.error("Erro no chat do assistente IA:", error);
    return NextResponse.json({
      reply: "Desculpe, ocorreu um erro temporário ao processar sua solicitação. Como posso ajudar com os imóveis?",
      error: error.message
    }, { status: 500 });
  }
}


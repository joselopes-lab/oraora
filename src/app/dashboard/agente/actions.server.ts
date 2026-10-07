'use server';

import { getAiClient } from '@/services/aiService';
import { ORAORA_KNOWLEDGE_BASE } from '@/lib/ora/knowledge-base';
import { resolveBrokerContext, agentSearchClients, agentListEvents, agentExecuteCreateClient, agentExecuteCreateEvent } from '@/lib/ora/agent-tools.server';

export async function interactWithAgentServer(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  confirmedAction?: {
    type: 'create_client' | 'create_event';
    payload: any;
  };
}, providedToken?: string | null) {
  try {
    console.log('[CHECKPOINT-A] Antes de resolveBrokerContext');
    const { uid, brokerId } = await resolveBrokerContext(providedToken);
    console.log('[CHECKPOINT-A-OK] resolveBrokerContext concluído, brokerId:', brokerId);

    const userMessage = params.message?.trim() || '';

    // 1. If there is a confirmed action, execute it securely on server
    if (params.confirmedAction) {
      const { type, payload } = params.confirmedAction;
      if (type === 'create_client') {
        const leadId = await agentExecuteCreateClient(brokerId, payload);
        return {
          success: true,
          reply: `Cliente **${payload.name}** cadastrado com sucesso! ID: ${leadId}. Ele já está disponível na sua carteira de clientes.`,
          actionExecuted: true
        };
      } else if (type === 'create_event') {
        const eventId = await agentExecuteCreateEvent(brokerId, payload);
        return {
          success: true,
          reply: `Compromisso **${payload.title}** agendado com sucesso para ${payload.date} às ${payload.time || '09:00'}!`,
          actionExecuted: true
        };
      }
    }

    // 2. Fetch current broker data (clients & events) to give context to Gemini if needed
    console.log('[CHECKPOINT-B] Antes de agentSearchClients');
    const clients = await agentSearchClients(brokerId);
    console.log('[CHECKPOINT-B-OK] agentSearchClients concluído, total:', clients.length);

    const todayStr = new Date().toISOString().split('T')[0];

    console.log('[CHECKPOINT-C] Antes de agentListEvents');
    const events = await agentListEvents(brokerId);
    console.log('[CHECKPOINT-C-OK] agentListEvents concluído, total:', events.length);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    const clientSummary = clients.map(c => `- ID: ${c.id}, Nome: ${c.name}, Tel: ${c.phone}, Email: ${c.email || 'N/A'}, Interesse: ${c.propertyInterest || 'N/A'}`).join('\n');
    const eventSummary = events.map(e => `- Data: ${e.date} às ${e.time || '09:00'} | Título: ${e.title} (${e.type || 'evento'})`).join('\n');

    const systemInstruction = `
Você é o **Agente OraOra**, o assistente virtual inteligente e prestativo do corretor de imóveis na plataforma OraOra.

### REGRAS DE CONTEXTO E DATA:
- Hoje é ${formattedDate}. Use esta referência para resolver expressões temporais relativas (ex: "amanhã", "próxima quarta-feira").
- Sempre resolva datas para o formato "YYYY-MM-DD" no preview.

### REGRAS DE OPERAÇÃO:
1. **Dúvidas**: Responda com base na Base de Conhecimento fornecida.
2. **Operações**: Antes de gerar qualquer tag de preview (\`[PREVIEW_CLIENT: {...}]\` ou \`[PREVIEW_EVENT: {...}]\`), **valide se todos os dados obrigatórios foram fornecidos pelo usuário**.
   - Se faltar dado obrigatório, NÃO gere a tag. Responda perguntando apenas o que falta.
   - Campos obrigatórios para EVENTO: title, date (YYYY-MM-DD), type.
   - Campos obrigatórios para CLIENTE: name, phone.
   - Se os dados estiverem completos, gere a tag estritamente válida.

### BASE DE CONHECIMENTO DO ORAORA:
${ORAORA_KNOWLEDGE_BASE}

### DADOS ATUAIS DESTE CORRETOR (Contexto):
- **Clientes Cadastrados (${clients.length})**:
${clientSummary || 'Nenhum cliente cadastrado ainda.'}

- **Compromissos na Agenda (${events.length})**:
${eventSummary || 'Nenhum compromisso agendado.'}
`;

    const chatHistory = (params.history || []).map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    const client = getAiClient();
    
    // Controlled retry & fallback execution for transient 503/UNAVAILABLE errors
    const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash'];
    let resultText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      let modelSuccess = false;

      for (let attempt = 0; attempt <= 2; attempt++) {
        if (attempt > 0) {
          const delayMs = attempt === 1 ? 1000 : 2000;
          console.log(`[AGENT-RETRY] Aguardando ${delayMs}ms antes da tentativa ${attempt + 1} com modelo ${model}...`);
          await new Promise(res => setTimeout(res, delayMs));
        }

        try {
          console.log(`[AGENT-ATTEMPT] Tentativa ${attempt + 1} com modelo: ${model}`);
          const chat = client.chats.create({
            model,
            config: {
              systemInstruction,
            },
            history: chatHistory
          });

          const res = await chat.sendMessage({ message: userMessage });
          resultText = res.text || 'Não consegui processar sua solicitação.';
          modelSuccess = true;
          console.log(`[AGENT-SUCCESS] Resposta obtida com sucesso usando modelo: ${model}`);
          break;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.statusCode || err?.code;
          const msg = (err?.message || '').toLowerCase();
          const isTransient = status === 503 || status === 429 || status === 'UNAVAILABLE' || msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('overloaded');

          console.warn(`[AGENT-WARN] Falha na tentativa ${attempt + 1} (${model}):`, {
            status,
            message: err?.message,
            isTransient
          });

          // If not transient (e.g. 400, 401, 403), fail immediately without retry/fallback
          if (!isTransient) {
            throw err;
          }
        }
      }

      if (modelSuccess) {
        break;
      }
    }

    if (!resultText && lastError) {
      throw lastError;
    }

    const replyText = resultText || 'Não consegui processar sua solicitação.';

    let previewAction = null;
    const clientMatch = replyText.match(/\[PREVIEW_CLIENT:\s*(\{.*?\})\s*\]/s);
    const eventMatch = replyText.match(/\[PREVIEW_EVENT:\s*(\{.*?\})\s*\]/s);

    let cleanReply = replyText;

    if (clientMatch || eventMatch) {
      try {
        const match = clientMatch || eventMatch;
        const payload = JSON.parse(match[1]);
        
        // Defensive validation of payload structure
        const type = clientMatch ? 'create_client' : 'create_event';
        previewAction = { type, payload };
        cleanReply = cleanReply.replace(match[0], '').trim();
      } catch (e) {
        console.error('Error parsing agent preview JSON:', e);
        // Do not return preview, keep the response as is or ask for clarification
        cleanReply = replyText.replace(/\[PREVIEW_.*?\]/g, '').trim() + "\n\n(Houve um erro técnico ao gerar o formulário de confirmação. Poderia repetir ou reformular?)";
      }
    }

    return {
      success: true,
      reply: cleanReply,
      previewAction
    };

  } catch (error: any) {
    const status = error?.status || error?.statusCode || error?.code;
    const msg = (error?.message || '').toLowerCase();
    const isTransient = status === 503 || status === 429 || status === 'UNAVAILABLE' || msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('overloaded');

    console.error('[AGENT-SERVER-ERROR-DEBUG]', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
      isTransient,
      stack: error?.stack
    });

    const userFriendlyReply = isTransient
      ? 'O Agente OraOra está temporariamente sobrecarregado. Tente novamente em alguns instantes.'
      : 'Não foi possível processar sua solicitação no Agente OraOra. Tente novamente.';

    return {
      success: false,
      reply: userFriendlyReply,
      error: error.message || 'Erro desconhecido'
    };
  }
}

import { GoogleGenAI } from "@google/genai";

let aiClientInstance: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A variável de ambiente GEMINI_API_KEY é obrigatória.");
    }
    aiClientInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClientInstance;
}

/**
 * Serviço desacoplado de Inteligência Artificial utilizando o modelo Gemini Flash Latest.
 */
export class AIService {
  /**
   * Gera uma resposta simples do modelo Gemini Flash Latest.
   */
  public static async generate(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return response.text || "";
    } catch (error: any) {
      console.error("AIService.generate error:", error);
      return `Erro na geração de IA: ${error.message || error}`;
    }
  }

  /**
   * Analisa a situação de um processo cartorial e sugere próximos passos e minutas de mensagens.
   */
  public static async analyzeProcess(processData: any): Promise<string> {
    try {
      const client = getAiClient();
      const prompt = `
        Analise o seguinte processo cartorial imobiliário do Corretor de Imóveis:
        
        Nome do Serviço: ${processData.serviceName}
        ID do Processo: ${processData.id}
        Status Atual: ${processData.status}
        Última Atualização: ${processData.updatedAt}
        
        Documentos configurados e enviados:
        ${JSON.stringify(processData.documents || [], null, 2)}
        
        Mensagens trocadas até o momento:
        ${JSON.stringify(processData.messages || [], null, 2)}
        
        Por favor, forneça as seguintes informações formatadas em Markdown elegante:
        1. **Análise de Status**: Um resumo claro e executivo sobre o andamento e eventuais gargalos (ex: documentos pendentes ou reprovados).
        2. **Plano de Ação para o Corretor**: 3 ações diretas e prioritárias que o corretor deve tomar para acelerar o processo.
        3. **Mensagem Pronta para o Cliente**: Escreva um rascunho de mensagem de atualização empática e profissional (com placeholders tipo [Nome do Cliente]) para o corretor enviar via WhatsApp, acalmando o cliente e explicando o próximo passo.
      `;

      const systemInstruction = "Você é um assistente virtual especialista em trâmites imobiliários, escrituras, certidões e registros de imóveis.";

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { systemInstruction },
      });
      return response.text || "";
    } catch (error: any) {
      console.error("AIService.analyzeProcess error:", error);
      return `Não foi possível gerar a análise inteligente neste momento: ${error.message || error}`;
    }
  }
}

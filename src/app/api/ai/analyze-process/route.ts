import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/aiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Suporta receber o processo como a raiz do JSON ou dentro de uma propriedade 'process' ou 'processData'
    const processData = body.process || body.processData || (body.id && body.serviceName ? body : null);

    if (!processData) {
      return NextResponse.json({ error: "O objeto CartorioProcess completo é obrigatório no corpo da requisição" }, { status: 400 });
    }

    // Executa a análise inteligente desacoplada de IA
    const analysisMarkdown = await AIService.analyzeProcess(processData);

    return NextResponse.json({ analysis: analysisMarkdown });
  } catch (error: any) {
    console.error("POST /api/ai/analyze-process proxy error:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar análise de IA" }, { status: 500 });
  }
}

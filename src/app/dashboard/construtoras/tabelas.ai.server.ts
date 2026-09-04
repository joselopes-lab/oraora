'use server';

/**
 * @fileOverview Servidor de IA para Inteligência e Extração de Tabelas de Preços a partir de PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb, adminStorage } from '@/firebase/index.server';
import { getAuthenticatedUserContext } from './tabelas.actions.server';
import { ParsePriceTablePdfOutputSchema } from './tabelas.ai.schema';

const parseTablePrompt = ai.definePrompt({
  name: 'parsePriceTablePdfPrompt',
  input: {
    schema: z.object({
      pdfText: z.string(),
    }),
  },
  output: {
    schema: ParsePriceTablePdfOutputSchema.omit({ success: true }),
  },
  prompt: `Você é um analista especialista em extração de dados de tabelas de preços imobiliárias a partir de arquivos PDF.

Abaixo está o conteúdo extraído ou texto bruto do PDF da tabela de preços:
---------------------------------------------
{{{pdfText}}}
---------------------------------------------

Sua tarefa:
1. Identificar todas as colunas relevantes presentes no texto.
2. Mapear os campos essenciais do OraOra: Unidade, Área, Preço e Status (além de torre, bloco, andar se existirem).
3. Extrair linhas de prévia estruturada convertendo valores monetários brasileiros (ex: R$ 585.000,00 ou 585000) e áreas (ex: 68,45 m² ou 68.45) para formato numérico puro (number).
4. Normalizar o status para termos como 'Disponível', 'Reservado', 'Vendido' ou manter o original se incerto.
5. Definir o nível de confiança (Alta, Média, Baixa).

Retorne rigorosamente no formato de esquema especificado.`,
});

export async function parsePriceTablePdfServer(data: { tableId: string; idToken: string }) {
  console.log('[PRICE TABLE AI] START', { tableId: data?.tableId });
  try {
    const ctx = await getAuthenticatedUserContext(data?.idToken);
    if (!data?.tableId) {
      return { success: false, error: 'ID da tabela não informado.' };
    }

    const tableRef = adminDb.collection('priceTables').doc(data.tableId);
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return { success: false, error: 'Tabela não encontrada.' };
    }

    const tableData = tableDoc.data();
    const storagePath = tableData?.sourceFile?.storagePath;
    const mimeType = tableData?.sourceFile?.mimeType;

    console.log('[PRICE TABLE AI] FILE_INFO', { tableId: data.tableId, storagePath, mimeType });

    if (!storagePath) {
      return { success: false, error: 'Esta tabela não possui um arquivo PDF associado no Storage.' };
    }

    // Authorization check for broker vs admin vs constructor
    if (ctx.userType !== 'admin') {
      const propertyId = tableData?.propertyId;
      if (!propertyId) {
        return { success: false, error: 'Acesso negado a esta tabela.' };
      }
      // If broker, check brokerProperties or portfolios
      if (ctx.userType === 'broker') {
        const bpSnap = await adminDb.collection('brokerProperties')
          .where('brokerId', '==', ctx.uid)
          .where('propertyId', '==', propertyId)
          .where('inPortfolio', '==', true)
          .limit(1)
          .get();
        if (bpSnap.empty) {
          const portfolioDoc = await adminDb.collection('portfolios').doc(ctx.uid).get();
          const propertyIds = portfolioDoc.exists ? (portfolioDoc.data()?.propertyIds || []) : [];
          if (!propertyIds.includes(propertyId)) {
            return { success: false, error: 'Você não possui acesso a esta tabela.' };
          }
        }
      }
    }

    // Get file from Firebase Storage
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
      return { success: false, error: 'Arquivo PDF não encontrado no Storage.' };
    }

    const [buffer] = await file.download();
    const pdfText = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000)); // Sample text or raw dump
    console.log('[PRICE TABLE AI] FILE_LOADED', { bufferSize: buffer.length, textSampleLength: pdfText.length });

    const { output } = await parseTablePrompt({ pdfText });
    if (!output) {
      return { success: false, error: 'Não foi possível interpretar este PDF.' };
    }

    console.log('[PRICE TABLE AI] MODEL_RESPONSE', {
      columnsCount: output.columnsFound?.length,
      rowsCount: output.previewRows?.length,
      confidence: output.confidence
    });

    console.log('[PRICE TABLE AI] RESULT', {
      columns: output.columnsFound,
      rows: output.previewRows?.length || 0,
      mappedFields: output.mapping
    });

    return {
      success: true,
      ...output,
    };
  } catch (err: any) {
    console.error('[PARSE PRICE TABLE PDF] ERROR', err);
    return { success: false, error: err?.message || 'Erro ao processar PDF da tabela.' };
  }
}

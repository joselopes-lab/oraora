'use client';

import React from 'react';
import { ProcessDocument } from '@/services/cartorioService';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';

interface DocumentsPanelProps {
  documents?: ProcessDocument[];
  uploadingDocId?: string | null;
  onFileUpload?: (docId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDocument?: (doc: ProcessDocument) => void;
  onDeleteDocument?: (docId: string) => void;
  onSubmitToCartorio?: () => void;
}

export default function DocumentsPanel({
  documents,
  uploadingDocId,
  onFileUpload,
  onViewDocument,
  onSubmitToCartorio,
}: DocumentsPanelProps) {
  const docsList = documents || [];

  const sentCount = docsList.filter(
    (doc) => doc.status === 'submitted' || doc.status === 'approved' || Boolean(doc.fileName) || Boolean(doc.fileUrl)
  ).length;
  const totalCount = docsList.length;
  const percentage = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // Regra visual: desabilitar o botão 'Enviar ao Cartório' enquanto existir documento obrigatório pendente
  const hasPendingDocs = totalCount === 0 || docsList.some(
    (doc) => (doc.required !== false) && !(doc.status === 'submitted' || doc.status === 'approved' || Boolean(doc.fileName) || Boolean(doc.fileUrl))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6 text-left">
      <div className="border-b border-slate-100 pb-4 space-y-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
          DOCUMENTAÇÃO
        </h2>

        {/* Barra de Progresso Visual */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
            <span>{sentCount} de {totalCount} documentos enviados</span>
            <span className="font-bold text-slate-900">{percentage}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 text-sm">
          Documentos Obrigatórios
        </h3>

        {docsList.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-2">
            Nenhum documento obrigatório configurado para este serviço.
          </p>
        ) : (
          <div className="space-y-3">
            {docsList.map((doc) => {
              const isSubmitted = doc.status === 'submitted' || doc.status === 'approved' || Boolean(doc.fileName) || Boolean(doc.fileUrl);
              const statusText = doc.status === 'approved' ? 'Aprovado' : isSubmitted ? 'Recebido' : 'PENDENTE';
              const statusClass = isSubmitted 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                : 'text-amber-700 bg-amber-50 border-amber-200';
              const isRequired = doc.required !== false;

              return (
                <div 
                  key={doc.id} 
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <Square className="size-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-base">{doc.name}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          isRequired 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isRequired ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>

                      {doc.description && (
                        <p className="text-xs text-slate-500">{doc.description}</p>
                      )}

                      {doc.fileName && (
                        <p className="text-xs text-slate-500">
                          Arquivo: <span className="font-medium text-slate-700">{doc.fileName}</span>
                        </p>
                      )}

                      {isSubmitted && doc.uploadedAt && (
                        <p className="text-[11px] text-slate-400 font-medium">
                          Data do envio: {doc.uploadedAt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-sm">
                      <span className="text-slate-500 font-medium mr-1.5 hidden md:inline">Status:</span>
                      <span className={`font-semibold px-2.5 py-1 rounded-md border text-xs ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSubmitted && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (onViewDocument) {
                              onViewDocument(doc);
                            } else if (doc.fileUrl || doc.downloadURL) {
                              window.open(doc.fileUrl || doc.downloadURL, '_blank');
                            }
                          }}
                          className="h-9 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300"
                        >
                          Visualizar
                        </Button>
                      )}

                      <div className="relative">
                        <input 
                          type="file" 
                          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                          id={`upload-${doc.id}`}
                          className="hidden"
                          onChange={(e) => onFileUpload?.(doc.id, e)}
                          disabled={uploadingDocId === doc.id}
                        />
                        <Button 
                          type="button"
                          asChild
                          disabled={uploadingDocId === doc.id}
                          className="bg-primary hover:bg-primary-hover text-slate-900 font-bold px-4 h-9 rounded-lg border-none cursor-pointer"
                        >
                          <label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                            {uploadingDocId === doc.id ? 'Enviando...' : isSubmitted ? 'Substituir' : 'Enviar'}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão Enviar ao Cartório (desabilitado enquanto houver documento obrigatório pendente) */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-medium">
          {hasPendingDocs 
            ? 'Envie todos os documentos obrigatórios para liberar o envio ao Cartório.' 
            : 'Todos os documentos foram enviados. Você já pode enviar ao Cartório.'}
        </p>
        <Button 
          type="button"
          disabled={hasPendingDocs}
          onClick={onSubmitToCartorio}
          className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-slate-900 font-bold px-6 h-11 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
        >
          Enviar ao Cartório
        </Button>
      </div>
    </div>
  );
}


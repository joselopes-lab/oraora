'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type AnalyzeActivityLogOutput } from '@/ai/flows/analyze-activity-log';
import { Loader2, Bot, AlertCircle } from 'lucide-react';
import { handleAnalyze } from './actions';

const sampleLog = `[2024-07-29 10:00:00] usuario:vinicius@teste.com acao:login status:sucesso ip:192.168.1.1
[2024-07-29 10:01:00] usuario:vinicius@teste.com acao:ver_lista_usuarios status:sucesso
[2024-07-29 10:02:00] usuario:vinicius@teste.com acao:editar_usuario id:101 status:sucesso
[2024-07-29 14:30:00] usuario:guest@example.com acao:login status:falha ip:10.0.0.5
[2024-07-29 14:30:01] usuario:guest@example.com acao:login status:falha ip:10.0.0.5
[2024-07-29 14:30:02] usuario:guest@example.com acao:login status:falha ip:10.0.0.5
[2024-07-29 18:05:00] usuario:vinicius@teste.com acao:acessar_relatorio_sensivel status:sucesso ip:203.0.113.15
[2024-07-29 23:15:00] usuario:root@external.com acao:tentativa_sql_injection query:"' OR '1'='1" status:negado ip:123.45.67.89`;


export default function ActivityLogPage() {
  const [log, setLog] = useState(sampleLog);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeActivityLogOutput | null>(null);
  const { toast } = useToast();

  const onAnalyze = async () => {
    if (!log.trim()) {
      toast({
        variant: 'destructive',
        title: 'Log está vazio',
        description: 'Por favor, cole um log de atividade para analisar.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    const result = await handleAnalyze(log);

    setIsLoading(false);

    if (result.success && result.data) {
      setAnalysis(result.data);
      toast({
        title: 'Análise Completa',
        description: 'Atividades suspeitas foram identificadas.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Análise Falhou',
        description: result.error,
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Entrada de Log de Atividade</CardTitle>
            <CardDescription>
              Cole seus logs de atividade brutos aqui. A IA irá analisá-los em busca de padrões suspeitos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={log}
              onChange={(e) => setLog(e.target.value)}
              placeholder="Cole os logs de atividade aqui..."
              className="h-64 font-mono text-xs"
            />
            <Button onClick={onAnalyze} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Analisar Log'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className={!analysis && !isLoading ? 'hidden' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" /> Resultados da Análise da IA
            </CardTitle>
            <CardDescription>
              Resumo e atividades sinalizadas com base no log fornecido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-8 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 <p className="text-muted-foreground">A IA está analisando os logs...</p>
              </div>
            )}
            {analysis && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Resumo</h3>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="mb-2 font-semibold">Atividades Sinalizadas</h3>
                  {analysis.flaggedActivities.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.flaggedActivities.map((activity, index) => (
                        <li key={index} className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm">
                           <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                          <span className="font-mono text-destructive">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma atividade suspeita detectada.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

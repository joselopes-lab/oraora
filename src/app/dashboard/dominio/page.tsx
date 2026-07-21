'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { registerCustomDomain, getBrokerDomainStatus } from './actions';
import { Loader2, Copy, CheckCircle2, AlertCircle, Info, Globe, Smartphone, ExternalLink, Share2, RefreshCw, ShieldCheck } from 'lucide-react';

type DnsRecord = {
  type: string;
  host: string;
  value: string;
  description?: string;
};

export default function DominioPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const { toast } = useToast();
  
  const [domainInput, setDomainInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeRecords, setActiveRecords] = useState<DnsRecord[]>([]);
  const [status, setStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const backendId = process.env.NEXT_PUBLIC_APP_HOSTING_BACKEND || 'studio';

  const loadStatus = async () => {
    if (isReady && user?.uid) {
      setIsLoadingStatus(true);
      try {
        const result = await getBrokerDomainStatus(user.uid);
        if (result.success && result.data) {
          setDomainInput(result.data.domainName);
          setActiveRecords(result.data.dnsRecords || []);
          setStatus(result.data.status);
        }
      } catch (err) {
        console.error("Error loading domain status:", err);
      } finally {
        setIsLoadingStatus(false);
      }
    }
  };

  useEffect(() => {
    loadStatus();
  }, [isReady, user?.uid]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Valor enviado para a área de transferência.",
    });
  };

  const handleRegister = async () => {
    if (!userProfile?.id || !domainInput) return;
    
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainInput.trim())) {
      toast({
        variant: "destructive",
        title: "Formato Inválido",
        description: "Insira um domínio válido, ex: meusite.com.br",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await registerCustomDomain(userProfile.id, domainInput);
      
      if (result.success) {
        toast({
          title: "Solicitação Enviada",
          description: result.message,
        });
        
        if (result.records && result.records.length > 0) {
          setActiveRecords(result.records);
        }
        
        setStatus(result.status || 'pending');
        
        if (result.domainName) {
            setDomainInput(result.domainName);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro no Registro",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Register Domain Click Error:", error);
      toast({
        variant: "destructive",
        title: "Falha de Conexão",
        description: "Não foi possível processar seu pedido agora.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Agrupamento visual dos registros para facilitar a vida do usuário
  const groupedRecords = useMemo(() => {
    const groups: Record<string, { title: string; icon: React.ReactNode; records: DnsRecord[] }> = {
      verification: {
        title: "Registros de Verificação e Segurança",
        icon: <ShieldCheck className="size-4 text-blue-600" />,
        records: []
      },
      apex: {
        title: "Apontamento do Domínio Principal (@)",
        icon: <Globe className="size-4 text-primary" />,
        records: []
      },
      www: {
        title: "Apontamento do Subdomínio (WWW)",
        icon: <Smartphone className="size-4 text-primary" />,
        records: []
      }
    };

    activeRecords.forEach(record => {
      // Registros TXT ou que contém subdomínios de sistema vão para verificação
      if (record.type === 'TXT' || record.host.startsWith('_')) {
        groups.verification.records.push(record);
      } else if (record.host === 'www') {
        groups.www.records.push(record);
      } else {
        groups.apex.push ? null : groups.apex.records.push(record);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.records.length > 0);
  }, [activeRecords]);

  if (!isReady || (isLoadingStatus && status === 'none')) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="size-5 animate-spin" />
        <p className="text-sm font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900">Configuração de Domínio</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Seu Endereço na Web</h1>
            <p className="text-slate-500 mt-1">Conecte seu domínio próprio para profissionalizar sua presença digital.</p>
          </div>
          {status !== 'none' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadStatus} 
              disabled={isLoadingStatus}
              className="font-bold gap-2 rounded-xl h-11"
            >
              <RefreshCw className={cn("size-4", isLoadingStatus && "animate-spin")} />
              Atualizar Status
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8 hover:border-primary/30 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                   <Globe className="size-5 text-primary" />
                   Domínio Personalizado
                </h2>
                <p className="text-sm text-slate-500">Apontando para a infraestrutura Oraora (<span className="font-bold text-slate-900">{backendId}</span>)</p>
              </div>
              {status === 'verified' && (
                <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] tracking-widest py-1.5 px-4">
                  <CheckCircle2 className="size-3 mr-1.5" /> ATIVO
                </Badge>
              )}
              {status === 'pending' && (
                <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] tracking-widest py-1.5 px-4 animate-pulse">
                  <Loader2 className="size-3 mr-1.5 animate-spin" /> AGUARDANDO DNS
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex-1">
                <Input 
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="h-14 px-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-lg shadow-inner" 
                  placeholder="ex: meusite.com.br" 
                  disabled={isVerifying || status === 'verified'}
                />
              </div>
              <Button 
                onClick={handleRegister}
                disabled={isVerifying || !domainInput || status === 'verified'}
                className="bg-primary hover:bg-primary-hover text-slate-950 font-black px-10 h-14 rounded-xl shadow-glow transition-all border-none"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : status === 'none' ? 'Registrar Domínio' : 'Reconfigurar'}
              </Button>
            </div>

            {activeRecords.length > 0 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 items-start">
                   <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                   <div className="text-left">
                     <p className="text-sm font-bold text-blue-900">Ação Necessária: Configure seu DNS</p>
                     <p className="text-xs text-blue-800 leading-relaxed">Acesse o painel do seu provedor de domínio (ex: Registro.br, Godaddy, Cloudflare) e adicione os registros abaixo exatamente como descritos.</p>
                   </div>
                </div>

                {groupedRecords.map(([key, group]) => (
                  <div key={key} className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shadow-sm">
                        {group.icon}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">{group.title}</h3>
                    </div>
                    
                    <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500 h-12 pl-6">Tipo</TableHead>
                            <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500 h-12">Host / Nome</TableHead>
                            <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-500 h-12 pr-6">Valor / Destino</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.records.map((record, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="font-medium pl-6">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "border-none font-black text-[10px] uppercase tracking-wider",
                                    record.type === 'TXT' ? "bg-slate-900 text-white" : "bg-primary text-slate-900"
                                  )}
                                >
                                  {record.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-bold text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                  <span>{record.host}</span>
                                  <button onClick={() => handleCopy(record.host)} className="p-1 hover:text-primary transition-colors cursor-pointer outline-none bg-transparent border-none">
                                    <Copy className="size-3" />
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell className="pr-6">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="truncate max-w-[200px] text-xs font-mono font-medium text-slate-500" title={record.value}>{record.value}</span>
                                  <button 
                                    onClick={() => handleCopy(record.value)}
                                    className="size-8 rounded-lg bg-slate-100 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shrink-0 cursor-pointer outline-none border-none"
                                  >
                                    <Copy className="size-4" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <section className="bg-slate-950 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary blur-[60px] opacity-10"></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2 text-left">
                <AlertCircle className="size-4" /> Importante
              </h3>
              <ul className="space-y-6 text-left">
                <li className="flex gap-4">
                   <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                   <p className="text-xs text-slate-400 leading-relaxed">A propagação DNS pode levar de <strong className="text-white">2h a 24h</strong>. Seus registros ficarão visíveis aqui até que a validação seja concluída.</p>
                </li>
                <li className="flex gap-4">
                   <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                   <p className="text-xs text-slate-400 leading-relaxed">O certificado SSL (HTTPS) é gerado <strong className="text-white">automaticamente</strong> assim que o domínio for verificado.</p>
                </li>
                <li className="flex gap-4">
                   <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                   <p className="text-xs text-slate-400 leading-relaxed">Configuramos tanto o domínio principal quanto o <strong className="text-white">www</strong> para garantir que seu site nunca fique offline.</p>
                </li>
              </ul>
              <Button asChild variant="link" className="text-primary text-xs font-bold p-0 mt-8 hover:no-underline hover:text-white">
                <a href="https://registro.br/ajuda/tutorial/dns/" target="_blank" rel="noreferrer" className="flex items-center gap-1">
                  Tutorial Passo a Passo <ExternalLink className="size-3" />
                </a>
              </Button>
           </section>

           <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Segurança Total</p>
                  <p className="text-sm font-bold text-slate-900">Certificado SSL Gratuito</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Sua conexão será 100% segura através de HTTPS, garantindo a confiança dos seus clientes e melhor posicionamento no Google.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

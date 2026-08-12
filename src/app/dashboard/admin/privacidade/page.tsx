'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Globe, FileText, Activity, Lock, CheckCircle2, AlertCircle, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPrivacyPage() {
  const { toast } = useToast();
  
  // State for tenant analytics configs (Real data only, no mocks)
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const [newTenantId, setNewTenantId] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newGaId, setNewGaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setIsLoadingTenants(true);
      setTenantError(null);
      const res = await fetch('/api/privacy/tenants-analytics');
      if (!res.ok) throw new Error('Falha ao carregar configurações de analytics');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err: any) {
      console.error(err);
      setTenantError(err.message || 'Erro ao carregar tenants');
    } finally {
      setIsLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // State for Policies
  const [policies, setPolicies] = useState([
    { id: 'pol-1', tenantId: 'oraora-global', type: 'privacy', version: '1.0', content: 'Política de Privacidade padrão OraOra...', status: 'published', updatedAt: '2026-08-01' },
    { id: 'pol-2', tenantId: 'oraora-global', type: 'cookies', version: '1.0', content: 'Política de Cookies e Rastreadores...', status: 'published', updatedAt: '2026-08-01' }
  ]);

  // State for Audit Logs (anonymized, no PII)
  const [auditLogs, setAuditLogs] = useState([
    { consentId: 'c_9a87f1b2', tenantId: 'oraora-global', domain: 'oraora.com.br', configurationVersion: '1.0', policyVersion: '1.0', preferences: 'necessary:true, analytics:true, marketing:false', timestamp: '2026-08-12 04:15:00', eventType: 'CONSENT_GRANTED' },
    { consentId: 'c_3b42e9a1', tenantId: 'broker-carlos', domain: 'carloscorretor.oraora.com.br', configurationVersion: '1.0', policyVersion: '1.0', preferences: 'necessary:true, analytics:false, marketing:false', timestamp: '2026-08-12 03:20:10', eventType: 'CONSENT_UPDATED' }
  ]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId || !newDomain) {
      toast({ title: 'Preencha os campos obrigatórios', description: 'Tenant ID e Domínio são necessários.', variant: 'destructive' });
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/privacy/tenants-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: newTenantId.trim(),
          domain: newDomain.trim(),
          googleAnalyticsId: newGaId.trim(),
          enabled: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar configuração');
      }

      toast({ title: 'Configuração salva', description: 'Tenant configurado com sucesso.' });
      setNewTenantId('');
      setNewDomain('');
      setNewGaId('');
      fetchTenants();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Shield className="size-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Privacidade e LGPD</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão centralizada do Consent Manager, políticas versionadas, auditoria de consentimento e integrações por tenant.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4" /> Consent Manager Ativo
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
            Versão Config: v1.0
          </Badge>
        </div>
      </div>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenants Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="size-5 text-primary" /> {tenants.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Domínios sob gestão de privacidade</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Políticas Publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="size-5 text-primary" /> {policies.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Privacidade & Cookies ativos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Categorias de Consentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="size-5 text-primary" /> 3 Ativas
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Necessary, Analytics, Marketing</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Logs de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="size-5 text-primary" /> {auditLogs.length} Registros
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Anônimos (Sem PII)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
          <TabsTrigger value="tenants">Analytics & Tenants</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="policies">Políticas Versionadas</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* TENANTS & ANALYTICS */}
        <TabsContent value="tenants" className="space-y-6">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Configuração de Analytics por Tenant</CardTitle>
              <CardDescription>Associe IDs do Google Analytics (GA4) por domínio/tenant com precedência para o consentimento do visitante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddTenant} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <Label htmlFor="tenantId" className="text-xs font-bold uppercase">Tenant ID</Label>
                  <Input id="tenantId" placeholder="ex: corretor-joao" value={newTenantId} onChange={(e) => setNewTenantId(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="domain" className="text-xs font-bold uppercase">Domínio / Subdomínio</Label>
                  <Input id="domain" placeholder="ex: joao.oraora.com.br" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gaId" className="text-xs font-bold uppercase">Google Analytics ID</Label>
                  <Input id="gaId" placeholder="ex: G-ABC123XYZ" value={newGaId} onChange={(e) => setNewGaId(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Adicionar Tenant</Button>
                </div>
              </form>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/80">
                    <TableRow>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Google Analytics ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTenants ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-5 animate-spin text-primary" /> Carregando configurações...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tenantError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-rose-500">
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="size-5" /> {tenantError}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          Nenhum tenant configurado. Adicione o primeiro tenant acima.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((t) => (
                        <TableRow key={t.tenantId || t.id}>
                          <TableCell className="font-semibold text-slate-900 dark:text-white">{t.tenantId}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300 font-mono text-xs">{t.domain}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">{t.googleAnalyticsId || 'Não configurado'}</TableCell>
                          <TableCell>
                            <Badge variant={t.enabled !== false ? 'default' : 'secondary'}>
                              {t.enabled !== false ? 'Habilitado' : 'Desabilitado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{t.updatedAt || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CATEGORIAS */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Categorias de Consentimento</CardTitle>
              <CardDescription>Gerencie as categorias de rastreamento e cookies exigidas pelo Consent Manager.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Necessary (Estritamente Necessários)</h4>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Obrigatório</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sessão, autenticação, segurança e estado essencial de funcionamento. Sempre ativos.</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Analytics</h4>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Opcional</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Google Analytics (GA4) para medição estatística anônima de tráfego e performance.</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Marketing</h4>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Opcional / Futuro</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pixels de conversão, remarketing e campanhas publicitárias.</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POLÍTICAS VERSIONADAS */}
        <TabsContent value="policies" className="space-y-6">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Políticas Versionadas</CardTitle>
              <CardDescription>Histórico de versões da Política de Privacidade e Termos de Cookies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/80">
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold capitalize text-slate-900 dark:text-white">{p.type}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{p.tenantId}</TableCell>
                        <TableCell><Badge variant="outline">v{p.version}</Badge></TableCell>
                        <TableCell><Badge className="bg-emerald-600">Publicado</Badge></TableCell>
                        <TableCell className="text-xs text-slate-400">{p.updatedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TRAIL */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Audit Trail de Consentimento</CardTitle>
              <CardDescription>Registros de comprovação de consentimento (estritamente anônimos, sem PII, IP ou fingerprints).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/80">
                    <TableRow>
                      <TableHead>Consent ID</TableHead>
                      <TableHead>Tenant / Domínio</TableHead>
                      <TableHead>Versões</TableHead>
                      <TableHead>Preferências Registradas</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.consentId}>
                        <TableCell className="font-mono text-xs text-slate-500">{log.consentId}</TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{log.tenantId}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.domain}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">Config v{log.configurationVersion} | Pol v{log.policyVersion}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">{log.preferences}</TableCell>
                        <TableCell className="text-xs text-slate-400">{log.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

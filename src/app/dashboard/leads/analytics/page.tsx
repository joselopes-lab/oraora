
'use client';

import { useAuthContext, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { subDays, isAfter } from 'date-fns';

type Lead = {
    id: string;
    name: string;
    status: string;
    createdAt: Timestamp;
    tempoTotalFechamentoEmDias?: number;
};

type LeadFunnelColumn = {
  id: string;
  title: string;
  order: number;
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function LeadsAnalyticsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'leads'), where('brokerId', '==', user.uid)) : null),
    [firestore, user]
  );
  
  const funnelColumnsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'brokers', user.uid, 'leadFunnels', 'default', 'columns'), orderBy('order')) : null),
    [firestore, user]
  );

  const { data: allLeads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: columns, isLoading: areColumnsLoading } = useCollection<LeadFunnelColumn>(funnelColumnsQuery);

  const analyticsData = useMemo(() => {
    if (!allLeads || !columns) {
      return {
        totalLeadsLast30Days: 0,
        closedLeadsLast30Days: 0,
        conversionRate: 0,
        avgClosingTime: 0,
        leadsPerStage: [],
      };
    }
    
    const thirtyDaysAgo = subDays(new Date(), 30);

    const leadsLast30Days = allLeads.filter(lead => isAfter(lead.createdAt.toDate(), thirtyDaysAgo));

    const totalLeadsLast30Days = leadsLast30Days.length;

    const closedLeadsLast30Days = leadsLast30Days.filter(lead => lead.status === 'converted').length;
    
    const conversionRate = totalLeadsLast30Days > 0 ? (closedLeadsLast30Days / totalLeadsLast30Days) * 100 : 0;
    
    const closedLeadsWithTime = allLeads.filter(lead => lead.status === 'converted' && typeof lead.tempoTotalFechamentoEmDias === 'number');
    const totalClosingTime = closedLeadsWithTime.reduce((acc, lead) => acc + (lead.tempoTotalFechamentoEmDias || 0), 0);
    const avgClosingTime = closedLeadsWithTime.length > 0 ? totalClosingTime / closedLeadsWithTime.length : 0;

    const leadsPerStage = columns.map(column => {
        const leadsInColumn = allLeads.filter(lead => lead.status === column.id).length;
        return { name: column.title, leads: leadsInColumn };
    });

    return {
      totalLeadsLast30Days,
      closedLeadsLast30Days,
      conversionRate,
      avgClosingTime,
      leadsPerStage,
    };
  }, [allLeads, columns]);

  const isLoading = areLeadsLoading || areColumnsLoading;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
            <Link className="hover:text-primary transition-colors" href="/dashboard/leads">Gestão de Leads</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-text-main">Análise de Performance</span>
          </nav>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Análise de Performance de Leads</h1>
          <p className="text-text-secondary mt-1">Métricas e insights sobre seu funil de vendas nos últimos 30 dias.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <span className="material-symbols-outlined text-muted-foreground">groups</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : analyticsData.totalLeadsLast30Days}</div>
            <p className="text-xs text-muted-foreground">nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Fechados</CardTitle>
            <span className="material-symbols-outlined text-muted-foreground">handshake</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : analyticsData.closedLeadsLast30Days}</div>
            <p className="text-xs text-muted-foreground">conversões nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
             <span className="material-symbols-outlined text-muted-foreground">percent</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${analyticsData.conversionRate.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Fechamento</CardTitle>
             <span className="material-symbols-outlined text-muted-foreground">hourglass_top</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${analyticsData.avgClosingTime.toFixed(1)} dias`}</div>
            <p className="text-xs text-muted-foreground">média histórica</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Leads por Etapa do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <ResponsiveContainer>
                <BarChart data={analyticsData.leadsPerStage}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 15)}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}

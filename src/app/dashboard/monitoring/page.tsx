
'use client';

import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe } from 'lucide-react';
import MonitoredSitesClient from './monitored-sites-client';
import DiscoverBuildersClient from './discover-builders-client';

export default function MonitoringPage() {
    return (
        <div className="space-y-6">
             <div className="flex items-start gap-4">
                <Globe className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Monitoramento e Descoberta</h1>
                    <p className="font-light text-[23px] text-black">Acompanhe sites e descubra novas construtoras parceiras com IA.</p>
                </div>
            </div>

            <Tabs defaultValue="monitoring" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monitoring">Monitoramento de Sites</TabsTrigger>
                    <TabsTrigger value="discover">Descobrir Novas Construtoras</TabsTrigger>
                </TabsList>
                <TabsContent value="monitoring" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monitoramento de Sites de Construtoras</CardTitle>
                            <CardDescription>
                                Acompanhe mudanças em sites externos para se manter atualizado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<div>Carregando...</div>}>
                                <MonitoredSitesClient />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="discover" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Descobrir Novas Construtoras</CardTitle>
                            <CardDescription>
                               Use a IA para encontrar construtoras em um estado que ainda não estão em sua base de dados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<div>Carregando...</div>}>
                                <DiscoverBuildersClient />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

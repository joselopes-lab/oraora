
'use client';

import { Suspense } from 'react';
import { Loader2, FilePlus, PlusCircle } from 'lucide-react';
import AvulsoClientPage from './avulso-client-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


function PropertyLimitCard() {
    const { propertyCount, propertyLimit } = useAuth();
    
    if (propertyLimit === null) {
        return null;
    }

    const usagePercentage = propertyLimit > 0 ? (propertyCount / propertyLimit) * 100 : 100;
    const isLimitReached = propertyCount >= propertyLimit;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Uso do Plano</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">
                        Você está usando <span className="font-bold text-foreground">{propertyCount}</span> de <span className="font-bold text-foreground">{propertyLimit}</span> imóveis permitidos.
                    </p>
                    <Button asChild variant="link" className="p-0 h-auto">
                        <Link href="/corretor/meu-plano">Ver planos</Link>
                    </Button>
                </div>
                <Progress value={usagePercentage} className={cn(isLimitReached && "[&>div]:bg-destructive")} />
            </CardContent>
        </Card>
    )
}

function AddPropertyButton() {
    const router = useRouter();
    const { propertyCount, propertyLimit } = useAuth();
    const isLimitReached = propertyLimit !== null && propertyCount >= propertyLimit;

    if (isLimitReached) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0}>
                            <Button size="sm" className="gap-1" disabled>
                                <PlusCircle className="h-4 w-4" /> Cadastrar Imóvel
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Você atingiu o limite de imóveis do seu plano.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return (
        <Button size="sm" className="gap-1" onClick={() => router.push('/corretor/avulso?edit=new')}>
            <PlusCircle className="h-4 w-4" /> Cadastrar Imóvel
        </Button>
    )
}

export default function AvulsoPage() {
  return (
    <div className="space-y-6">
        <div className="flex items-start gap-4">
            <FilePlus className="h-10 w-10 mt-2"/>
            <div>
                <h1 className="text-6xl font-thin tracking-tight">Imóveis Avulsos</h1>
                <p className="font-light text-[23px] text-black">Cadastre e gerencie seus imóveis particulares.</p>
            </div>
        </div>
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PropertyLimitCard />
        </Suspense>
        <div className="text-right">
             <Suspense fallback={<Button size="sm" className="gap-1" disabled><PlusCircle className="h-4 w-4" /> Cadastrar Imóvel</Button>}>
                <AddPropertyButton />
            </Suspense>
        </div>
      <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <AvulsoClientPage />
      </Suspense>
    </div>
  );
}

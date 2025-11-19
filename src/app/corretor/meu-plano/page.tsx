'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Check, Package, BadgeInfo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentDialog from '@/components/payment-dialog';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceAnnual?: number;
  description?: string;
  type: 'corretor' | 'construtora';
  features: string[];
  userLimit?: number;
  propertyLimit?: number;
  isFree?: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function MeuPlanoCorretorPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserPlanId, setCurrentUserPlanId] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    useEffect(() => {
        if (!user) return;

        const plansQuery = query(collection(db, 'plans'), where('type', '==', 'corretor'));
        const unsubscribePlans = onSnapshot(plansQuery, (snapshot) => {
            const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
            fetchedPlans.sort((a,b) => a.price - b.price);
            setPlans(fetchedPlans);
            setIsLoading(false);
        });

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setCurrentUserPlanId(doc.data().planId || null);
            }
        });

        return () => {
            unsubscribePlans();
            unsubscribeUser();
        };
    }, [user]);

    const handleSelectPlan = async (plan: Plan) => {
        if (!user) return;

        if (plan.isFree) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { planId: plan.id });
                toast({
                    title: "Plano Ativado!",
                    description: `Você agora está no plano ${plan.name}.`,
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Erro ao ativar plano",
                    description: "Não foi possível atualizar sua assinatura. Tente novamente.",
                });
            }
        } else {
            setSelectedPlan(plan);
            setIsPaymentDialogOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Package className="h-10 w-10 mt-2"/>
                <div>
                    <h1 className="text-6xl font-thin tracking-tight">Meu Plano</h1>
                    <p className="font-light text-[23px] text-black">Visualize os planos disponíveis e gerencie sua assinatura.</p>
                </div>
            </div>

            <Tabs defaultValue="monthly" onValueChange={(value) => setBillingCycle(value as any)} className="w-full max-w-sm mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly">Mensal</TabsTrigger>
                    <TabsTrigger value="annual">Anual</TabsTrigger>
                </TabsList>
            </Tabs>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mt-8">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.id === currentUserPlanId;
                        const price = billingCycle === 'annual' && plan.priceAnnual ? plan.priceAnnual : plan.price;
                        const period = billingCycle === 'annual' && plan.priceAnnual ? '/ano' : '/mês';

                        return (
                            <Card key={plan.id} className={`flex flex-col ${isCurrentPlan ? 'border-primary ring-2 ring-primary' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    {plan.description && <CardDescription>{plan.description}</CardDescription>}
                                    <div className="pt-4">
                                        <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                                        <span className="text-muted-foreground">{period}</span>
                                        {billingCycle === 'annual' && plan.priceAnnual && (
                                            <p className="text-sm text-green-600 font-semibold mt-1">
                                                Economize {formatCurrency((plan.price * 12) - plan.priceAnnual)}!
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {plan.propertyLimit !== undefined && (
                                            <li className="flex items-start gap-2">
                                                <BadgeInfo className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                                <span>Até <strong>{plan.propertyLimit} imóveis</strong></span>
                                            </li>
                                        )}
                                    </ul>
                                </CardContent>
                                <CardFooter className="mt-auto">
                                    {isCurrentPlan ? (
                                        <Button className="w-full" disabled variant="outline">Seu Plano Atual</Button>
                                    ) : (
                                        <Button className="w-full" onClick={() => handleSelectPlan(plan)}>
                                            Selecionar Plano
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                plan={selectedPlan}
                billingCycle={billingCycle}
            />
        </div>
    );
}

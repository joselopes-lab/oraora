
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Plan = {
    id: string;
    name: string;
    description: string;
    features?: string[];
    price: number;
    promoPrice?: number;
    userCount?: number;
    type: 'corretor' | 'construtora';
    isActive: boolean;
    propertyLimit?: number;
};

type User = {
    id: string;
    planId: string;
    userType: 'broker' | 'constructor' | 'admin' | 'client';
}

export default function AdminPlanosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'corretor' | 'construtora'>('corretor');
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

    const plansQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'plans')) : null), [firestore]);
    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);

    const { data: plans, isLoading: arePlansLoading } = useCollection<Plan>(plansQuery);
    const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

    const isLoading = arePlansLoading || areUsersLoading;
    
    const planUserCounts = useMemo(() => {
        if (!users) return {};
        return users.reduce((acc, user) => {
            if (user.planId) {
                acc[user.planId] = (acc[user.planId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [users]);

    const mrr = useMemo(() => {
        if (!plans || !users) return 0;
        return plans.reduce((acc, plan) => {
            const count = planUserCounts[plan.id] || 0;
            const priceToUse = plan.promoPrice && plan.promoPrice > 0 ? plan.promoPrice : plan.price;
            return acc + (priceToUse * count);
        }, 0);
    }, [plans, users, planUserCounts]);

    const totalBrokers = useMemo(() => users?.filter(u => u.userType === 'broker').length || 0, [users]);
    const totalConstructors = useMemo(() => users?.filter(u => u.userType === 'constructor').length || 0, [users]);


    const filteredPlans = useMemo(() => {
        return plans?.filter(plan => plan.type === activeTab) || [];
    }, [plans, activeTab]);

    const handleStatusChange = (plan: Plan, newStatus: boolean) => {
        if (!firestore) return;
        const planDocRef = doc(firestore, 'plans', plan.id);
        setDocumentNonBlocking(planDocRef, { isActive: newStatus }, { merge: true });
        toast({
          title: "Status alterado!",
          description: `O plano "${plan.name}" foi ${newStatus ? 'ativado' : 'desativado'}.`,
        });
    }

    const handleDeletePlan = () => {
        if (!planToDelete || !firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'plans', planToDelete.id));
        toast({
            title: "Plano Excluído!",
            description: `O plano "${planToDelete.name}" foi removido com sucesso.`,
            variant: "destructive"
        });
        setPlanToDelete(null);
    };

    return (
        <AlertDialog>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                        <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-text-main">Adesão e Planos</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Dashboard de Adesão</h1>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-hover">
                            <span className="material-symbols-outlined">person_pin</span>
                        </div>
                        <span className="text-xs font-bold text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Total de Corretores</p>
                    <h3 className="text-2xl font-bold text-text-main">{isLoading ? '...' : totalBrokers}</h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                        <div className="bg-primary h-1.5 rounded-full" style={{width: '75%'}}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined">apartment</span>
                        </div>
                        <span className="text-xs font-bold text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> +8%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Total de Construtoras</p>
                    <h3 className="text-2xl font-bold text-text-main">{isLoading ? '...' : totalConstructors}</h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                        <div className="bg-secondary h-1.5 rounded-full" style={{width: '45%'}}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <span className="text-xs font-bold text-text-secondary">Mensal</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-1">MRR Total</p>
                    <h3 className="text-2xl font-bold text-text-main">{isLoading ? '...' : mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <p className="text-[10px] text-text-secondary mt-4 font-bold uppercase tracking-wider">Meta: R$ 200k</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-500">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_down</span> -2%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Taxa de Conversão</p>
                    <h3 className="text-2xl font-bold text-text-main">14.8%</h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{width: '14.8%'}}></div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Gestão de Planos</h2>
                    <p className="text-sm text-text-secondary">Configure e monitore o desempenho de cada oferta.</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-text-main rounded-lg text-sm font-bold shadow-soft flex items-center gap-2 transition-all">
                        <Link href="/dashboard/admin/planos/novo">
                            <span className="material-symbols-outlined text-[18px]">add</span> Novo Plano
                        </Link>
                    </Button>
                    <Button variant="outline" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span> Filtrar
                    </Button>
                </div>
            </div>
            <div className="border-b border-gray-200 mb-8 flex gap-8">
                <button onClick={() => setActiveTab('corretor')} className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'corretor' ? 'text-text-main border-primary' : 'text-text-secondary border-transparent hover:text-text-main transition-all'}`}>Corretor</button>
                <button onClick={() => setActiveTab('construtora')} className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'construtora' ? 'text-text-main border-primary font-bold' : 'text-text-secondary border-transparent hover:text-text-main transition-all'}`}>Construtora</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? Array.from({length: 4}).map((_, i) => <div key={i} className="bg-white rounded-xl h-96 animate-pulse"/>) : filteredPlans.map(plan => {
                    const features = plan.features || (plan.description ? plan.description.split(',').map(f => f.trim()) : []);
                    return (
                        <div key={plan.id} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all border-t-4 border-t-primary relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button asChild variant="ghost" size="icon" className="size-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-text-secondary transition-colors" title="Editar">
                                   <Link href={`/dashboard/admin/planos/editar/${plan.id}`}>
                                     <span className="material-symbols-outlined text-[18px]">edit</span>
                                   </Link>
                                </Button>
                                <AlertDialogTrigger asChild>
                                    <button onClick={() => setPlanToDelete(plan)} className="size-8 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center text-text-secondary hover:text-red-500 transition-colors" title="Excluir">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </AlertDialogTrigger>
                            </div>
                            <div className="p-6 flex-grow">
                                <h3 className="text-lg font-bold text-text-main pr-20">{plan.name}</h3>
                                <div className="mt-4 mb-4">
                                    {plan.promoPrice && plan.promoPrice > 0 ? (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-text-main bg-primary/20 px-1 rounded">
                                                {plan.promoPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <span className="text-text-secondary text-sm font-medium line-through">
                                                {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-3xl font-bold text-text-main bg-primary/20 px-1 rounded">
                                            {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    )}
                                    <span className="text-text-secondary text-sm font-medium">/mês</span>
                                </div>
                                <div className="space-y-3 mb-6">
                                    {features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-text-main">
                                            <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span> {feature}
                                        </div>
                                    ))}
                                     {plan.propertyLimit !== undefined && (
                                        <div className="flex items-center gap-2 text-sm text-text-main">
                                            <span className="material-symbols-outlined text-secondary text-[18px]">home_work</span> Limite de {plan.propertyLimit} imóveis
                                        </div>
                                    )}
                                </div>
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-medium">Usuários ativos</span>
                                        <span className="text-text-main font-bold">{planUserCounts[plan.id] || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-background-light p-4 flex items-center justify-between border-t border-gray-100">
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Status do Plano</span>
                                <Switch
                                  checked={plan.isActive}
                                  onCheckedChange={(newStatus) => handleStatusChange(plan, newStatus)}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o plano <span className="font-bold">{planToDelete?.name}</span> e pode afetar os usuários assinantes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, excluir plano
                  </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

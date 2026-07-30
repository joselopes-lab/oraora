'use client';
import PropertyForm, { PropertyFormData } from '../../imoveis/components/property-form';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, addDocumentNonBlocking, useAuthContext } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NewAvulsoPropertyPage() {
    const [step, setStep] = useState<'select' | 'form'>('select');
    const [initialTypes, setInitialTypes] = useState<string[]>(['sale']);
    
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userProfile } = useAuthContext();

    const handleSelectMode = (types: string[]) => {
        setInitialTypes(types);
        setStep('form');
    };

    const handleSave = async (data: PropertyFormData) => {
        if (!firestore || !user || !userProfile) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para criar um imóvel.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // --- LIMIT CHECK ---
            if (userProfile.planId) {
                const planDocRef = doc(firestore, 'plans', userProfile.planId);
                const planDoc = await getDoc(planDocRef);
                
                if (planDoc.exists()) {
                    const propertyLimit = planDoc.data()?.propertyLimit;

                    if (propertyLimit !== undefined && propertyLimit !== null) {
                        const brokerPropertiesQuery = query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid));
                        const brokerPropertiesSnapshot = await getDocs(brokerPropertiesQuery);
                        const avulsoCount = brokerPropertiesSnapshot.size;

                        const portfolioDocRef = doc(firestore, 'portfolios', user.uid);
                        const portfolioDoc = await getDoc(portfolioDocRef);
                        const portfolioPropertyIds = portfolioDoc.exists() ? portfolioDoc.data()?.propertyIds || [] : [];
                        
                        let portfolioCount = 0;
                        if (portfolioPropertyIds.length > 0) {
                            const propertiesRef = collection(firestore, 'properties');
                            for (let i = 0; i < portfolioPropertyIds.length; i += 30) {
                                const batchIds = portfolioPropertyIds.slice(i, i + 30);
                                if (batchIds.length > 0) {
                                    const q = query(propertiesRef, where('__name__', 'in', batchIds));
                                    const propertiesSnap = await getDocs(q);
                                    portfolioCount += propertiesSnap.size;
                                }
                            }
                        }
                        
                        const totalPropertyCount = avulsoCount + portfolioCount;

                        if (totalPropertyCount >= propertyLimit) {
                            toast({
                                variant: 'destructive',
                                title: 'Limite Atingido',
                                description: `Você atingiu o limite de ${propertyLimit} imóveis para o seu plano. Faça um upgrade para cadastrar mais.`,
                            });
                            setIsSubmitting(false);
                            return;
                        }
                    }
                }
            }
            // --- END LIMIT CHECK ---

            toast({
                title: 'Imóvel Cadastrado!',
                description: `O imóvel "${data.informacoesbasicas.nome}" foi salvo com sucesso.`,
            });
            router.push('/dashboard/avulso');

        } catch (error) {
            console.error("Erro ao cadastrar imóvel avulso: ", error);
             toast({
                variant: 'destructive',
                title: 'Uh oh! Algo deu errado.',
                description: 'Não foi possível salvar os dados do imóvel.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'select') {
        return (
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left">
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Novo Cadastro Avulso</h1>
                    <p className="text-slate-500">Qual a finalidade deste imóvel?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card 
                        onClick={() => handleSelectMode(['sale'])}
                        className="group p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300"
                    >
                        <div className="size-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-primary group-hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-4xl">sell</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Apenas Venda</h3>
                        <p className="text-sm text-slate-500">Imóvel disponível exclusivamente para comercialização direta.</p>
                        <Button variant="ghost" className="mt-4 font-bold text-primary">Iniciar Cadastro</Button>
                    </Card>

                    <Card 
                        onClick={() => handleSelectMode(['rent'])}
                        className="group p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300"
                    >
                        <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-primary group-hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-4xl">key</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Apenas Aluguel</h3>
                        <p className="text-sm text-slate-500">Imóvel disponível apenas para locação mensal.</p>
                        <Button variant="ghost" className="mt-4 font-bold text-primary">Iniciar Cadastro</Button>
                    </Card>

                    <Card 
                        onClick={() => handleSelectMode(['sale', 'rent'])}
                        className="group p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 border-2 border-slate-100"
                    >
                        <div className="size-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-primary group-hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-4xl">sync_alt</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Ambos (Venda/Aluguel)</h3>
                        <p className="text-sm text-slate-500">O imóvel pode ser tanto vendido quanto alugado simultaneamente.</p>
                        <Button variant="ghost" className="mt-4 font-bold text-primary">Iniciar Cadastro</Button>
                    </Card>
                </div>

                <div className="mt-12 text-center">
                    <Button asChild variant="ghost" className="text-slate-400 font-bold">
                        <Link href="/dashboard/avulso">Cancelar e Voltar</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <PropertyForm 
              onSave={handleSave} 
              isEditing={false} 
              isSubmitting={isSubmitting}
              propertyData={{
                  informacoesbasicas: {
                      transactionTypes: initialTypes
                  } as any
              }}
            />
        </main>
    );
}
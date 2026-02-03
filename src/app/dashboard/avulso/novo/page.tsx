'use client';
import PropertyForm, { PropertyFormData } from '../../imoveis/components/property-form';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, addDocumentNonBlocking, useAuthContext } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

export default function NewAvulsoPropertyPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userProfile } = useAuthContext();

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
                        // Get avulso count
                        const brokerPropertiesQuery = query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid));
                        const brokerPropertiesSnapshot = await getDocs(brokerPropertiesQuery);
                        const avulsoCount = brokerPropertiesSnapshot.size;

                        // Get portfolio count by fetching actual properties to avoid counting stale IDs
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
                            return; // Stop execution
                        }
                    }
                }
            }
            // --- END LIMIT CHECK ---

            const propertiesCollectionRef = collection(firestore, 'brokerProperties');
            const dataToSave = {
              ...data,
              brokerId: user.uid, // Ensure brokerId is set to the current user
              builderId: user.uid, // For avulso, builderId and brokerId are the same
            };

            await addDocumentNonBlocking(propertiesCollectionRef, dataToSave);
            
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

    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <PropertyForm 
              onSave={handleSave} 
              isEditing={false} 
              isSubmitting={isSubmitting}
            />
        </main>
    );
}

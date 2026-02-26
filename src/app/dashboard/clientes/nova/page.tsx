'use client';
import { useRouter } from 'next/navigation';
import ClientForm, { ClientFormData } from '../components/client-form';
import { useAuth, useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: ClientFormData) => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para criar um cliente.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const leadsCollectionRef = collection(firestore, 'leads');

            // Calculate lead score
            let score = 20; // Base score
            if (data.source === 'WhatsApp') {
              score += 20;
            }
            // Using propertyInterest as a proxy for a detailed message in manual creation
            if (data.propertyInterest && data.propertyInterest.length > 80) {
              score += 20;
            }
            if (data.propertyInterest) {
              score += 20;
            }
            if (data.name && data.phone) {
                score += 20;
            }

            let qualification: 'Quente' | 'Morno' | 'Frio' = 'Frio';
            if (score >= 70) {
              qualification = 'Quente';
            } else if (score >= 40) {
              qualification = 'Morno';
            }

            await addDocumentNonBlocking(leadsCollectionRef, {
                ...data,
                message: '', // Add empty message for consistency
                brokerId: user.uid,
                createdAt: serverTimestamp(),
                leadScore: score,
                leadQualification: qualification
            });
            
            toast({
                title: 'Cliente Cadastrado!',
                description: `O cliente "${data.name}" foi salvo com sucesso.`,
            });
            router.push('/dashboard/clientes');

        } catch (error) {
            console.error("Erro ao cadastrar cliente: ", error);
             toast({
                variant: 'destructive',
                title: 'Uh oh! Algo deu errado.',
                description: 'Não foi possível salvar os dados do cliente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <ClientForm onSave={handleSave} isEditing={false} isSubmitting={isSubmitting}/>
        </main>
    );
}

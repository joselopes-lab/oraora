
'use client';
import { useRouter } from 'next/navigation';
import PropertyForm, { PropertyFormData } from '../components/property-form';
import { useFirestore, addDocumentNonBlocking, useAuth, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


export default function NewPropertyPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: PropertyFormData) => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para criar um imóvel.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const propertiesCollectionRef = collection(firestore, 'properties');
            // Ensure the builderId is set, especially if the current user is a constructor
            const dataToSave = {
              ...data,
              // If the builderId is not set from the form, and the user is a constructor, set it.
              builderId: data.builderId || (user.uid),
            };

            await addDocumentNonBlocking(propertiesCollectionRef, dataToSave);
            
            toast({
                title: 'Imóvel Cadastrado!',
                description: `O imóvel "${data.informacoesbasicas.nome}" foi salvo com sucesso.`,
            });
            router.push('/dashboard/imoveis');

        } catch (error) {
            console.error("Erro ao cadastrar imóvel: ", error);
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

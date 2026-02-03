
'use client';
import { useRouter, useParams } from 'next/navigation';
import ClientForm, { ClientFormData } from '../../components/client-form';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    propertyInterest?: string;
    source?: string;
    status: "new" | "contacted" | "qualified" | "proposal" | "converted" | "lost";
    createdAt: string;
     address?: {
        street?: string;
        complement?: string;
        city?: string;
        state?: string;
    };
    personaIds?: string[];
};

export default function EditClientPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const leadDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'leads', id as string) : null),
      [firestore, id]
    );

    const { data: client, isLoading } = useDoc<Lead>(leadDocRef);

    const handleSave = async (data: ClientFormData) => {
        if (!leadDocRef) return;
        setIsSubmitting(true);
        try {
            await setDocumentNonBlocking(leadDocRef, data, { merge: true });
            toast({
                title: 'Cliente Atualizado!',
                description: `Os dados de "${data.name}" foram salvos.`,
            });
            router.push(`/dashboard/clientes/${id}`);
        } catch (error) {
            console.error("Erro ao atualizar cliente: ", error);
            toast({
                variant: 'destructive',
                title: 'Uh oh! Algo deu errado.',
                description: 'Não foi possível salvar os dados do cliente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Carregando dados do cliente...</p>
             </main>
        )
    }

    if (!client) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Cliente não encontrado.</p>
             </main>
        )
    }


    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <ClientForm onSave={handleSave} isEditing={true} clientData={client} isSubmitting={isSubmitting}/>
        </main>
    );
}


'use client';
import { useRouter } from 'next/navigation';
import ConstructorForm, { ConstructorFormData } from '../components/constructor-form';
import { useAuthContext } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { createConstructorServer } from '../actions.server';

export default function NewConstructorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: ConstructorFormData) => {
        setIsSubmitting(true);
        
        try {
            const idToken = user ? await user.getIdToken() : undefined;
            const result = await createConstructorServer(data, idToken);

            if (!result.success) {
                throw new Error(result.error || 'Erro ao criar construtora.');
            }

            toast({
                title: 'Construtora Cadastrada!',
                description: `A construtora "${data.name}" foi salva com sucesso.`,
            });
            router.push('/dashboard/construtoras');

        } catch (error: any) {
            console.error('Erro ao cadastrar construtora:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Cadastrar',
                description: error.message || 'Ocorreu um erro ao salvar a construtora. Tente novamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <ConstructorForm onSave={handleSave} isEditing={false} isSubmitting={isSubmitting} />
        </main>
    );
}

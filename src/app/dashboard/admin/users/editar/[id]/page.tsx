
'use client';
import { useRouter, useParams } from 'next/navigation';
import UserForm, { UserFormData } from '../../components/user-form';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


// This needs to be more specific, combining user and broker/constructor data
type CombinedUserData = {
    username: string;
    userType: 'admin' | 'broker' | 'constructor';
    email: string;
    phone?: string;
    whatsapp?: string;
    isActive: boolean;
    planId?: string;
    // from broker/constructor
    cpf?: string;
    creci?: string;
    cnpj?: string;
    address?: string;
    state?: string;
    city?: string;
    avatarUrl?: string;
};


export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'users', id as string) : null),
      [firestore, id]
    );
    const { data: userData, isLoading } = useDoc<CombinedUserData>(userDocRef);


    const handleSave = async (data: UserFormData) => {
        if (!firestore || !id) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as alterações.' });
             return;
        }
        setIsSubmitting(true);

        const userDocRef = doc(firestore, 'users', id as string);
        const userDataToUpdate = {
            username: data.name,
            userType: data.userType,
            isActive: data.isActive,
            phone: data.phone,
            whatsapp: data.whatsapp,
            planId: data.planId || null
        };
        
        try {
            await setDocumentNonBlocking(userDocRef, userDataToUpdate, { merge: true });

            if (data.userType === 'broker') {
                const brokerDocRef = doc(firestore, 'brokers', id as string);
                await setDocumentNonBlocking(brokerDocRef, { creci: data.creci }, { merge: true });
            } else if (data.userType === 'constructor') {
                const constructorDocRef = doc(firestore, 'constructors', id as string);
                await setDocumentNonBlocking(constructorDocRef, { cnpj: data.cnpj }, { merge: true });
            }
            
            toast({
                title: "Usuário atualizado!",
                description: `Os dados de "${data.name}" foram salvos com sucesso.`,
            });
            router.push('/dashboard/admin/users');
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Não foi possível atualizar o usuário.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
      return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
          <p>Carregando dados do usuário...</p>
        </main>
      )
    }

    if (!userData) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Usuário não encontrado.</p>
             </main>
        )
    }

    const transformedData: UserFormData = {
      ...userData,
      name: userData.username, // Map username to name for the form
    };


    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <UserForm onSave={handleSave} isEditing={true} userData={transformedData} />
        </main>
    );
}

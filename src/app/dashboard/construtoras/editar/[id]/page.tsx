
'use client';
import { useRouter, useParams } from 'next/navigation';
import ConstructorForm, { ConstructorFormData } from '../../components/constructor-form';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

type ConstructorDoc = {
    id: string;
    userId: string;
    websiteUrl: string;
    name: string;
    cnpj: string;
    stateRegistration: string;
    address: string;
    state: string;
    city: string;
    zip: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    publicEmail: string;
    logoUrl: string;
    isVisibleOnSite: boolean;
};

type UserDoc = {
    id: string;
    username: string;
    email: string;
};

export default function EditConstructorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { toast } = useToast();
    const auth = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const constructorDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'constructors', id) : null),
      [firestore, id]
    );
    const { data: constructorDoc, isLoading: isConstructorLoading } = useDoc<ConstructorDoc>(constructorDocRef);

    const userDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'users', id) : null),
      [firestore, id]
    );
    const { data: userDoc, isLoading: isUserLoading } = useDoc<UserDoc>(userDocRef);

    const handleSave = async (data: ConstructorFormData) => {
        if (!firestore || !id) return;
        setIsSubmitting(true);

        try {
            // Update constructor document
            const constructorDataToUpdate = {
                websiteUrl: data.website || '',
                name: data.name,
                cnpj: data.cnpj || '',
                stateRegistration: data.stateRegistration || '',
                address: data.address || '',
                state: data.state,
                city: data.city,
                zip: data.zip || '',
                phone: data.phone || '',
                whatsapp: data.whatsapp || '',
                instagram: data.instagram || '',
                publicEmail: data.publicEmail || '',
                logoUrl: data.logoUrl || '',
                isVisibleOnSite: data.isVisibleOnSite,
            };
            setDocumentNonBlocking(constructorDocRef!, constructorDataToUpdate, { merge: true });

            // Update user document
            const userDataToUpdate = {
                username: data.name,
            };
            setDocumentNonBlocking(userDocRef!, userDataToUpdate, { merge: true });

            // Update password if provided
            if (data.newPassword && auth?.currentUser) {
                // This part is tricky because it might require reauthentication.
                // For admin-driven password changes, this would typically be done with Admin SDK.
                // A client-side re-auth flow is complex for an admin editing a user.
                // For this example, we'll assume the currently logged-in user is the one being edited,
                // which is not the case in an admin panel. A proper solution requires a backend function.
                // We'll show a toast to indicate this limitation.
                toast({
                    title: 'Aviso sobre senha',
                    description: 'A alteração de senha de outros usuários requer um fluxo de reautenticação complexo e não está implementada nesta demonstração.',
                });
            }

            toast({
                title: 'Construtora Atualizada!',
                description: `Os dados de "${data.name}" foram atualizados.`,
            });
            router.push('/dashboard/construtoras');

        } catch (error: any) {
            console.error("Erro ao atualizar construtora: ", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Algo deu errado.",
                description: "Não foi possível atualizar os dados da construtora.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isLoading = isConstructorLoading || isUserLoading;

    if (isLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Carregando dados da construtora...</p>
             </main>
        )
    }

    if (!constructorDoc || !userDoc) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Construtora não encontrada.</p>
             </main>
        )
    }

    const formData = {
        ...constructorDoc,
        ...userDoc,
        website: constructorDoc.websiteUrl,
        accessEmail: userDoc.email,
        name: constructorDoc.name,
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <ConstructorForm onSave={handleSave} isEditing={true} constructorData={formData} isSubmitting={isSubmitting}/>
        </main>
    );
}

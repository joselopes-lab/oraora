
'use client';
import { useRouter, useParams } from 'next/navigation';
import ConstructorForm, { ConstructorFormData } from '../../components/constructor-form';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';

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
                accessEmail: data.accessEmail
            };
            setDocumentNonBlocking(constructorDocRef!, constructorDataToUpdate, { merge: true });

            // Update user document (The contact/display email in Firestore)
            const userDataToUpdate = {
                username: data.name,
                email: data.accessEmail
            };
            setDocumentNonBlocking(userDocRef!, userDataToUpdate, { merge: true });

            toast({
                title: 'Dados Atualizados!',
                description: `As informações de "${data.name}" foram salvas no banco de dados.`,
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

    const handleResetPassword = async (email: string) => {
        if (!email || !auth) {
            toast({
                variant: "destructive",
                title: "Dados insuficientes",
                description: "O serviço de autenticação não está pronto ou o e-mail está vazio.",
            });
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Comando enviado!",
                description: `Um link de redefinição de senha foi disparado para ${email}. Peça para verificarem a caixa de entrada.`,
            });
        } catch (error: any) {
            console.error("Erro ao enviar e-mail de redefinição:", error);
            let description = "Não foi possível disparar o e-mail agora. Tente novamente mais tarde.";
            
            if (error.code === 'auth/user-not-found') {
                description = "Este e-mail não existe no sistema de login. Se você trocou o e-mail acima, deve primeiro alterá-lo manualmente no Console do Firebase para que a redefinição funcione.";
            } else if (error.code === 'auth/invalid-email') {
                description = "O e-mail digitado não é um formato válido.";
            }

            toast({
                variant: "destructive",
                title: "Erro de Sincronização",
                description: description,
            });
        }
    };
    
    const isLoading = isConstructorLoading || isUserLoading;

    if (isLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p className="text-center py-20 text-slate-400 italic">Carregando dossiê da construtora...</p>
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
            <ConstructorForm 
                onSave={handleSave} 
                isEditing={true} 
                constructorData={formData} 
                isSubmitting={isSubmitting}
                onResetPassword={handleResetPassword}
            />
        </main>
    );
}

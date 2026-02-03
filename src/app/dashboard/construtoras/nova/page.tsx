
'use client';
import { useRouter } from 'next/navigation';
import ConstructorForm, { ConstructorFormData } from '../components/constructor-form';
import { useAuth, useFirestore, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useState } from 'react';

// Function to format constructor name into an email-friendly string
const formatNameToEmail = (name: string) => {
    return name
        .toLowerCase()
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
};


export default function NewConstructorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: ConstructorFormData) => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Serviços do Firebase não estão disponíveis.' });
            return;
        }

        setIsSubmitting(true);
        
        const email = `${formatNameToEmail(data.name)}@oraora.com.br`;

        try {
            // 1. Create user in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, data.newPassword || 'defaultPassword123');
            const user = userCredential.user;

            // 2. Update Auth profile
            await updateProfile(user, { displayName: data.name });

            // 3. Create user document in 'users' collection
            const userDocRef = doc(firestore, 'users', user.uid);
            const userData = {
                id: user.uid,
                username: data.name,
                email: email,
                userType: 'constructor',
                isActive: true, // New constructors are active by default
                planId: 'constructor-default', // Or some initial plan
            };
            setDocumentNonBlocking(userDocRef, userData, { merge: true });

            // 4. Create constructor document in 'constructors' collection
            const constructorDocRef = doc(firestore, 'constructors', user.uid);
            const constructorData = {
                id: user.uid,
                userId: user.uid,
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
                isVisibleOnSite: data.isVisibleOnSite
            };
            setDocumentNonBlocking(constructorDocRef, constructorData, { merge: true });


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
                description: error.code === 'auth/email-already-in-use'
                    ? 'Este e-mail já está em uso por outra conta.'
                    : 'Ocorreu um erro ao salvar a construtora. Tente novamente.',
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

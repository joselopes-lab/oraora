'use client';
import { useRouter } from 'next/navigation';
import UserForm, { UserFormData } from '../components/user-form';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { createAdminUserServer } from '../actions.server';

export default function NewUserPage() {
    const router = useRouter();
    const { auth } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: UserFormData) => {
        if (!data.name || !data.email || !data.userType) {
            toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios (Nome, Email, Tipo de Usuário).' });
            return;
        }

        if (!data.password || data.password.length < 6) {
            toast({ variant: 'destructive', title: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        if (data.password !== data.confirmPassword) {
            toast({ variant: 'destructive', title: 'As senhas não conferem.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const idToken = await auth?.currentUser?.getIdToken();
            if (!idToken) {
                toast({ variant: 'destructive', title: 'Usuário não autenticado ou sessão expirada.' });
                setIsSubmitting(false);
                return;
            }

            const result = await createAdminUserServer({
                name: data.name,
                email: data.email,
                password: data.password,
                userType: data.userType,
                cpf: data.cpf,
                creci: data.creci,
                cnpj: data.cnpj,
                address: data.address,
                state: data.state,
                city: data.city,
                phone: data.phone,
                whatsapp: data.whatsapp,
                isActive: data.isActive,
                planId: data.planId,
                avatarUrl: data.avatarUrl,
                idToken,
            });

            if (result.success) {
                toast({
                    title: 'Sucesso',
                    description: 'Usuário cadastrado com sucesso.',
                });
                router.push('/dashboard/admin/users');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao cadastrar',
                    description: result.error || 'Não foi possível cadastrar o usuário.',
                });
            }
        } catch (error: any) {
            console.error('Erro ao salvar novo usuário:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message || 'Erro inesperado ao cadastrar usuário.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <UserForm onSave={handleSave} isEditing={false} isSubmitting={isSubmitting} />
        </main>
    );
}

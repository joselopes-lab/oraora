'use client';
import { useParams, useRouter } from 'next/navigation';
import PropertyForm, { PropertyFormData } from '@/app/dashboard/imoveis/components/property-form';
import { useFirestore, useAuthContext, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { isAdminUser } from '@/lib/permissions';

export default function ConstructorNewPropertyPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, userProfile, isReady } = useAuthContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Strict security check using resolved session profile and tenantId
    const authenticatedTenantId = userProfile?.tenantId || user?.uid;
    const isAdmin = isAdminUser(userProfile?.userType) || userProfile?.userType === 'admin';
    const isAuthorized = isAdmin || (authenticatedTenantId && authenticatedTenantId === id);

    useEffect(() => {
        if (isReady && user && !isAuthorized) {
            toast({
                variant: 'destructive',
                title: 'Acesso Negado',
                description: 'Você não tem permissão para cadastrar imóveis para esta construtora.',
            });
            router.replace(`/dashboard/construtoras/${authenticatedTenantId || user.uid}/imoveis`);
        }
    }, [isReady, user, isAuthorized, authenticatedTenantId, router, toast]);

    const handleSave = async (data: PropertyFormData) => {
        const authoritativeBuilderId = isAdmin ? id : authenticatedTenantId;
        router.push(`/dashboard/construtoras/${authoritativeBuilderId || id}/imoveis?tab=avulsos`);
    };

    if (!isReady) {
        return <div className="py-24 text-center text-text-secondary">Carregando sessão...</div>;
    }

    if (!isAuthorized) {
        return <div className="py-24 text-center text-text-secondary">Acesso restrito. Redirecionando...</div>;
    }

    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                Cadastrando imóvel avulso vinculado à sua construtora.
            </div>
            <PropertyForm 
              onSave={handleSave} 
              isEditing={false} 
              isSubmitting={isSubmitting}
              isAvulso={true}
            />
        </main>
    );
}

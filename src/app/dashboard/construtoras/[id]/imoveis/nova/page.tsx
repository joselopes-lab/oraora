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
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para criar um imóvel.' });
            return;
        }

        // Strict validation prior to persistence
        const authoritativeBuilderId = isAdmin ? id : authenticatedTenantId;
        if (!authoritativeBuilderId || (!isAdmin && authoritativeBuilderId !== id)) {
            toast({ variant: 'destructive', title: 'Erro de Autorização', description: 'Operação não autorizada para este tenant.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const propertiesCollectionRef = collection(firestore, 'properties');
            
            // Extract clean property data without project linkage fields (omitting them entirely as requested)
            const {
              projectId,
              empreendimentoId,
              projectRef,
              project,
              builderInfo,
              ...restData
            } = data as any;

            const cleanBuilderInfo = { ...(builderInfo || {}) };
            delete cleanBuilderInfo.projectId;

            const dataToSave = {
              ...restData,
              builderId: authoritativeBuilderId,
              tenantId: authoritativeBuilderId,
              builderInfo: cleanBuilderInfo,
              availableToNetwork: true
              // projectId, empreendimentoId, projectRef, project are completely omitted
            };

            await addDocumentNonBlocking(propertiesCollectionRef, dataToSave);
            
            toast({
                title: 'Imóvel Avulso Cadastrado!',
                description: `O imóvel "${data.informacoesbasicas?.nome || 'Novo'}" foi salvo com sucesso.`,
            });
            router.push(`/dashboard/construtoras/${authoritativeBuilderId}/imoveis?tab=avulsos`);

        } catch (error) {
            console.error("Erro ao cadastrar imóvel avulso: ", error);
             toast({
                variant: 'destructive',
                title: 'Uh oh! Algo deu errado.',
                description: 'Não foi possível salvar os dados do imóvel.',
            });
        } finally {
            setIsSubmitting(false);
        }
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

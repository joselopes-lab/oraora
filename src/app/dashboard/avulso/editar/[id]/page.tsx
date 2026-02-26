
'use client';
import { useRouter, useParams } from 'next/navigation';
import PropertyForm, { PropertyFormData } from '../../../imoveis/components/property-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Use a simplified type for the form data if needed, or reuse from property-form
type PropertyDoc = Partial<PropertyFormData>;


export default function EditAvulsoPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const brokerPropertyDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'brokerProperties', id as string) : null),
      [firestore, id]
    );

    const { data: propertyData, isLoading } = useDoc<PropertyDoc>(brokerPropertyDocRef);

    const handleSave = async (data: PropertyFormData) => {
        if (!brokerPropertyDocRef) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Referência do documento não encontrada. Não foi possível salvar.",
            });
            return;
        }
        setIsSubmitting(true);
        toast({
            title: 'Salvando imóvel...',
            description: 'Aguarde um momento.',
        });
        try {
            // Sanitize data to remove undefined values, which Firestore doesn't support.
            const sanitizedData = JSON.parse(JSON.stringify(data));
            
            await setDoc(brokerPropertyDocRef, sanitizedData, { merge: true });
            toast({
                title: 'Imóvel Avulso Atualizado!',
                description: `Os dados de "${data.informacoesbasicas.nome}" foram salvos com sucesso.`,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar imóvel avulso:", error);
            toast({
                variant: 'destructive',
                title: 'Uh oh! Algo deu errado.',
                description: `Não foi possível salvar as alterações. Erro: ${error.message}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
             <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
                <p>Carregando dados do imóvel...</p>
             </main>
        )
    }

    if (!propertyData) {
        return (
             <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
                <p>Imóvel não encontrado.</p>
             </main>
        )
    }

    // Data Normalization for 'quartos'
    const normalizedPropertyData = { ...propertyData };
    if (normalizedPropertyData.caracteristicasimovel) {
        let quartos = normalizedPropertyData.caracteristicasimovel.quartos;
        
        if (typeof quartos === 'string') {
            quartos = quartos.split(',').map(s => s.trim()).filter(Boolean);
        } else if (typeof quartos === 'number') {
            quartos = [String(quartos)];
        } else if (!Array.isArray(quartos)) {
            quartos = [];
        }
        
        normalizedPropertyData.caracteristicasimovel.quartos = quartos;
    }
    
    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <PropertyForm 
              onSave={handleSave} 
              isEditing={true} 
              propertyData={normalizedPropertyData}
              isSubmitting={isSubmitting}
            />
        </main>
    );
}

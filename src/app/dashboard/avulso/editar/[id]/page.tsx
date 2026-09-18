
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
        router.push('/dashboard/avulso');
    };

    if (isLoading) {
        return (
             <main className="flex-1 w-full py-2">
                <p>Carregando dados do imóvel...</p>
             </main>
        )
    }

    if (!propertyData) {
        return (
             <main className="flex-1 w-full py-2">
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
        <main className="flex-1 w-full py-2">
            <PropertyForm 
              onSave={handleSave} 
              isEditing={true} 
              propertyData={normalizedPropertyData}
              isSubmitting={isSubmitting}
            />
        </main>
    );
}

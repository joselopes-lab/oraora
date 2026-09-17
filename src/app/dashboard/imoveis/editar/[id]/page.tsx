
'use client';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PropertyForm, { PropertyFormData } from '../../components/property-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// This type must align with your Firestore document structure for properties.
// It uses Partial for nested objects to handle cases where they might not exist in the document.
type PropertyDoc = Partial<PropertyFormData>;


export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const propertyDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'properties', id as string) : null),
      [firestore, id]
    );

    const { data: propertyData, isLoading } = useDoc<PropertyDoc>(propertyDocRef);

    const handleSave = async (data: PropertyFormData) => {
        const page = searchParams.get('page');
        const redirectUrl = page ? `/dashboard/imoveis?page=${page}` : '/dashboard/imoveis';
        router.push(redirectUrl);
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
    
    // Data Normalization
    const normalizedPropertyData = { ...propertyData, id };
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

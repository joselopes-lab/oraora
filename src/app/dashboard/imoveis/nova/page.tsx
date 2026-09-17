
'use client';
import { useRouter } from 'next/navigation';
import PropertyForm, { PropertyFormData } from '../components/property-form';
import { useFirestore, addDocumentNonBlocking, useAuth, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


export default function NewPropertyPage() {
    const router = useRouter();

    const handleSave = async (data: PropertyFormData) => {
        router.push('/dashboard/imoveis');
    };

    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
            <PropertyForm 
              onSave={handleSave} 
              isEditing={false} 
            />
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import PropertyForm from '@/components/property-form';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function PropertyEditPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { panelUserType } = useAuth();

    const propertyId = params.id as string;
    const isEditing = propertyId !== 'new';
    
    const [initialData, setInitialData] = useState<Partial<Property> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProperty = async () => {
            if (isEditing) {
                const docRef = doc(db, 'properties', propertyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setInitialData({ id: docSnap.id, ...docSnap.data() } as Property);
                } else {
                    router.push('/dashboard/properties');
                }
            } else {
                const builderId = searchParams.get('builderId');
                const newProperty: Partial<Property> = {};
                if (builderId) {
                    newProperty.builderId = builderId;
                }
                setInitialData(newProperty);
            }
            setIsLoading(false);
        };

        fetchProperty();
    }, [propertyId, isEditing, router, searchParams]);

    const handleCancel = () => {
        if (panelUserType === 'builder') {
            router.push('/dashboard-construtora/imoveis');
        } else {
            router.push('/dashboard/properties');
        }
    }

    const handleSave = () => {
         if (panelUserType === 'builder') {
            router.push('/dashboard-construtora/imoveis');
        } else {
            router.push('/dashboard/properties');
        }
    }

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div>
            {initialData && (
                <PropertyForm 
                    initialData={initialData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}

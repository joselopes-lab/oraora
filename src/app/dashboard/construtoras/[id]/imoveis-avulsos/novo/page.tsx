'use client';

import { useRouter, useParams } from 'next/navigation';
import PropertyForm from '@/app/dashboard/imoveis/components/property-form';

export default function NovoImovelAvulsoPage() {
    const router = useRouter();
    const params = useParams();
    const constructorId = params.id as string;

    const handleSave = () => {
        router.push(`/dashboard/construtoras/${constructorId}/imoveis-avulsos`);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <PropertyForm
                isEditing={false}
                onSave={handleSave}
                isAvulso={true}
                collectionName="properties"
            />
        </div>
    );
}

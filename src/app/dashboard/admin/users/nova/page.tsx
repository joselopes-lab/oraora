
'use client';
import { useRouter } from 'next/navigation';
import UserForm from '../components/user-form';

export default function NewUserPage() {
    const router = useRouter();

    const handleSave = (data: any) => {
        console.log('Saving new user...', data);
        // Here you would typically call a function to save the data to Firestore
        // For now, we'll just log it and redirect
        alert('Novo usuário salvo com sucesso!');
        router.push('/dashboard/admin/users');
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
            <UserForm onSave={handleSave} isEditing={false} />
        </main>
    );
}


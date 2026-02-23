
'use client';
import { useRouter } from 'next/navigation';
import BrokerTicketForm, { BrokerTicketFormData } from '../components/BrokerTicketForm';
import { useAuthContext, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';

export default function NewBrokerTicketPage() {
    const router = useRouter();
    const { user } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: BrokerTicketFormData) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação' });
            return;
        }

        setIsSubmitting(true);
        const ticketData = {
            ...data,
            clientId: user.uid,
            clientName: user.displayName || 'Nome não definido',
            status: 'Novo' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: [],
        };
        
        try {
            await addDocumentNonBlocking(collection(firestore, 'tickets'), ticketData);
            toast({
                title: 'Ticket Aberto!',
                description: 'Sua solicitação foi enviada para nossa equipe de suporte.',
            });
            router.push('/dashboard/suporte');
        } catch (error) {
            console.error("Erro ao abrir ticket:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível abrir o ticket.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                <Link className="hover:text-primary transition-colors" href="/dashboard/suporte">Suporte</Link>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-text-main">Novo Ticket</span>
            </nav>
            <BrokerTicketForm
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/suporte')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

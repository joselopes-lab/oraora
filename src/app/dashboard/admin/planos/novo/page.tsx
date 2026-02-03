
'use client';
import { useRouter } from 'next/navigation';
import PlanForm, { PlanFormData } from '../components/plan-form';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection } from 'firebase/firestore';

export default function NewPlanPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (data: PlanFormData) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível conectar ao banco de dados.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'plans'), data);
      toast({
        title: 'Plano Criado!',
        description: `O plano "${data.name}" foi adicionado com sucesso.`,
      });
      router.push('/dashboard/admin/planos');
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível criar o plano. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PlanForm
      onSave={handleSave}
      isEditing={false}
      isSubmitting={isSubmitting}
    />
  );
}

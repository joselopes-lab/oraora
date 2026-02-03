
'use client';
import { useRouter, useParams } from 'next/navigation';
import PlanForm, { PlanFormData } from '../../components/plan-form';
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'plans', id) : null),
    [firestore, id]
  );
  
  const { data: planData, isLoading } = useDoc<PlanFormData>(planDocRef);

  const handleSave = async (data: PlanFormData) => {
    if (!planDocRef) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Referência do plano não encontrada.",
        });
        return;
    }
    setIsSubmitting(true);
    try {
      await setDocumentNonBlocking(planDocRef, data, { merge: true });
      toast({
        title: 'Plano Atualizado!',
        description: `O plano "${data.name}" foi salvo com sucesso.`,
      });
      router.push('/dashboard/admin/planos');
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível atualizar o plano.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <p>Carregando plano...</p>;
  }

  if (!planData) {
    return <p>Plano não encontrado.</p>;
  }

  return (
    <PlanForm
      onSave={handleSave}
      isEditing={true}
      isSubmitting={isSubmitting}
      planData={planData}
    />
  );
}

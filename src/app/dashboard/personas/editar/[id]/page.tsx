
'use client';

import { useParams, useRouter } from 'next/navigation';
import PersonaForm, { PersonaFormData } from '../../components/persona-form';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function EditPersonaPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personaDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'personas', id) : null),
    [firestore, id]
  );
  
  const { data: personaData, isLoading } = useDoc<PersonaFormData>(personaDocRef);

  const handleSave = async (data: PersonaFormData) => {
    if (!personaDocRef) return;

    setIsSubmitting(true);
    try {
        await setDocumentNonBlocking(personaDocRef, data, { merge: true });
        toast({
            title: 'Persona Atualizada!',
            description: 'As alterações foram salvas com sucesso.',
        });
        router.push('/dashboard/personas');
    } catch (error) {
        console.error("Erro ao atualizar persona:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar as alterações.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-10">Carregando dados da persona...</div>;
  }

  if (!personaData) {
    return <div className="p-10">Persona não encontrada.</div>;
  }
  
  return <PersonaForm onSave={handleSave} isEditing={true} personaData={personaData} isSubmitting={isSubmitting} />;
}


'use client';
import PersonaForm, { PersonaFormData } from '../components/persona-form';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function NewPersonaPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (data: PersonaFormData) => {
    if (!firestore || !user) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para criar uma persona.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const personasCollection = collection(firestore, 'personas');
      
      const newPersonaData = {
        ...data,
        brokerId: user.uid, // Admin's ID will be here.
        status: 'Ativo',
        icon: data.propertyTypes?.includes('Apartamento') ? 'apartment' : 'home',
        iconBackgroundColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.name}/400/300`,
        ticket: data.maxPrice ? `Até R$ ${Number(data.maxPrice).toLocaleString('pt-BR')}` : 'N/A',
      };
      
      await addDocumentNonBlocking(personasCollection, newPersonaData);

      toast({
        title: 'Persona Criada!',
        description: `O perfil "${data.name}" foi salvo com sucesso.`,
      });
      
      router.push('/dashboard/personas');

    } catch (error) {
      console.error("Erro ao criar persona:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível criar a persona. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return <PersonaForm onSave={handleSave} isEditing={false} isSubmitting={isSubmitting} />;
}

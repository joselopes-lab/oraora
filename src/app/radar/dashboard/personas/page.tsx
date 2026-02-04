
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useAuthContext } from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import PersonaDetailSheet from './PersonaDetailSheet';

type Persona = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon: string;
  iconBackgroundColor: string;
};

function PersonaCard({ persona, isSelected, onSelect, onViewDetails }: { persona: Persona, isSelected: boolean, onSelect: (id: string) => void, onViewDetails: () => void }) {
  return (
    <div className={`group relative bg-white rounded-3xl border ${isSelected ? 'border-2 border-primary shadow-glow' : 'border-gray-100 shadow-soft'} overflow-hidden flex flex-col transition-all hover:shadow-xl`}>
      {isSelected && (
        <div className="absolute top-4 right-4 z-10 bg-primary text-neutral-dark px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
          <span className="material-symbols-outlined text-sm font-bold">check</span>
          Seu Perfil Atual
        </div>
      )}
      <div className="h-56 overflow-hidden cursor-pointer" onClick={onViewDetails}>
        <Image
          alt={persona.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={persona.imageUrl || `https://picsum.photos/seed/${persona.id}/400/300`}
          width={400}
          height={300}
        />
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-3 cursor-pointer hover:underline" onClick={onViewDetails}>{persona.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3">{persona.description}</p>
        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-4">
            <Button onClick={onViewDetails} variant="outline" className="w-full">Saiba Mais</Button>
            <Button
              onClick={() => onSelect(persona.id)}
              disabled={isSelected}
              className="w-full"
            >
              {isSelected ? 'Selecionado' : 'Selecionar'}
            </Button>
        </div>
      </div>
    </div>
  );
}

export default function MinhaPersonaPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedPersonaForSheet, setSelectedPersonaForSheet] = useState<Persona | null>(null);

  const personasQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'personas'), where('status', '==', 'Ativo')) : null),
    [firestore]
  );
  const { data: personas, isLoading: arePersonasLoading } = useCollection<Persona>(personasQuery);

  const handleSelectPersona = async (personaId: string) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para selecionar uma persona.",
      });
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await setDocumentNonBlocking(userDocRef, { personaIds: [personaId] }, { merge: true });
      toast({
        title: "Perfil Atualizado!",
        description: "Sua experiência agora está personalizada para este perfil.",
      });
      if(selectedPersonaForSheet) {
          setSelectedPersonaForSheet(null);
      }
    } catch (error) {
      console.error("Error updating user persona:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível salvar sua seleção. Tente novamente.",
      });
    }
  };
  
  const isLoading = !isReady || arePersonasLoading;
  const selectedPersonaId = userProfile?.personaIds?.[0];

  return (
    <>
      <div className="mb-12">
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          <Link className="hover:text-primary transition-colors" href="/radar/dashboard">Radar</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-neutral-dark">Minha Persona</span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-dark mb-2">Escolha sua Persona</h1>
        <p className="text-gray-500 max-w-2xl">Selecione o perfil que melhor descreve seus objetivos para personalizarmos sua experiência com as melhores oportunidades do mercado.</p>
      </div>
      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                    <Skeleton className="h-56 w-full" />
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-4 mt-4">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </div>
            ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personas?.map(persona => (
            <PersonaCard 
              key={persona.id}
              persona={persona}
              isSelected={selectedPersonaId === persona.id}
              onSelect={handleSelectPersona}
              onViewDetails={() => setSelectedPersonaForSheet(persona)}
            />
          ))}
        </div>
      )}
       <Sheet open={!!selectedPersonaForSheet} onOpenChange={(open) => !open && setSelectedPersonaForSheet(null)}>
        <SheetContent className="w-[90vw] sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <SheetTitle>{selectedPersonaForSheet?.name}</SheetTitle>
            <SheetDescription>
              Detalhes e imóveis compatíveis com este perfil.
            </SheetDescription>
             <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <span className="material-symbols-outlined">close</span>
                <span className="sr-only">Fechar</span>
            </SheetClose>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedPersonaForSheet && <PersonaDetailSheet persona={selectedPersonaForSheet} />}
          </div>
           {selectedPersonaForSheet && (
              <div className="p-6 border-t bg-white">
                  <Button
                      className="w-full"
                      onClick={() => handleSelectPersona(selectedPersonaForSheet.id)}
                      disabled={selectedPersonaId === selectedPersonaForSheet.id}
                  >
                      {selectedPersonaId === selectedPersonaForSheet.id ? 'Perfil Selecionado' : 'Selecionar este Perfil'}
                  </Button>
              </div>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}

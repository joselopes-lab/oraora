'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { updateProjectPersonasServer } from '../actions.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle, AlertCircle, Users, Check, Sparkles, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectPersonaTabProps {
  project: {
    id: string;
    personaIds?: string[];
  };
}

interface PersonaItem {
  id: string;
  name?: string;
  titulo?: string;
  description?: string;
  descricao?: string;
  faixaRenda?: string;
  perfil?: string;
  [key: string]: any;
}

export default function ProjectPersonaTab({ project }: ProjectPersonaTabProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [allPersonas, setAllPersonas] = useState<PersonaItem[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);

  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(project.personaIds || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar personas existentes da collection "personas" do OraOra
  useEffect(() => {
    async function fetchPersonas() {
      if (!firestore) return;
      try {
        const querySnapshot = await getDocs(collection(firestore, 'personas'));
        const list: PersonaItem[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAllPersonas(list);
      } catch (e) {
        console.error('Erro ao buscar personas:', e);
      } finally {
        setLoadingPersonas(false);
      }
    }
    fetchPersonas();
  }, [firestore]);

  const handleTogglePersona = (id: string) => {
    let updated: string[];
    if (selectedPersonaIds.includes(id)) {
      updated = selectedPersonaIds.filter(pId => pId !== id);
    } else {
      updated = [...selectedPersonaIds, id];
    }
    setSelectedPersonaIds(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await updateProjectPersonasServer(project.id, {
        personaIds: selectedPersonaIds,
        idToken,
      });

      setIsDirty(false);
      toast({ title: 'Salvo com sucesso!', description: 'Personas vinculadas atualizadas com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-xs sticky top-4 z-10">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4" /> Alterações não salvas
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Todas as alterações salvas
            </div>
          )}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Intro Card */}
      <Card className="bg-indigo-50/50 border-indigo-100">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">Vínculo com o Sistema de Personas OraOra</h3>
            <p className="text-sm text-slate-600">
              Selecione abaixo quais perfis de compradores (personas cadastradas no sistema) são o público-alvo ideal para este empreendimento. Isso permitirá que o motor de sugestões identifique o match perfeito com os clientes atendidos pelos corretores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personas List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Personas Disponíveis no Sistema</CardTitle>
          <CardDescription>Clique nos cards para selecionar ou desselecionar as personas do empreendimento.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPersonas ? (
            <div className="py-8 text-center text-sm text-slate-500">Carregando personas do sistema...</div>
          ) : allPersonas.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Nenhuma persona cadastrada na collection <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">personas</span> do OraOra.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPersonas.map((persona) => {
                const isSelected = selectedPersonaIds.includes(persona.id);
                const personaName = persona.name || persona.titulo || 'Persona sem nome';
                const personaDesc = persona.description || persona.descricao || persona.perfil || 'Sem descrição detalhada.';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleTogglePersona(persona.id)}
                    className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <h4 className="font-bold text-base">{personaName}</h4>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-300 bg-slate-50 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {personaDesc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs">
                      <span className={`font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>ID: {persona.id}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        isSelected ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isSelected ? 'Vinculada' : 'Disponível'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

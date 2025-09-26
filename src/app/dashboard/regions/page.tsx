
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Map } from 'lucide-react';
import { getStates, type State } from '@/services/location';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';

interface RegionSettings {
  enabledStates: string[];
}

export default function RegionsPage() {
  const { toast } = useToast();
  const [allStates, setAllStates] = useState<State[]>([]);
  const [enabledStates, setEnabledStates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const statesData = await getStates();
        setAllStates(statesData);

        const settingsRef = doc(db, 'settings', 'regions');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const settings = docSnap.data() as RegionSettings;
          setEnabledStates(new Set(settings.enabledStates || []));
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar dados' });
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [toast]);

  const handleToggleState = (stateAcronym: string) => {
    setEnabledStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stateAcronym)) {
        newSet.delete(stateAcronym);
      } else {
        newSet.add(stateAcronym);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'regions');
      await setDoc(settingsRef, { enabledStates: Array.from(enabledStates) });
      toast({ title: 'Sucesso!', description: 'Regiões salvas com sucesso!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map />
          Gerenciar Regiões
        </CardTitle>
        <CardDescription>
          Habilite ou desabilite os estados que aparecerão na busca do site público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allStates.map(state => (
                <div key={state.id} className="flex items-center justify-between rounded-lg border p-4">
                  <Label htmlFor={`state-${state.sigla}`} className="font-medium">
                    {state.nome} ({state.sigla})
                  </Label>
                  <Switch
                    id={`state-${state.sigla}`}
                    checked={enabledStates.has(state.sigla)}
                    onCheckedChange={() => handleToggleState(state.sigla)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
             <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

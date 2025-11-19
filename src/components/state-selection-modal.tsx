"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { type State } from '@/services/location';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface StateSelectionModalProps {
  isOpen: boolean;
  states: State[];
  onStateSelect: (state: State) => void;
  isLoading: boolean;
}

export default function StateSelectionModal({ isOpen, states, onStateSelect, isLoading }: StateSelectionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  
  const handleSelect = () => {
    if(selected) {
        const state = states.find(s => s.sigla === selected);
        if (state) {
            onStateSelect(state);
        }
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Oraora!</DialogTitle>
          <DialogDescription>
            Para começar, escolha o estado onde você deseja pesquisar imóveis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={setSelected} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Carregando...' : 'Escolha o estado'} />
            </SelectTrigger>
            <SelectContent>
              {states.map(s => (
                <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSelect} disabled={!selected || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

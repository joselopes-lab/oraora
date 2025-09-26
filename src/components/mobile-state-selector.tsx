
'use client';

import { useContext, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { LocationContext } from '@/context/location-context';

export default function MobileStateSelector() {
    const { states, selectState, isLoading, selectedState } = useContext(LocationContext);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempSelectedState, setTempSelectedState] = useState<string | null>(selectedState?.sigla || null);

    const handleConfirm = () => {
        if (tempSelectedState) {
            const state = states.find(s => s.sigla === tempSelectedState);
            if (state) {
                selectState(state);
            }
            setIsDialogOpen(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="p-2 h-auto">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <MapPin className="h-5 w-5" />}
                    {selectedState && <span className="ml-2 font-semibold text-sm">{selectedState.sigla}</span>}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Selecione seu estado</DialogTitle>
                    <DialogDescription>
                        Isso nos ajudará a encontrar os melhores imóveis para você.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select onValueChange={setTempSelectedState} value={tempSelectedState || ''} disabled={isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione um estado'} />
                        </SelectTrigger>
                        <SelectContent>
                            {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleConfirm} disabled={!tempSelectedState || isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


'use client';

import { useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Property } from '@/app/dashboard/properties/page';
import { type State, handleBrokerWhatsAppRedirect } from '@/app/corretor-publico/[brokerId]/actions';

const initialState: State = {
  success: null,
  error: null,
  whatsappUrl: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Falar com corretor
        </Button>
    );
}

interface BrokerWhatsAppDialogProps {
    property: Property;
    brokerId: string;
    brokerWhatsApp: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function BrokerWhatsAppDialog({ property, brokerId, brokerWhatsApp, isOpen, onOpenChange }: BrokerWhatsAppDialogProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleBrokerWhatsAppRedirect, initialState);

    useEffect(() => {
        if (state.success === false && state.error) {
           toast({ variant: 'destructive', title: "Erro", description: state.error });
        } else if (state.success === true && state.whatsappUrl) {
            window.open(state.whatsappUrl, '_blank');
            toast({ title: "Sucesso!", description: "Você está sendo redirecionado para o WhatsApp." });
            formRef.current?.reset();
            onOpenChange(false);
        }
    }, [state, toast, onOpenChange]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fale com o corretor</DialogTitle>
                    <DialogDescription>
                        Preencha seus dados para ser direcionado ao WhatsApp do corretor.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="propertyName" value={property.informacoesbasicas.nome} />
                    <input type="hidden" name="propertySlug" value={property.slug} />
                    <input type="hidden" name="brokerId" value={brokerId} />
                    <input type="hidden" name="brokerWhatsApp" value={brokerWhatsApp} />
                    
                    <div className="space-y-2">
                        <Label htmlFor="broker-whats-name">Nome</Label>
                        <Input id="broker-whats-name" name="name" placeholder="Digite seu nome" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="broker-whats-email">Email</Label>
                        <Input id="broker-whats-email" name="email" type="email" placeholder="Digite seu email" required />
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

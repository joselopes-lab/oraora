'use client';

import React, { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { type Property } from '@/app/dashboard/properties/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PropertyCard from '@/components/property-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { handleBrokerContact, type State } from './actions';

interface Broker {
  id: string;
  name: string;
  email: string;
}

interface BrokerPublicPageClientProps {
    broker: Broker;
    properties: Property[];
}

const initialState: State = {
    success: null,
    error: null,
    message: null,
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Mensagem'}
        </Button>
    )
}

export default function BrokerPublicPageClient({ broker, properties }: BrokerPublicPageClientProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(handleBrokerContact, initialState);
  
  useEffect(() => {
    if (state.success === true && state.message) {
        toast({ title: "Sucesso!", description: state.message });
        formRef.current?.reset();
    } else if (state.success === false && state.error) {
        toast({ variant: 'destructive', title: "Erro", description: state.error });
    }
  }, [state, toast]);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
            <Card className="shadow-lg">
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${broker.id}`} alt={broker.name} />
                        <AvatarFallback>{getInitials(broker.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">{broker.name}</CardTitle>
                    <CardDescription>Corretor de Imóveis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-center">Fale comigo</h3>
                         <form ref={formRef} action={formAction} className="space-y-4">
                            <input type="hidden" name="brokerId" value={broker.id} />
                            
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="contact-name" name="name" placeholder="Seu nome" required className="pl-10"/>
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="contact-email" name="email" type="email" placeholder="Seu email" required className="pl-10" />
                            </div>
                             <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="contact-phone" name="phone" placeholder="Seu telefone" required className="pl-10" />
                            </div>
                            <Textarea id="contact-message" name="message" placeholder="Olá, gostaria de mais informações sobre um imóvel..." />
                            <SubmitButton />
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Imóveis Disponíveis</h1>
                <p className="text-lg text-muted-foreground">
                    Confira a seleção de imóveis do corretor {broker.name.split(' ')[0]}.
                </p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {properties.length > 0 ? (
                    properties.map(prop => (
                        <PropertyCard key={prop.id} property={prop} />
                    ))
                ) : (
                    <p className="md:col-span-2 text-center text-muted-foreground py-16">
                        Este corretor ainda não possui imóveis em sua carteira pública.
                    </p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}

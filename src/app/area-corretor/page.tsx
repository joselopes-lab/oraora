'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import PublicLayout from '@/components/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { type State, handleBrokerLead } from './actions';

const initialState: State = {
    success: null,
    error: null,
    message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Garantir meu convite'}
        </Button>
    );
}

export default function AreaCorretorPage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleBrokerLead, initialState);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    return (
        <PublicLayout>
            <main className="container mx-auto px-4 py-12 md:py-20 flex-grow">
                <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                    {/* Coluna da Esquerda: Conteúdo */}
                    <div className="space-y-8">
                        <div className="text-left">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Convite restrito: só para corretores selecionados
                            </h1>
                            <p className="mt-4 text-xl md:text-2xl text-muted-foreground">
                                “O Detetive Oraora está preparando algo inédito para o mercado imobiliário… mas não será para todos.”
                            </p>
                        </div>
                        <div className="text-lg text-foreground/80 space-y-4 text-left">
                            <p>
                                Estamos trabalhando nos bastidores para lançar uma novidade que pode mudar a forma como você trabalha e atrai clientes.
                                Por enquanto, os detalhes são confidenciais — e só serão revelados para quem estiver na nossa lista de investigados VIP.
                            </p>
                            <p>
                                Este acesso não será aberto ao público. Ele será liberado apenas para corretores indicados ou que se cadastrem agora nesta página.
                            </p>
                            <p className="font-semibold text-foreground pt-4">
                                Se quiser ser um dos primeiros a receber essa revelação, deixe seus contatos abaixo.
                            </p>
                        </div>
                    </div>

                    {/* Coluna da Direita: Formulário */}
                    <div>
                        <Card className="shadow-lg sticky top-24">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Quero entrar na lista restrita</CardTitle>
                                <CardDescription>
                                Entre para a lista e prepare-se para ser surpreendido.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {state.success ? (
                                    <div className="text-center p-8 bg-green-50 border-2 border-green-200 rounded-lg">
                                        <p className="text-lg font-semibold text-green-800">{state.message}</p>
                                    </div>
                                ) : (
                                    <form ref={formRef} action={formAction} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome completo</Label>
                                            <Input id="name" name="name" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-mail</Label>
                                            <Input id="email" name="email" type="email" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp">WhatsApp</Label>
                                            <Input id="whatsapp" name="whatsapp" required />
                                        </div>
                                        <SubmitButton />
                                        {state.error && <p className="text-sm text-center text-destructive">{state.error}</p>}
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
}


'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import PublicLayout from '@/components/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { type State, handleBuilderLead } from './actions';

const initialState: State = {
    success: null,
    error: null,
    message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar pistas'}
        </Button>
    );
}

export default function ParaConstrutorasPage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleBuilderLead, initialState);

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
                                Construtoras, vocês estão sob investigação
                            </h1>
                            <p className="mt-4 text-xl md:text-2xl text-muted-foreground">
                                “O Detetive Oraora está mapeando todos os imóveis das regiões mais desejadas. E a sua construtora… já foi descoberta?”
                            </p>
                        </div>
                        <div className="text-lg text-foreground/80 space-y-4 text-left">
                            <p>
                                No Oraora, buscamos pistas dos melhores empreendimentos para apresentá-los ao público certo — compradores que já estão prontos para fechar negócio.
                            </p>
                            <p>
                                Se o seu lançamento já apareceu no radar do nosso detetive, ele pode estar entre os casos mais investigados da semana.
                            </p>
                            <p>
                                Se ainda não foi descoberto, você pode ajudar: envie o endereço e dados básicos pelo formulário abaixo para que nossa equipe acione o sistema e ele comece a investigar seu empreendimento.
                            </p>
                             <p className="font-semibold text-foreground pt-4">
                                Não deixe sua obra fora do mapa da investigação. Quanto antes estiver no radar, mais rápido poderá aparecer nas pastas de casos dos compradores certos.
                            </p>
                        </div>
                    </div>

                    {/* Coluna da Direita: Formulário */}
                    <div>
                        <Card className="shadow-lg sticky top-24">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Enviar pistas sobre o meu empreendimento</CardTitle>
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
                                            <Label htmlFor="builderName">Nome da construtora</Label>
                                            <Input id="builderName" name="builderName" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Site</Label>
                                            <Input id="website" name="website" type="text" placeholder="www.suaempresa.com.br" required />
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

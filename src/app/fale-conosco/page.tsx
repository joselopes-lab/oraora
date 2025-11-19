
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import PublicLayout from '@/components/public-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { type State, handleContactSubmission } from './actions';

const initialState: State = {
    success: null,
    error: null,
    message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'ENVIAR MENSAGEM'}
        </Button>
    );
}

export default function FaleConoscoPage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleContactSubmission, initialState);

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
                            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                                Vamos conversar!
                            </h1>
                            <p className="mt-4 text-2xl md:text-3xl text-muted-foreground">
                                Sua mensagem será muito bem-vinda :)
                            </p>
                        </div>
                        <div className="text-lg text-foreground/80 space-y-2 text-left pt-8">
                            <h2 className="font-semibold text-xl text-foreground">Central de Atendimento</h2>
                            <p>De segunda à sexta das 8h30 às 17h30</p>
                            <p className="pt-4">Fale conosco pelo formulário ao lado.</p>
                        </div>
                    </div>

                    {/* Coluna da Direita: Formulário */}
                    <div className="bg-card p-8 rounded-lg border">
                        {state.success ? (
                            <div className="text-center p-8 bg-green-50 border-2 border-green-200 rounded-lg min-h-[400px] flex items-center justify-center">
                                <p className="text-lg font-semibold text-green-800">{state.message}</p>
                            </div>
                        ) : (
                             <form ref={formRef} action={formAction} className="space-y-6">
                                <div className="space-y-2">
                                    <Select name="subject" defaultValue="Dúvidas" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o assunto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Dúvidas">Dúvidas</SelectItem>
                                            <SelectItem value="Sugestões">Sugestões</SelectItem>
                                            <SelectItem value="Problemas Técnicos">Problemas Técnicos</SelectItem>
                                            <SelectItem value="Upgrade de Plano">Upgrade de Plano</SelectItem>
                                            <SelectItem value="Outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone/WhatsApp</Label>
                                    <Input id="phone" name="phone" type="tel" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Digite aqui sua mensagem</Label>
                                    <Textarea id="message" name="message" rows={5} required />
                                </div>
                                <SubmitButton />
                                {state.error && <p className="text-sm text-center text-destructive">{state.error}</p>}
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
}

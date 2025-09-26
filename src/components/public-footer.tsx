
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Youtube, Twitter, Instagram, Facebook, Send, LifeBuoy, Loader2 } from 'lucide-react';
import { Icons } from './icons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { type State, handleSupportRequest } from '@/app/actions/support';
import { useToast } from '@/hooks/use-toast';
import { getAppearanceSettings, type AppearanceSettings } from '@/app/dashboard/appearance/actions';
import Image from 'next/image';


const initialSupportState: State = {
  success: null,
  error: null,
  message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="animate-spin" /> : 'Enviar Ticket'}
        </Button>
    )
}


export default function PublicFooter() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleSupportRequest, initialSupportState);
    const [settings, setSettings] = useState<AppearanceSettings | null>(null);

    useEffect(() => {
        if (state.success === false && state.error) {
            toast({ variant: 'destructive', title: "Erro", description: state.error });
        } else if (state.success === true && state.message) {
            toast({ title: "Sucesso!", description: state.message });
            formRef.current?.reset();
        }
    }, [state, toast]);
    
    useEffect(() => {
        async function fetchSettings() {
            const appearanceSettings = await getAppearanceSettings();
            setSettings(appearanceSettings);
        }
        fetchSettings();
    }, []);


    return (
        <footer className="bg-secondary/50 text-foreground">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
                    
                    <div className="md:col-span-12 lg:col-span-5 space-y-4">
                        <div className="flex items-center space-x-1.5 mb-4">
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Oraora Logo" width={180} height={60} className="h-12 w-auto object-contain" />
                            ) : (
                                <>
                                    <Icons.logo className="h-10 w-10 text-primary" />
                                    <span className="font-headline font-bold text-[40px] tracking-tighter">oraora</span>
                                </>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {settings?.footerAboutText || 'Carregando...'}
                            <br/><br/>
                            <strong>Segredos do mercado imobiliário, revelados para você.</strong>
                        </p>
                    </div>

                    <div className="md:col-span-6 lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold tracking-tight">Nossas redes</h3>
                            <div className="flex space-x-3">
                                {settings?.socialYoutube && <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground text-background rounded-full hover:bg-primary transition-colors"><Youtube className="h-5 w-5" /></a>}
                                {settings?.socialTwitter && <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground text-background rounded-full hover:bg-primary transition-colors"><Twitter className="h-5 w-5" /></a>}
                                {settings?.socialInstagram && <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground text-background rounded-full hover:bg-primary transition-colors"><Instagram className="h-5 w-5" /></a>}
                                {settings?.socialFacebook && <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground text-background rounded-full hover:bg-primary transition-colors"><Facebook className="h-5 w-5" /></a>}
                            </div>
                        </div>
                         <div className="space-y-4">
                            <h3 className="text-xl font-semibold tracking-tight">Suporte</h3>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <LifeBuoy />
                                        Abrir um chamado
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Contato do Suporte</DialogTitle>
                                        <DialogDescription>
                                            Precisa de ajuda? Preencha o formulário abaixo e nossa equipe entrará em contato.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form ref={formRef} action={formAction} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="support-name">Nome</Label>
                                            <Input id="support-name" name="name" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="support-email">Email</Label>
                                            <Input id="support-email" name="email" type="email" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="support-subject">Assunto</Label>
                                            <Input id="support-subject" name="subject" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="support-message">Mensagem</Label>
                                            <Textarea id="support-message" name="message" required />
                                        </div>
                                        <DialogFooter>
                                            <SubmitButton />
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                         </div>
                    </div>

                    <div className="md:col-span-6 lg:col-span-4 space-y-4">
                         <h3 className="text-xl font-semibold tracking-tight">{settings?.newsletterTitle}</h3>
                         <p className="text-muted-foreground text-sm">
                            {settings?.newsletterSubtitle}
                         </p>
                         <form action="#" className="space-y-3">
                             <div>
                                <Label htmlFor="footer-name" className="sr-only">Digite seu nome</Label>
                                <Input id="footer-name" name="name" placeholder="Digite seu nome" className="bg-white" />
                             </div>
                             <div>
                                <Label htmlFor="footer-email" className="sr-only">Digite seu e-mail</Label>
                                <Input id="footer-email" name="email" type="email" placeholder="Digite seu e-mail" className="bg-white"/>
                             </div>
                             <Button type="submit" className="w-full">
                                 Cadastrar <Send className="ml-2 h-4 w-4"/>
                             </Button>
                         </form>
                    </div>

                </div>
            </div>
            <div className="bg-black text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="font-semibold mb-2">Institucional</h4>
                            <ul className="space-y-1 text-sm">
                                <li><Link href="/sobre" className="hover:underline">Sobre o Oraora</Link></li>
                                <li><Link href="/fale-conosco" className="hover:underline">Fale com a gente</Link></li>
                                <li><Link href="/termos-de-uso" className="hover:underline">Termos de Uso</Link></li>
                                <li><Link href="/politica-de-privacidade" className="hover:underline">Políticas de privacidade</Link></li>
                            </ul>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                                <Link href="/login">Acesso Restrito</Link>
                            </Button>
                            <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                                <Link href="/area-corretor">Para Corretores</Link>
                            </Button>
                            <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                                <Link href="/para-construtoras">Para Construtoras</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="pt-6 text-center">
                        <p className="text-sm">&copy; {new Date().getFullYear()} Oraora. Todos os direitos reservados.</p>
                        <p className="text-xs mt-2">Desenvolvido por <a href="https://dotestudio.com.br" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">Dot Estúdio</a></p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

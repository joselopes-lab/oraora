
'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "O serviço de autenticação não está disponível.",
        });
        return;
    }

    setIsSubmitting(true);

    // Configuração para redirecionar o usuário para a nossa página personalizada de reset
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    };

    try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        toast({
            title: "Link Enviado!",
            description: "Verifique sua caixa de entrada para o link de redefinição de senha.",
        });
    } catch (error: any) {
        console.error("Erro ao enviar e-mail de recuperação:", error);
        toast({
            variant: "destructive",
            title: "Erro ao enviar e-mail",
            description: "Não foi possível enviar o e-mail. Verifique se o endereço está correto.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-background dark:bg-background min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] opacity-20"></div>
      </div>
      
      {/* Main Card Container */}
      <div className="w-full max-w-[480px] z-10 overflow-hidden shadow-soft bg-card border-border border rounded-2xl">
        <div className="h-1.5 w-full bg-muted flex">
            <div className="h-full w-1/3 bg-primary shadow-[0_0_15px_rgba(43,242,13,0.5)]"></div>
        </div>
        <div className="p-8 sm:p-10 flex flex-col gap-8">
            <div className="flex justify-center mb-2">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" style={{ width: 'auto' }} />
                </Link>
            </div>
            <div className="flex flex-col gap-3 text-center">
                <h1 className="text-foreground tracking-tight text-[28px] sm:text-[32px] font-bold leading-tight font-headline uppercase">
                    Recuperar acesso
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base font-normal leading-relaxed max-w-sm mx-auto">
                    Insira o e-mail associado à sua conta e enviaremos um link para você criar uma nova senha.
                </p>
            </div>
        </div>
        <div className="p-8 sm:p-10 pt-0">
            <form className="flex flex-col gap-6" onSubmit={handlePasswordReset}>
                <div className="flex flex-col flex-1 gap-2">
                    <Label htmlFor="email" className="text-foreground text-sm font-semibold leading-normal flex items-center gap-2">
                        <span className="material-symbols-outlined text-muted-foreground text-[18px]">mail</span>
                        E-mail Cadastrado
                    </Label>
                    <Input 
                        id="email"
                        type="email" 
                        placeholder="exemplo@imobiliaria.com.br"
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 p-[15px] text-base rounded-xl bg-card"
                    />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    <Button type="submit" disabled={isSubmitting} className="h-14 bg-primary text-slate-900 text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 border-none cursor-pointer">
                        <span className="truncate">{isSubmitting ? 'Enviando...' : 'Enviar Link'}</span>
                        {!isSubmitting && <span className="material-symbols-outlined ml-2 text-[20px]">send</span>}
                    </Button>
                    <Button variant="ghost" asChild className="h-10 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground group/back bg-transparent border-none cursor-pointer">
                        <Link href="/login">
                            <span className="material-symbols-outlined text-[18px] group-hover/back:-translate-x-1 transition-transform">arrow_back</span>
                            <span className="truncate">Voltar para o Login</span>
                        </Link>
                    </Button>
                </div>
            </form>
        </div>
        <div className="py-4 bg-muted/50 border-t flex justify-center items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
             <span className="material-symbols-outlined text-[14px]">lock</span>
            Criptografia de Ponta a Ponta
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">© 2025 Oraora Tecnologia. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

function NewPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);

  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkCode = async () => {
      if (!auth || !oobCode) {
        setIsValidCode(false);
        setError("Código de redefinição inválido ou ausente.");
        return;
      }
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (error) {
        console.error("Código inválido:", error);
        setIsValidCode(false);
        setError("O link de redefinição de senha é inválido ou já expirou.");
      }
    };
    checkCode();
  }, [auth, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!auth || !oobCode) {
      setError("Erro de configuração. Tente novamente.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setError("Não foi possível redefinir a senha. O link pode ter expirado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidCode === null) {
    return <div className="text-center">Verificando link...</div>;
  }

  if (!isValidCode) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Link href="/esqueceu-a-senha" className="text-primary underline mt-4 inline-block">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleResetPassword}>
      <div className="space-y-1.5">
        <Label className="block text-sm font-semibold text-foreground pl-1" htmlFor="new-password">Nova Senha</Label>
        <div className="group relative flex items-center">
          <span className="absolute left-4 text-muted-foreground flex items-center pointer-events-none material-symbols-outlined text-[20px]">lock</span>
          <Input 
            className="w-full h-14 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-input border border-gray-200 dark:border-border text-foreground placeholder-gray-400 focus:bg-card focus:border-accent focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium" 
            id="new-password" 
            placeholder="••••••••" 
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="ghost" size="icon" className="absolute right-2 text-gray-400 hover:text-foreground transition-colors flex items-center h-auto w-auto p-2" type="button" onClick={() => setShowPassword(!showPassword)}>
            <span className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="block text-sm font-semibold text-foreground pl-1" htmlFor="confirm-password">Confirmar Nova Senha</Label>
        <div className="group relative flex items-center">
          <span className="absolute left-4 text-muted-foreground flex items-center pointer-events-none material-symbols-outlined text-[20px]">verified_user</span>
          <Input 
            className="w-full h-14 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-input border border-gray-200 dark:border-border text-foreground placeholder-gray-400 focus:bg-card focus:border-accent focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium" 
            id="confirm-password" 
            placeholder="••••••••" 
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
            <Button variant="ghost" size="icon" className="absolute right-2 text-gray-400 hover:text-foreground transition-colors flex items-center h-auto w-auto p-2" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <span className="material-symbols-outlined text-[22px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button disabled={isSubmitting} className="w-full h-14 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold rounded-xl shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2">
        <span>{isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}</span>
        {!isSubmitting && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
      </Button>
    </form>
  );
}

export default function NewPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

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
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Link Enviado!",
            description: "Verifique sua caixa de entrada para o link de redefinição de senha.",
        });
    } catch (error: any) {
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
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px]"></div>
      </div>
      
      {/* Main Card Container */}
      <div className="w-full max-w-[480px] z-10 overflow-hidden shadow-soft bg-card border-border border rounded-2xl">
        <div className="h-1.5 w-full bg-muted flex">
            <div className="h-full w-1/3 bg-primary"></div>
        </div>
        <div className="p-8 sm:p-10 flex flex-col gap-8">
            <div className="flex justify-center mb-2">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" />
                </Link>
            </div>
            <div className="flex flex-col gap-3 text-center">
                <h1 className="text-foreground tracking-tight text-[28px] sm:text-[32px] font-bold leading-tight font-headline">
                    Esqueci minha senha
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base font-normal leading-relaxed max-w-sm mx-auto">
                    Insira o e-mail associado à sua conta e enviaremos um link para redefinir sua senha.
                </p>
            </div>
        </div>
        <div className="p-8 sm:p-10 pt-0">
            <form className="flex flex-col gap-6" onSubmit={handlePasswordReset}>
                <div className="flex flex-col flex-1 gap-2">
                    <Label htmlFor="email" className="text-foreground text-sm font-semibold leading-normal flex items-center gap-2">
                        <span className="material-symbols-outlined text-muted-foreground text-[18px]">mail</span>
                        E-mail Corporativo
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
                    <Button type="submit" disabled={isSubmitting} className="h-12 text-base font-bold tracking-[0.015em] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5">
                        <span className="truncate">{isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
                        {!isSubmitting && <span className="material-symbols-outlined ml-2 text-[20px]">send</span>}
                    </Button>
                    <Button variant="ghost" asChild className="h-10 text-sm font-bold tracking-[0.015em] text-muted-foreground hover:text-foreground group/back">
                        <Link href="/login">
                            <span className="material-symbols-outlined text-[18px] group-hover/back:-translate-x-1 transition-transform">arrow_back</span>
                            <span className="truncate">Voltar para o Login</span>
                        </Link>
                    </Button>
                </div>
            </form>
        </div>
        <div className="py-4 bg-muted/50 border-t flex justify-center items-center gap-2 text-xs text-muted-foreground">
             <span className="material-symbols-outlined text-[14px]">lock</span>
            Ambiente Seguro e Criptografado
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center">
        <p className="text-xs text-muted-foreground/60 font-medium">2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card } from '@/components/ui/card';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, Auth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authService, setAuthService] = useState<Auth | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);


  useEffect(() => {
    if (auth) {
      setAuthService(auth);
      // If a user reaches this page already logged in,
      // sign them out to clear the session.
      if (auth.currentUser) {
        signOut(auth);
      }
    }
  }, [auth]);
  
  const bgImage = PlaceHolderImages.find(p => p.id === 'login-background');
  const portraitImage = PlaceHolderImages.find(p => p.id === 'broker-portrait');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authService || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de inicialização",
        description: "Serviços de autenticação não estão prontos. Tente novamente em breve.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(authService, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let redirectTo = '/dashboard'; // default redirect
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.userType === 'client') {
          redirectTo = '/radar/dashboard';
        }
      }

      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o seu painel.",
      });
      router.push(redirectTo);

    } catch (error: any) {
      setIsSubmitting(false); 
      
      console.error("Firebase Login Error Code:", error.code); 
      
      let description = "Credenciais inválidas. Verifique seu e-mail e senha.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "Credenciais inválidas. Verifique seu e-mail e senha. Se o erro persistir em produção, assegure-se que o provedor 'E-mail/Senha' está habilitado no Console do Firebase > Authentication > Sign-in method.";
      }
      
      toast({
        variant: "destructive",
        title: "Erro de login",
        description: description,
      });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Left Side - Form Area */}
      <div className="flex flex-1 flex-col bg-card dark:bg-background relative z-10 w-full lg:w-1/2 lg:max-w-[600px] xl:max-w-[700px] border-r border-border">
        {/* Header/Logo Area */}
        <header className="px-8 py-6 md:px-12 lg:px-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-foreground group">
            <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" />
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block" href="/ajuda">
            Precisa de ajuda?
          </Link>
        </header>

        {/* Login Form Container */}
        <main className="flex flex-1 flex-col justify-center px-8 md:px-12 lg:px-16 py-10">
          <div className="max-w-[440px] w-full mx-auto flex flex-col">
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 font-headline">Bem-vindo de volta</h1>
              <p className="text-muted-foreground text-base">Insira suas credenciais para acessar seu painel.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Endereço de E-mail</Label>
                <div className="relative">
                  <Input 
                    className="w-full h-12 px-4 pr-12 rounded-lg bg-card dark:bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600" 
                    id="email" 
                    name="email" 
                    placeholder="corretor@agencia.com.br" 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: '20px' }}>mail</span>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <Link className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors" href="/esqueceu-a-senha">Esqueceu a senha?</Link>
                </div>
                <div className="relative group">
                  <Input 
                    className="w-full h-12 px-4 pr-12 rounded-lg bg-card dark:bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <Checkbox id="remember" className="w-4 h-4 text-primary bg-card border-gray-300 rounded focus:ring-primary focus:ring-2 dark:bg-input dark:border-gray-600" />
                <Label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">Lembrar de mim por 30 dias</Label>
              </div>

              <Button type="submit" disabled={isSubmitting || !auth} className="w-full h-12 bg-primary hover:bg-[#25d60b] text-primary-foreground font-bold rounded-lg shadow-glow transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 group">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span> : <span>Entrar</span>}
                {!isSubmitting && <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: '20px' }}>arrow_forward</span>}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card dark:bg-background text-muted-foreground">Não tem uma conta?</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full h-12 px-6 font-semibold text-foreground bg-gray-50 dark:bg-input border-border rounded-lg hover:bg-gray-100 dark:hover:bg-secondary">
              <Link href="/solicitar-acesso">Solicitar Acesso de Corretor</Link>
            </Button>
          </div>
        </main>
        
        <footer className="px-8 py-6 md:px-12 lg:px-16 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26
            <Button asChild variant="link" className="text-xs p-0 h-auto ml-2">
              <Link href="/radar">É cliente?</Link>
            </Button>
          </p>
        </footer>
      </div>

      {/* Right Side - Image/Visual Area */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-dark overflow-hidden group/right-pane">
        {bgImage && (
          <Image
            alt={bgImage.description}
            src={bgImage.imageUrl}
            fill
            className="w-full h-full object-cover opacity-60 grayscale group-hover/right-pane:grayscale-0 transition-all duration-1000 ease-in-out"
            data-ai-hint={bgImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-dark/90 via-neutral-dark/40 to-primary/20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-1 bg-primary rounded-full"></div>
            <blockquote className="text-2xl font-medium leading-relaxed font-headline">
              "A ferramenta mais eficiente que já usamos para gerenciar nosso portfólio de imóveis de luxo. Simples, rápida e incrivelmente poderosa."
            </blockquote>
            <div className="flex items-center gap-4 pt-4">
              {portraitImage && (
                <div className="size-12 rounded-full overflow-hidden border-2 border-white/20">
                   <Image
                      alt={portraitImage.description}
                      src={portraitImage.imageUrl}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      data-ai-hint={portraitImage.imageHint}
                   />
                </div>
              )}
              <div>
                <div className="font-bold text-white">Marcus Thorne</div>
                <div className="text-sm text-gray-300">Corretor Sênior, Zenith Estates</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-12 right-12 flex gap-2">
            <Card className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl w-48 animate-pulse text-white" style={{ animationDuration: '4s' }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-300 uppercase tracking-wider">Negócios Ativos</span>
                    <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                </div>
                <div className="text-2xl font-bold">124</div>
                <div className="text-xs text-primary mt-1">+12% esta semana</div>
            </Card>
        </div>
      </div>
    </div>
  );
}

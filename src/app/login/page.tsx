
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { Icons } from '@/components/icons';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none">
            <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.93H12.22V14.2H18.17C17.92 15.65 17.21 16.91 16.14 17.63L16.13 17.64L19.59 20.21L19.74 20.22C21.58 18.51 22.56 15.63 22.56 12.25Z" fill="#4285F4"></path>
            <path d="M12.22 23C15.11 23 17.55 22.03 19.74 20.22L16.14 17.64C15.19 18.33 13.86 18.79 12.22 18.79C9.36 18.79 6.94 16.94 6.03 14.28L6.02 14.28L2.43 16.93L2.39 16.94C4.58 20.53 8.14 23 12.22 23Z" fill="#34A853"></path>
            <path d="M6.03 14.28C5.79 13.59 5.65 12.85 5.65 12.11C5.65 11.37 5.79 10.63 6.02 9.94L6.03 9.93L2.39 7.28L2.43 7.27C1.52 9.09 1 10.97 1 12.99C1 15.01 1.52 16.89 2.43 18.71L6.03 14.28Z" fill="#FBBC05"></path>
            <path d="M12.22 5.21C14.01 5.21 15.21 6.03 15.82 6.59L18.78 3.63C16.79 1.76 14.59 0.75 12.22 0.75C8.14 0.75 4.58 3.47 2.39 7.06L6.03 9.72C6.94 7.06 9.36 5.21 12.22 5.21Z" fill="#EA4335"></path>
        </svg>
    )
}

function FacebookIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="#1877F2">
            <path d="M12 2.04C6.48 2.04 2 6.52 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.32 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.52 17.52 2.04 12 2.04Z"/>
        </svg>
    )
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    async function fetchLogo() {
      const settings = await getAppearanceSettings();
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
    }
    fetchLogo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check user role from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vindo de volta!',
      });

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'Corretor') {
            router.push('/corretor/dashboard');
            return;
        }
        if (userData.role === 'Construtora') {
            router.push('/dashboard-construtora/dashboard');
            return;
        }
        if (userData.roleId || user.email === 'vinicius@teste.com' || userData.role === 'Admin') {
            router.push('/dashboard');
            return;
        }
      }
      
      router.push('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: 'E-mail ou senha inválidos. Por favor, tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-primary p-12 lg:flex">
         <div className="absolute top-8 left-8 flex items-start gap-2">
            <Link href={redirectUrl} className="flex items-center gap-1">
                {logoUrl ? (
                    <Image src={logoUrl} alt="Oraora Logo" width={200} height={60} className="h-12 w-auto object-contain" />
                ) : (
                    <>
                        <Icons.logo className="h-10 w-10 text-white" />
                        <span className="font-bold text-4xl text-white tracking-tighter">oraora</span>
                    </>
                )}
            </Link>
         </div>
          <Link href={redirectUrl} className="absolute top-8 right-8 flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o site</span>
         </Link>
         <div className="z-10 text-left w-full max-w-md">
             <h1 className="text-5xl font-bold tracking-tight text-primary-foreground">Bem-vindo ao maior portal de imóveis do Brasil</h1>
         </div>
         <Image 
            src="https://placehold.co/800x600.png"
            alt="Abstract 3D graphic"
            width={800}
            height={600}
            className="absolute bottom-0 right-0 opacity-20"
            data-ai-hint="abstract 3d graphic"
        />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="absolute top-6 right-6 flex items-center gap-4 text-sm">
            <span>É novo por aqui? <Link href="#" className="font-bold text-black hover:underline">Crie uma conta</Link></span>
          </div>
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold">Acessar</h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
             <Button variant="outline" className="w-full h-12 text-base shadow-sm hover:bg-gray-50">
                <GoogleIcon />
                <span className="ml-3">Entrar com Google</span>
             </Button>
             <Button variant="outline" className="w-full h-12 text-base shadow-sm hover:bg-gray-50">
                <FacebookIcon />
                <span className="ml-3">Entrar com Facebook</span>
             </Button>
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou entre com seu e-mail</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Seu e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 rounded-lg pr-10"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
                    <Label htmlFor="remember" className="text-sm font-normal">Lembrar-me</Label>
                </div>
                <Link href="#" className="text-sm text-black font-bold hover:underline">Esqueceu a senha?</Link>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}

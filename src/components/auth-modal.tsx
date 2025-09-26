
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, type User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIdToFavorite?: string | null;
  redirectToFavorites?: boolean;
}

export default function AuthModal({ isOpen, onOpenChange, propertyIdToFavorite, redirectToFavorites }: AuthModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { toggleFavorite } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // View management
  const [view, setView] = useState<'auth' | 'reset'>('auth');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);


  // Reset password state
  const [resetEmail, setResetEmail] = useState('');

  const handlePostAuthAction = async (user: User) => {
    // Check user role from Firestore before redirecting
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'Corretor') {
            router.push('/corretor/dashboard');
            return;
        }
        if (userData.roleId) {
            router.push('/dashboard');
            return;
        }
    }

    // Default client behavior
    if (propertyIdToFavorite) {
      await toggleFavorite(propertyIdToFavorite, true, user); // Force add and pass the user
    }
    
    if (redirectToFavorites || propertyIdToFavorite) {
      router.push('/favoritos');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Login bem-sucedido!' });
      await handlePostAuthAction(userCredential.user);
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no Login', description: 'Verifique seu e-mail e senha.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
      await updateProfile(user, { displayName: registerName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: registerName,
        email: registerEmail,
        role: 'Cliente',
        roleId: null,
        status: 'Active',
        favorites: propertyIdToFavorite ? [propertyIdToFavorite] : [],
        createdAt: new Date(),
        selectedPersonaId: null,
      });

      toast({ title: 'Conta criada com sucesso!', description: 'Você já pode adicionar imóveis ao seu radar.' });
      await handlePostAuthAction(user);
      onOpenChange(false);
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Erro ao criar conta', description: error.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: 'E-mail enviado!', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
      setView('auth');
      setResetEmail('');
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Erro', description: error.code === 'auth/user-not-found' ? 'Nenhum usuário encontrado com este e-mail.' : 'Não foi possível enviar o e-mail. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset view state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setView('auth'), 300);
      setLoginEmail('');
      setLoginPassword('');
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setResetEmail('');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {view === 'auth' && (
          <>
            <DialogHeader>
              <DialogTitle>Acesse sua conta</DialogTitle>
              <DialogDescription>
                Faça login ou crie uma conta para salvar imóveis no seu radar.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Senha</Label>
                      <Button type="button" variant="link" className="h-auto p-0 text-xs text-foreground" onClick={() => setView('reset')}>
                        Esqueci minha senha
                      </Button>
                    </div>
                    <div className="relative">
                      <Input 
                        id="login-password" 
                        type={showLoginPassword ? 'text' : 'password'} 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        required 
                        className="pr-10"
                      />
                       <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                          {showLoginPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome</Label>
                    <Input id="register-name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input 
                        id="register-password" 
                        type={showRegisterPassword ? 'text' : 'password'} 
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)} 
                        required 
                        className="pr-10"
                      />
                       <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                          {showRegisterPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
        {view === 'reset' && (
          <>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Digite seu e-mail de cadastro e enviaremos um link para você criar uma nova senha.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required placeholder="seu@email.com"/>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar link de redefinição
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setView('auth')}>
                 <ArrowLeft className="mr-2 h-4 w-4"/> Voltar para o Login
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

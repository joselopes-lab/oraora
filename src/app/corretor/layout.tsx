
'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, updateProfile, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AuthProvider } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Pencil, Loader2, Eye, EyeOff, Menu } from 'lucide-react';
import { Icons } from '@/components/icons';
import PasswordStrength from '@/components/password-strength';
import { z } from 'zod';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CorretorSidebar from '@/components/corretor-sidebar';

const passwordSchema = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial.');

const profileSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    if (!data.newPassword) return true;
    return data.newPassword === data.confirmPassword;
  }, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })
  .refine(data => {
    if(data.newPassword) {
      const passValidation = passwordSchema.safeParse(data.newPassword);
      return passValidation.success;
    }
    return true;
  }, {
    message: "A nova senha não atende aos critérios de segurança.",
    path: ['newPassword'],
  });

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const name = user.displayName || '';
        setUserName(name);
        setUserEmail(user.email || '');
        setProfileName(name);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha no Logout', description: error.message });
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingProfile(true);
    
    const dataToValidate = {
      name: profileName,
      newPassword: newPassword || undefined,
      confirmPassword: confirmPassword || undefined,
    }

    const validatedFields = profileSchema.safeParse(dataToValidate);
    
    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      const firstError = fieldErrors.name?.[0] || fieldErrors.newPassword?.[0] || fieldErrors.confirmPassword?.[0] || 'Dados inválidos.';
      
       if (dataToValidate.newPassword && !passwordSchema.safeParse(dataToValidate.newPassword).success) {
         const passError = passwordSchema.safeParse(dataToValidate.newPassword);
         if (!passError.success) {
           toast({ variant: 'destructive', title: "Erro na Senha", description: passError.error.errors[0].message });
           setIsSubmittingProfile(false);
           return;
         }
      }

      toast({ variant: 'destructive', title: "Erro de Validação", description: firstError });
      setIsSubmittingProfile(false);
      return;
    }
  
    const { name, newPassword: validatedPassword } = validatedFields.data;

    try {
      if (user.displayName !== name) {
          await updateProfile(user, { displayName: name });
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { name: name });
          setUserName(name);
      }
  
      if (validatedPassword) {
        await updatePassword(user, validatedPassword);
      }
      
      toast({ title: "Sucesso!", description: "Perfil atualizado com sucesso!" });
      setIsProfileDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (error.code === 'auth/requires-recent-login') {
          errorMessage = 'Esta operação é sensível e requer autenticação recente. Por favor, faça logout e login novamente.';
      } else {
          errorMessage = error.message;
      }
      toast({ variant: 'destructive', title: "Erro ao Atualizar", description: errorMessage });
    } finally {
        setIsSubmittingProfile(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '..';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <AuthProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <CorretorSidebar />
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <CorretorSidebar isMobile />
                </SheetContent>
            </Sheet>
            
            <div className="w-full flex-1" />

            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">Portal do Corretor</p>
                  </div>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                              <Avatar className="h-10 w-10">
                                  <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                              </Avatar>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-1">
                                  <p className="text-sm font-medium leading-none">{userName}</p>
                                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                              </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Sair</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                          Atualize suas informações. Clique em salvar para aplicar as mudanças.
                      </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="profile-name">Nome</Label>
                          <Input 
                              id="profile-name" 
                              name="name"
                              value={profileName} 
                              onChange={(e) => setProfileName(e.target.value)}
                              disabled={isSubmittingProfile}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="new-password">Nova Senha</Label>
                          <div className="relative">
                            <Input 
                                id="new-password" 
                                name="newPassword" 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Deixe em branco para não alterar" 
                                className="pr-10"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isSubmittingProfile}
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
                          {newPassword && <PasswordStrength password={newPassword} />}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                          <div className="relative">
                            <Input 
                                id="confirm-password" 
                                name="confirmPassword" 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="Confirme sua nova senha" 
                                className="pr-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmittingProfile || !newPassword}
                            />
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                          </div>
                      </div>
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)} disabled={isSubmittingProfile}>Cancelar</Button>
                          <Button type="submit" disabled={isSubmittingProfile}>
                              {isSubmittingProfile ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                          </Button>
                      </DialogFooter>
                  </form>
              </DialogContent>
            </Dialog>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

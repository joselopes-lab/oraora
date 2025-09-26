
'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, ExternalLink, Bell, LayoutGrid, Pencil, Loader2, Eye, EyeOff, Menu } from 'lucide-react';
import { signOut, onAuthStateChanged, updateProfile, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import PasswordStrength from '@/components/password-strength';
import { z } from 'zod';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import DashboardSidebarNav from '@/components/dashboard-sidebar-nav';


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


export default function DashboardHeader({ permissions }: { permissions: string[] }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');

  // Profile Dialog State
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
        setUserName(user.displayName || 'Admin');
        setUserEmail(user.email || '');
        setProfileName(user.displayName || 'Admin');
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: "Erro", description: "Usuário não autenticado." });
        return;
    }
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
          errorMessage = 'Esta operação é sensível e requer autenticação recente. Por favor, faça logout e login novamente antes de tentar novamente.';
      } else {
          errorMessage = error.message;
      }
      toast({ variant: 'destructive', title: "Erro ao Atualizar", description: errorMessage });
    } finally {
        setIsSubmittingProfile(false);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout Realizado',
        description: 'Você foi desconectado com sucesso.',
      });
       router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no Logout',
        description: error.message,
      });
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <DashboardSidebarNav permissions={permissions} />
            </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
            <Link href="/" target="_blank" passHref>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Site
              </Button>
            </Link>
        </div>
        <div className="flex items-center justify-end space-x-1">
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notificações</span>
            </Button>
            <Button variant="ghost" size="icon">
                <LayoutGrid className="h-5 w-5" />
                <span className="sr-only">Aplicações</span>
            </Button>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={userName} data-ai-hint="person avatar"/>
                        <AvatarFallback>
                            <User />
                        </AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                        </p>
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
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>
                            Atualize suas informações pessoais. Clique em salvar para aplicar as mudanças.
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
                            <Label htmlFor="profile-email">Email</Label>
                            <Input id="profile-email" type="email" value={userEmail} disabled />
                            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                        </div>
                            <div className="relative space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
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
                                className="absolute right-1 top-[26px] h-8 w-8 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                        </div>
                        {newPassword && <PasswordStrength password={newPassword} />}
                            <div className="relative space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input 
                                id="confirm-password" 
                                name="confirmPassword" 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="Confirme sua nova senha" 
                                className="pr-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmittingProfile}
                            />
                                <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-[26px] h-8 w-8 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
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
        </div>
    </header>
  );
}

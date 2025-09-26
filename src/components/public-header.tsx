
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { Icons } from './icons';
import { Button } from './ui/button';
import { useContext, useEffect, useState, type FormEvent } from 'react';
import { LocationContext } from '@/context/location-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, MapPin, Radar, LogOut, LayoutDashboard, Eye, Trash2, ChevronDown, Pencil, EyeOff, LogIn } from 'lucide-react';
import MobileStateSelector from './mobile-state-selector';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import { Badge } from './ui/badge';
import { useAuth } from '@/context/auth-context';
import AuthModal from './auth-modal';
import { auth, db } from '@/lib/firebase';
import { signOut, updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import PasswordStrength from './password-strength';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { requestAccountDeletion } from '@/app/actions/user';

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


function DeleteAccountDialog({ user, onOpenChange }: { user: any, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [emailForDeletion, setEmailForDeletion] = useState('');
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

    const handleRequestDeletion = async () => {
        if (emailForDeletion !== user?.email) {
            toast({ variant: 'destructive', title: "Email não corresponde", description: "O email digitado não é o mesmo do seu cadastro." });
            return;
        }
        setIsSubmittingDeletion(true);
        const result = await requestAccountDeletion(user.uid, user.email);

        if (result.success) {
            toast({
                title: "Solicitação Recebida",
                description: "Sua solicitação de exclusão de conta foi enviada. Você será desconectado.",
            });
            await signOut(auth);
            onOpenChange(false);
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: "Erro",
                description: result.error,
            });
        }
        setIsSubmittingDeletion(false);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-center text-2xl">Solicitar exclusão da conta</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="text-muted-foreground">
                    Sua conta e todos os seus dados (radar, etc.) serão permanentemente excluídos em 60 dias. Para confirmar, digite seu e-mail abaixo.
                </p>
                <div className="my-6">
                    <Label htmlFor="email-confirm" className="sr-only">Confirmar Email</Label>
                    <Input
                        id="email-confirm"
                        type="email"
                        placeholder="Digite seu e-mail para confirmar"
                        value={emailForDeletion}
                        onChange={(e) => setEmailForDeletion(e.target.value)}
                        className="text-center"
                        disabled={isSubmittingDeletion}
                    />
                </div>
                <Button
                    type="button"
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={handleRequestDeletion}
                    disabled={isSubmittingDeletion || emailForDeletion !== user?.email}
                >
                    {isSubmittingDeletion ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    Solicitar exclusão
                </Button>
            </div>
        </DialogContent>
    )
}

export default function PublicHeader() {
  const { selectedState, states, selectState, isLoading: isLocationLoading } = useContext(LocationContext);
  const { user, loading: isAuthLoading, favorites, userName, panelUserType } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectToFavorites, setRedirectToFavorites] = useState(false);

  // Profile Dialog State
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchLogo() {
      const settings = await getAppearanceSettings();
      if(settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
    }
    fetchLogo();
  }, [])

   useEffect(() => {
    if (user && userName) {
      setProfileName(userName);
    }
  }, [user, userName]);

  const handleStateChange = (stateAcronym: string) => {
    const state = states.find(s => s.sigla === stateAcronym);
    if(state) {
      selectState(state);
    }
  }
  
  const handleFavoritesClick = (e: React.MouseEvent) => {
      if (!user) {
          e.preventDefault();
          setRedirectToFavorites(true);
          setIsAuthModalOpen(true);
      } else {
          setRedirectToFavorites(false);
          router.push('/favoritos');
      }
  }

   const handleLoginClick = () => {
    setRedirectToFavorites(false);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
      await signOut(auth);
      router.push('/');
  }
  
  const getFirstName = (name: string | null) => {
    if (!name) return 'Conta';
    return name.split(' ')[0];
  }
  
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }
  
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


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-24 items-center px-4 sm:px-8">
          <div className="mr-8 flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-1.5">
              {logoUrl ? (
                <Image src={logoUrl} alt="Oraora Logo" width={180} height={60} className="h-16 md:h-14 w-auto object-contain" />
              ) : (
                <Icons.logo className="h-10 w-10 text-primary" />
              )}
            </Link>
          </div>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            {/* Links removidos */}
          </nav>
          <div className="flex items-center justify-end space-x-2 md:space-x-4">
            {/* Seletor para Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isLocationLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4 text-muted-foreground" />}
              <Select onValueChange={handleStateChange} value={selectedState?.sigla} disabled={isLocationLoading}>
                  <SelectTrigger className="w-[150px] border-0 bg-transparent shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecionar Estado" />
                  </SelectTrigger>
                  <SelectContent>
                      {states.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
            
            {/* Seletor para Mobile */}
            <div className="md:hidden">
              <MobileStateSelector />
            </div>
            
            <Button variant="ghost" onClick={handleFavoritesClick} className="relative p-2 h-auto sm:h-10 sm:px-4 sm:py-2">
                <Radar className="h-5 w-5 sm:mr-2"/>
                <span className="hidden sm:inline">Radar</span>
                {isClient && !isAuthLoading && user && favorites.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{favorites.length}</Badge>
                )}
            </Button>

            {isClient && !isAuthLoading && user ? (
                panelUserType !== 'none' ? (
                     <Button asChild size="sm" className="btn-gradient text-white">
                        <Link href={panelUserType === 'broker' ? '/corretor/dashboard' : '/dashboard'}>
                            <LayoutDashboard className="mr-2 h-4 w-4"/>
                            Painel
                        </Link>
                    </Button>
                ) : (
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:inline">{getFirstName(userName)}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80" align="end">
                        <DropdownMenuLabel className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <p className="font-semibold">{userName}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                                    <LogOut className="mr-1.5 h-4 w-4"/>
                                    Sair
                                </Button>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DialogTrigger asChild>
                          <DropdownMenuItem asChild={false} onSelect={(e) => e.preventDefault()} className="cursor-pointer text-base p-3">
                             <Pencil className="mr-3 text-muted-foreground"/> Meu Perfil
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem asChild className="cursor-pointer text-base p-3">
                           <Link href="/favoritos">
                             <Radar className="mr-3 text-muted-foreground"/> Meu Radar
                           </Link>
                        </DropdownMenuItem>
                        <div className="bg-muted/50 p-4 mt-2 text-center text-xs text-muted-foreground">
                            <p className="mb-2">&copy; {new Date().getFullYear()} Oraora. Todos os direitos reservados.</p>
                             <p className="mb-4">
                               <Link href="/termos-de-uso" className="hover:underline">Termos de uso</Link> | <Link href="/politica-de-privacidade" className="hover:underline">Políticas de privacidade</Link>
                            </p>
                             <Dialog open={isDeleteAccountModalOpen} onOpenChange={setIsDeleteAccountModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="text-destructive h-auto p-0 text-xs">
                                        <Trash2 className="mr-2 h-4 w-4"/> Solicitar exclusão da conta
                                    </Button>
                                </DialogTrigger>
                                <DeleteAccountDialog user={user} onOpenChange={setIsDeleteAccountModalOpen} />
                             </Dialog>
                        </div>
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
                                <Input id="profile-email" type="email" value={user?.email || ''} disabled />
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
                )
            ) : (
                <Button onClick={handleLoginClick} className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                    <LogIn className="mr-2 h-4 w-4"/>
                    Entrar
                </Button>
            )}
          </div>
        </div>
      </header>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onOpenChange={(open) => {
            setIsAuthModalOpen(open);
            if (!open) setRedirectToFavorites(false); // Reset on close
        }}
        redirectToFavorites={redirectToFavorites}
      />
    </>
  );
}


'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, updateProfile, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth, AuthProvider } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { LogOut, User, Pencil, Loader2, Eye, EyeOff, Menu, Instagram, Phone, X, FilePlus, Users, ExternalLink, Bell } from 'lucide-react';
import { Icons } from '@/components/icons';
import PasswordStrength from '@/components/password-strength';
import { z } from 'zod';
import { getAppearanceSettings } from '@/app/dashboard/appearance/actions';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CorretorSidebar from '@/components/corretor-sidebar';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
    id: string;
    message: string;
    read: boolean;
    createdAt: { seconds: number, nanoseconds: number };
    propertyId?: string;
    propertyName?: string;
}

const passwordSchema = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial.');

const profileSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
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

interface BrokerLocation {
    state: string;
    city: string;
}

function CorretorLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, panelUserType } = useAuth();
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [mainLogo, setMainLogo] = useState('');
  
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Profile form fields
  const [profileName, setProfileName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [locations, setLocations] = useState<BrokerLocation[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Location select states
  const [allStates, setAllStates] = useState<State[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [selectedLocationState, setSelectedLocationState] = useState('');
  const [selectedLocationCity, setSelectedLocationCity] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user || panelUserType !== 'broker') {
        router.push('/login');
        return;
    }

    const loadData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserEmail(user.email || '');
            setUserName(userData.name || user.displayName || '');
            setProfileName(userData.name || user.displayName || '');
            setWhatsapp(userData.whatsapp || '');
            setInstagram(userData.instagram || '');
            setLocations(userData.locations || []);
            setLogoUrl(userData.logoUrl || '');
        }

        const appearanceSettings = await getAppearanceSettings();
        if (appearanceSettings.logoUrl) {
            setMainLogo(appearanceSettings.logoUrl);
        }

        const statesData = await getStates();
        setAllStates(statesData);
        setIsLoadingStates(false);
    }

    loadData();

    // Fetch Notifications
    const notifsQuery = query(collection(db, 'broker_notifications'), where('brokerId', '==', user.uid));
    const unsubscribeNotifications = onSnapshot(notifsQuery, (snapshot) => {
        const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        notifsData.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
        setNotifications(notifsData);
    });

    return () => {
        unsubscribeNotifications();
    };

  }, [user, authLoading, panelUserType, router]);

  const handleLocationStateChange = async (stateAcronym: string) => {
    setSelectedLocationState(stateAcronym);
    setSelectedLocationCity('');
    setIsLoadingCities(true);
    setAllCities([]);
    if (stateAcronym) {
      const citiesData = await getCitiesByState(stateAcronym);
      setAllCities(citiesData);
    }
    setIsLoadingCities(false);
  };

  const handleAddLocation = () => {
    if (!selectedLocationState || !selectedLocationCity) {
      toast({ variant: 'destructive', title: 'Seleção inválida', description: 'Por favor, selecione um estado e uma cidade.' });
      return;
    }
    const newLocation = { state: selectedLocationState, city: selectedLocationCity };
    if (!locations.some(loc => loc.state === newLocation.state && loc.city === newLocation.city)) {
      setLocations(prev => [...prev, newLocation]);
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };


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
      whatsapp,
      instagram,
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
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
          name: profileName,
          whatsapp: whatsapp,
          instagram: instagram,
          locations: locations
      });
      setUserName(profileName);
  
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
  
    const handleNotificationClick = async (notification: Notification) => {
        router.push('/corretor/carteira');
        if (!notification.read) {
            const notifRef = doc(db, 'broker_notifications', notification.id);
            await updateDoc(notifRef, { read: true });
        }
    };
    
    const handleMarkAllAsRead = async () => {
        if (!user) return;
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            if (!notif.read) {
                const notifRef = doc(db, 'broker_notifications', notif.id);
                batch.update(notifRef, { read: true });
            }
        });
        await batch.commit();
        toast({ title: "Notificações marcadas como lidas." });
    };

  const getInitials = (name: string) => {
    if (!name) return '..';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }
  
  if (authLoading || !user || panelUserType !== 'broker') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen w-full bg-gradient-to-b from-[#c8c8c8] to-[#b8bcc8]">
        <CorretorSidebar />

        <div className="flex flex-col flex-1 md:ml-20">
          <header className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs">
                    <CorretorSidebar isMobile />
                </SheetContent>
            </Sheet>
            
            <div className="w-full flex-1">
                 <Link href="/corretor/dashboard" className="flex items-center gap-2 font-semibold">
                    {mainLogo ? (
                        <Image src={mainLogo} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                    ) : (
                        <>
                            <Icons.logo className="h-6 w-6 text-primary" />
                            <span className="">oraora</span>
                        </>
                    )}
                </Link>
            </div>
             <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => router.push('/corretor/avulso?edit=new')}>
                    <FilePlus className="mr-2 h-4 w-4"/>Cadastrar Avulso
                </Button>
                <Button size="sm" onClick={() => router.push('/corretor/clientes?action=new')}>
                    <Users className="mr-2 h-4 w-4"/>Adicionar Cliente
                </Button>
                <Button asChild size="sm">
                    <Link href={`/corretor-publico/${user?.uid}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4"/>Ver Meu Site</Link>
                </Button>
            </div>
            
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5"/>
                        {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                        <>
                            {notifications.slice(0,5).map(notif => (
                                <DropdownMenuItem key={notif.id} onSelect={() => handleNotificationClick(notif)} className={cn("cursor-pointer flex items-start gap-3", !notif.read && "font-bold")}>
                                    {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                                    <div className={cn(!notif.read && "pl-0", notif.read && "pl-4")}>
                                        <p className="text-sm leading-tight">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(notif.createdAt.seconds * 1000, { addSuffix: true, locale: ptBR })}</p>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            {unreadCount > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={handleMarkAllAsRead} className="cursor-pointer">
                                        Marcar todas como lidas
                                    </DropdownMenuItem>
                                </>
                            )}
                        </>
                    ) : (
                        <DropdownMenuItem disabled>Nenhuma notificação</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <div className="flex items-center gap-4">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={logoUrl} alt={userName} />
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
              <DialogContent className="sm:max-w-2xl">
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
                          <Label htmlFor="whatsapp">WhatsApp</Label>
                           <div className="relative">
                               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input 
                                  id="whatsapp" 
                                  name="whatsapp"
                                  value={whatsapp} 
                                  onChange={(e) => setWhatsapp(e.target.value)}
                                  disabled={isSubmittingProfile}
                                  placeholder="(99) 99999-9999"
                                  className="pl-10"
                               />
                           </div>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                           <div className="relative">
                               <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  id="instagram" 
                                  name="instagram"
                                  value={instagram} 
                                  onChange={(e) => setInstagram(e.target.value)}
                                  disabled={isSubmittingProfile}
                                  placeholder="@seuusuario"
                                  className="pl-10"
                                />
                           </div>
                      </div>
                      <div className="space-y-4 rounded-lg border p-4">
                        <Label>Cidades de Atuação</Label>
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1.5">
                            <Label htmlFor="location-state" className="text-xs">Estado</Label>
                            <Select onValueChange={handleLocationStateChange} value={selectedLocationState} disabled={isLoadingStates}>
                              <SelectTrigger id="location-state"><SelectValue placeholder={isLoadingStates ? "Carregando..." : "Selecione"} /></SelectTrigger>
                              <SelectContent>
                                {allStates.map(s => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <Label htmlFor="location-city" className="text-xs">Cidade</Label>
                            <Select onValueChange={setSelectedLocationCity} value={selectedLocationCity} disabled={!selectedLocationState || isLoadingCities}>
                              <SelectTrigger id="location-city"><SelectValue placeholder={isLoadingCities ? "Carregando..." : "Selecione"} /></SelectTrigger>
                              <SelectContent>
                                {allCities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="button" size="sm" onClick={handleAddLocation}>Adicionar</Button>
                        </div>
                        <div className="space-y-2">
                          {locations.map((loc, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                              <span>{loc.city} - {loc.state}</span>
                              <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveLocation(index)}><X className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
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
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
  );
}


export default function CorretorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CorretorLayoutContent>{children}</CorretorLayoutContent>
    </AuthProvider>
  );
}

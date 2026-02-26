
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore, setDocumentNonBlocking, useAuth, useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from '@/lib/storage';

const profileSchema = z.object({
  username: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().optional(),
  creci: z.string().optional(),
  bio: z.string().max(300, 'A biografia não pode exceder 300 caracteres.').optional(),
});

const siteSchema = z.object({
    slug: z.string().min(3, 'O slug deve ter pelo menos 3 caracteres.'),
    brandName: z.string().min(1, 'O nome da marca é obrigatório.'),
    logoUrl: z.string().url('URL do logo inválida.').optional().or(z.literal('')),
});


const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'As novas senhas não coincidem.',
  path: ['confirmNewPassword'],
});

type UserData = {
    username?: string;
    phone?: string;
    creci?: string;
    bio?: string;
    slug?: string;
    brandName?: string;
    logoUrl?: string;
    userType?: 'broker' | 'admin' | 'constructor';
    profileImageUrl?: string;
};

type UploadState = {
  progress: number;
  isUploading: boolean;
  error: string | null;
};


export default function ProfilePage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore, auth, storage } = useFirebase();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });


  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', phone: '', creci: '', bio: '' },
  });

  const siteForm = useForm<z.infer<typeof siteSchema>>({
    resolver: zodResolver(siteSchema),
    defaultValues: { slug: '', brandName: '', logoUrl: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  useEffect(() => {
    setIsMounted(true);
    if (user && firestore) {
      const fetchUserData = async () => {
        setIsLoading(true);
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let combinedData: UserData = {};

        if (userDoc.exists()) {
          const uData = userDoc.data();
          combinedData = { ...uData };

          if (uData.userType === 'broker') {
              const brokerDocRef = doc(firestore, 'brokers', user.uid);
              const brokerDoc = await getDoc(brokerDocRef);
              if (brokerDoc.exists()) {
                  combinedData = { ...combinedData, ...brokerDoc.data() };
              }
          }
        } else {
             combinedData = { username: user.displayName || '' };
        }
        
        setUserData(combinedData);
        profileForm.reset({
            username: combinedData.username || '',
            phone: combinedData.phone || '',
            creci: combinedData.creci || '',
            bio: combinedData.bio || '',
        });
        if (combinedData.userType === 'broker') {
            siteForm.reset({
                slug: combinedData.slug || '',
                brandName: combinedData.brandName || '',
                logoUrl: combinedData.logoUrl || '',
            });
        }
        setIsLoading(false);
      };
      fetchUserData();
    }
  }, [user, firestore, profileForm, siteForm]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Upload",
            description: "Não foi possível iniciar o upload. Tente novamente."
        });
        return;
    }

    setUploadState({ progress: 0, isUploading: true, error: null });

    try {
        const path = `users/${user.uid}/perfil-img`;
        const onProgress = (progress: number) => {
            setUploadState(prev => ({ ...prev, progress }));
        };

        console.log(storage)

        const downloadURL = await uploadFile(storage, path, file, onProgress);

        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
        }
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDocumentNonBlocking(userDocRef, { profileImageUrl: downloadURL }, { merge: true });
        
        setUserData(prev => prev ? { ...prev, profileImageUrl: downloadURL } : null);

        toast({ title: 'Upload Concluído!', description: 'Sua foto de perfil foi atualizada.' });

    } catch (error) {
        console.error('Upload error:', error);
        setUploadState({ progress: 0, isUploading: false, error: 'Falha no upload.' });
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar a imagem." });
    } finally {
        setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !firestore) return;
    
    try {
      if (user.displayName !== data.username) {
        await updateProfile(user, { displayName: data.username });
      }

      const userDocRef = doc(firestore, 'users', user.uid);
      await setDocumentNonBlocking(userDocRef, {
        username: data.username,
        phone: data.phone,
        bio: data.bio,
      }, { merge: true });

      if(userData?.userType === 'broker'){
        const brokerDocRef = doc(firestore, 'brokers', user.uid);
        await setDocumentNonBlocking(brokerDocRef, {
            creci: data.creci,
        }, { merge: true });
      }

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações pessoais foram salvas com sucesso.',
      });

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao salvar suas informações.',
      });
    }
  };

  const onSiteSubmit = async (data: z.infer<typeof siteSchema>) => {
      if (!user || !firestore || userData?.userType !== 'broker') return;

      try {
          const brokerDocRef = doc(firestore, 'brokers', user.uid);
          setDocumentNonBlocking(brokerDocRef, data, { merge: true });

          toast({
              title: 'Site Público Atualizado!',
              description: 'As configurações do seu site foram salvas.',
          });
          siteForm.reset(siteForm.getValues());
      } catch (error: any) {
          console.error('Erro ao atualizar site:', error);
          toast({
              variant: 'destructive',
              title: 'Erro ao salvar',
              description: 'Não foi possível salvar as configurações do site.',
          });
      }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user || !user.email) return;

    try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);
        
        toast({
            title: 'Senha atualizada!',
            description: 'Sua senha foi alterada com sucesso.',
        });
        passwordForm.reset();

    } catch (error: any) {
         console.error('Erro ao atualizar senha:', error);
         toast({
            variant: 'destructive',
            title: 'Erro ao atualizar senha',
            description: error.code === 'auth/wrong-password' ? 'A senha atual está incorreta.' : 'Ocorreu um erro ao alterar sua senha.',
         });
    }
  }

  if (!isMounted || isLoading || isAuthLoading) {
    return <div className="p-10">Carregando perfil...</div>;
  }

  const isBroker = userData?.userType === 'broker';

  return (
    <div className="w-full max-w-7xl mx-auto">
      <nav className="flex flex-wrap gap-2 text-sm mb-6">
        <Link className="text-gray-500 hover:text-primary transition-colors font-medium" href="/dashboard">Dashboard</Link>
        <span className="text-gray-400 font-medium">/</span>
        <span className="text-foreground font-semibold">Meu Perfil</span>
      </nav>

      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-tight">Meu Perfil</h1>
        <p className="text-gray-500 text-base font-normal leading-normal max-w-2xl">Gerencie suas informações, dados profissionais e credenciais de acesso.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 max-w-2xl h-12 p-1.5 rounded-xl">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {isBroker && <TabsTrigger value="site">Meu Site</TabsTrigger>}
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="overflow-hidden shadow-soft mt-4">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Avatar className="h-24 w-24 sm:h-28 sm:w-28 shadow-sm ring-4 ring-gray-50">
                            <AvatarImage src={user?.photoURL || userData?.profileImageUrl || ''} alt={user?.displayName || 'Avatar'} />
                            <AvatarFallback className="text-4xl">{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                        </div>
                        </label>
                        <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} disabled={uploadState.isUploading} />
                    </div>
                     {uploadState.isUploading && (
                        <div className="w-full max-w-[150px] mt-2">
                        <Progress value={uploadState.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center mt-1">{Math.round(uploadState.progress)}%</p>
                        </div>
                    )}
                    {uploadState.error && <p className="text-xs text-red-500 mt-1">{uploadState.error}</p>}
                </div>
                <div className="flex flex-col gap-1 text-center sm:text-left flex-1">
                  <h3 className="text-foreground text-xl font-bold">Foto de Perfil</h3>
                  <p className="text-gray-500 text-sm">Essa imagem será exibida em seu perfil público e em seus anúncios.</p>
                  <div className="mt-3 flex justify-center sm:justify-start gap-3">
                    <Button variant="outline" size="sm">Remover</Button>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">Carregar nova (JPG, PNG)</Button>
                  </div>
                </div>
              </div>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="p-6 sm:p-8 flex flex-col gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <h2 className="text-foreground text-lg font-bold tracking-tight">Informações Pessoais</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={profileForm.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormItem>
                      <FormLabel>E-mail Corporativo</FormLabel>
                       <div className="relative">
                        <Input type="email" value={user?.email || ''} readOnly disabled className="cursor-not-allowed bg-muted" />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400 text-[18px]">lock</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Para alterar seu e-mail, contate o administrador.</p>
                    </FormItem>
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" type="tel" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    <h2 className="text-foreground text-lg font-bold tracking-tight">Dados Profissionais</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={profileForm.control} name="creci" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRECI</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-F" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="md:col-span-2">
                     <FormField control={profileForm.control} name="bio" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio / Sobre Mim</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Escreva um breve resumo sobre sua experiência..." rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t mt-2">
                  <Button variant="outline" type="button" onClick={() => profileForm.reset()}>Cancelar</Button>
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>
        {isBroker && (
        <TabsContent value="site">
            <Card className="overflow-hidden shadow-soft mt-4">
                <Form {...siteForm}>
                    <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="p-6 sm:p-8 flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                                <span className="material-symbols-outlined text-primary">public</span>
                                <h2 className="text-foreground text-lg font-bold tracking-tight">Configurações do Site Público</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={siteForm.control} name="brandName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Marca/Imobiliária</FormLabel>
                                        <FormControl><Input placeholder="Ex: João Imóveis" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={siteForm.control} name="slug" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL do Site</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center">
                                                <span className="text-sm text-muted-foreground bg-muted px-3 h-10 flex items-center rounded-l-md border border-r-0">oraora.com/sites/</span>
                                                <Input className="rounded-l-none" placeholder="joao-imoveis" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={siteForm.control} name="logoUrl" render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>URL do Logo</FormLabel>
                                        <FormControl><Input type="url" placeholder="https://exemplo.com/logo.png" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t mt-2">
                            <Button variant="outline" type="button" onClick={() => siteForm.reset()}>Cancelar</Button>
                            <Button type="submit" disabled={siteForm.formState.isSubmitting}>
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Salvar Configurações do Site
                            </Button>
                        </div>
                    </form>
                 </Form>
            </Card>
        </TabsContent>
        )}
        <TabsContent value="security">
          <Card className="overflow-hidden shadow-soft mt-4">
             <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="p-6 sm:p-8 flex flex-col gap-8">
                 <div>
                    <h2 className="text-foreground text-lg font-bold tracking-tight mb-2">Alterar Senha</h2>
                    <div className="bg-muted/50 rounded-lg p-5 border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="confirmNewPassword" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-muted-foreground text-xs">
                            <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                            <p>Sua nova senha deve ter no mínimo 8 caracteres.</p>
                        </div>
                    </div>
                    </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t mt-2">
                    <Button variant="outline" type="button" onClick={() => passwordForm.reset()}>Cancelar</Button>
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                        Alterar Senha
                    </Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

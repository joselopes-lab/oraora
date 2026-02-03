
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const formSchema = z
  .object({
    name: z.string().min(1, { message: 'O nome é obrigatório.' }),
    email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
    phone: z.string().min(1, 'O telefone é obrigatório.'),
    password: z.string().min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' }),
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar os termos.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export default function RadarSignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Inicialização",
        description: "Serviços de autenticação não estão disponíveis.",
      });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: values.name });

      // Create user document in 'users' collection
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        userType: 'client', // New user type
        email: values.email,
        username: values.name,
        phone: values.phone,
        isActive: true,
        planId: 'radar-free' // A default plan for clients
      });

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você será redirecionado para o seu dashboard.',
      });
      router.push('/radar/dashboard');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : 'Ocorreu um erro durante o cadastro. Tente novamente.',
      });
    }
  }

  // Placeholder images
  const bgImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBWzh6uISTMq88anhDplYoQR9S-h9IIvtfBbvNce2Kskusv9xuhdgJr2J6r3aO9fB2j_8kt_UlJodvBD9fIZzA0DFKC87gnZp_XcxMbh0f77Ut66PR-MQQvbZbfKAZ8ZteK8HOmS9GbvXri44rEfGR-015SoTGlKQJfxq1boNgqhHDeAzcy3aqE1VcY3JEBOJVGbhT_VYeYZm1-ozBAb7UnlwaUhJetPhk61LXnylxJi9N1uw8G5OYxze0-cO3JSOeLi-HC57e7IuE";
  const userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuAi4UXbaUgoWVmbSEIToD_AJ_0Gxhmgy2_PyLOZlFt5AEwrZWK74rmzyXuz-9F0V2k9RJwOHCU0Pt8ZSee0fGIyVLpOmpBzw16_JobaP_SzfckPFV1qoRFUZ2Ku9gWnjJiAJ3euWivZWPjW6-GZVyrXAYBqJqvJ57G134lJk_bJpSgWeDZn-RSC2ep3ZEmarJ3n_Mfg_34rLeKf1-VO85iPzsaCFlynl9hj96CBgxtnyPSKNX7Qzrq03DK1-XEYxrYdopDEdAQ1sQM";


  return (
    <div className="bg-background-light font-display antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-neutral-dark">
      <div className="relative flex min-h-screen w-full flex-row">
        <div className="flex flex-col flex-1 bg-white relative z-10 w-full lg:w-1/2 lg:max-w-[650px] xl:max-w-[750px] border-r border-[#f1f5f0]">
          <header className="px-8 py-8 md:px-12 lg:px-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
                <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" />
            </Link>
            <div className='flex items-center gap-4'>
                <Button asChild variant="outline" className="hidden lg:flex h-10 rounded-full px-6 text-sm font-bold transition">
                    <Link href="/login">Sou Corretor</Link>
                </Button>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <button className="lg:hidden flex size-10 items-center justify-center text-text-main">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 flex flex-col bg-white">
                         <SheetHeader>
                            <VisuallyHidden>
                                <SheetTitle>Menu Principal</SheetTitle>
                                <SheetDescription>Opções de login e acesso.</SheetDescription>
                            </VisuallyHidden>
                         </SheetHeader>
                         <div className="p-6 border-b">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                                <Image src="https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png" alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" />
                            </Link>
                        </div>
                        <div className="mt-auto p-6 space-y-4 border-t">
                            <Button asChild variant="outline" className="w-full h-12 text-base">
                                <Link href="/radar">
                                    <span className="material-symbols-outlined text-base mr-2">radar</span>
                                    Login Cliente
                                </Link>
                            </Button>
                            <Button asChild className="w-full h-12 text-base">
                                <Link href="/login">
                                   Sou Corretor
                                </Link>
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </header>
          <div className="flex flex-1 flex-col justify-center px-8 md:px-12 lg:px-16 py-8">
            <div className="max-w-[460px] w-full mx-auto flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-dark tracking-tight mb-3">Crie sua conta no Radar</h1>
                <p className="text-gray-500 text-base">Salve imóveis e receba alertas de oportunidades personalizadas.</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 text-neutral-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300" placeholder="Como podemos te chamar?" {...field} />
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }}>person</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 text-neutral-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300" placeholder="seu@email.com" type="email" {...field} />
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }}>mail</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 text-neutral-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300" placeholder="(00) 00000-0000" type="tel" {...field} />
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }}>chat</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <div className="relative group">
                                    <Input className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 text-neutral-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300 pr-12" placeholder="Mínimo 8 caracteres" type={showPassword ? 'text' : 'password'} {...field} />
                                    <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-400 hover:text-neutral-dark transition-colors focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                                <div className="relative group">
                                    <Input className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 text-neutral-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm hover:border-gray-300 pr-12" placeholder="Confirme sua senha" type={showConfirmPassword ? 'text' : 'password'} {...field} />
                                     <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-400 hover:text-neutral-dark transition-colors focus:outline-none" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  <FormField control={form.control} name="terms" render={({ field }) => (
                    <FormItem className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="terms" className="mt-1" />
                      </FormControl>
                      <div className="grid gap-1.5 leading-none">
                        <FormLabel htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                           Concordo com os <a className="text-neutral-dark font-semibold underline underline-offset-2 hover:text-primary transition-colors" href="#">termos</a> e <a className="text-neutral-dark font-semibold underline underline-offset-2 hover:text-primary transition-colors" href="#">política de privacidade</a>.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />
                  
                  <Button className="w-full h-14 mt-4 bg-primary hover:bg-[#b0d230] text-neutral-dark font-bold text-lg rounded-xl shadow-glow transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group" type="submit" disabled={form.formState.isSubmitting}>
                    <span>{form.formState.isSubmitting ? 'Criando conta...' : 'Criar Conta'}</span>
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: '22px' }}>arrow_forward</span>
                  </Button>
                </form>
              </Form>
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Já tem uma conta?
                  <Link href="/radar" className="font-bold text-neutral-dark hover:text-primary transition-colors ml-1 border-b-2 border-primary">
                    Faça login
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-6 md:px-12 lg:px-16 text-center md:text-left">
            <p className="text-xs text-gray-400">2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 relative bg-neutral-dark overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image alt="Modern luxury property with pool at sunset" className="w-full h-full object-cover" data-alt="Modern high-end house architecture" src={bgImage} fill />
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-dark via-neutral-dark/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-transparent to-transparent"></div>
            </div>
          <div className="relative z-10 flex flex-col justify-center p-16 xl:p-24 w-full h-full text-white">
            <div className="max-w-lg space-y-12">
              <div className="space-y-4">
                <div className="w-12 h-1.5 bg-primary rounded-full"></div>
                <h2 className="text-5xl font-bold leading-tight tracking-tight">Por que entrar para o <span className="text-primary">Radar?</span></h2>
                <p className="text-xl text-gray-300 font-light max-w-md">
                    A tecnologia que encontra o seu próximo lar antes de qualquer outra pessoa.
                </p>
              </div>
              <div className="grid gap-8">
                <div className="flex gap-5 items-start">
                  <div className="size-12 rounded-xl glass-panel flex items-center justify-center flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Alertas em Tempo Real</h3>
                    <p className="text-gray-400 text-sm">Seja o primeiro a saber quando um imóvel com o seu perfil chegar ao mercado.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="size-12 rounded-xl glass-panel flex items-center justify-center flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Lista de Desejos</h3>
                    <p className="text-gray-400 text-sm">Salve seus imóveis favoritos e compare preços e características de forma fácil.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="size-12 rounded-xl glass-panel flex items-center justify-center flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined">insights</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Análise de Mercado</h3>
                    <p className="text-gray-400 text-sm">Dados exclusivos sobre valorização e tendências da região que você procura.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-12 right-12">
                <div className="glass-panel p-5 rounded-2xl shadow-2xl max-w-[240px] border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-full overflow-hidden border border-primary/50">
                            <img alt="User" className="w-full h-full object-cover" src={userAvatar}/>
                        </div>
                        <div>
                            <div className="text-xs text-gray-300">Nova Oportunidade</div>
                            <div className="text-sm font-bold text-primary">Próximo a você</div>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3"></div>
                    </div>
                    <div className="mt-3 text-[10px] text-gray-400 uppercase tracking-widest font-medium">98% de compatibilidade</div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

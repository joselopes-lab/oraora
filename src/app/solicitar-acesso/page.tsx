
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const formSchema = z
  .object({
    name: z.string().min(1, { message: 'O nome é obrigatório.' }),
    email: z
      .string()
      .email({ message: 'Por favor, insira um e-mail válido.' }),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export default function RequestAccessPage() {
  const bgImage = PlaceHolderImages.find((p) => p.id === 'login-background');
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
      password: '',
      confirmPassword: '',
    },
  });

  const createFirestoreDocuments = async (user: any, values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const isAdminUser = values.email.toLowerCase() === 'vinicius@oraora.com.br';
    const userDocRef = doc(firestore, 'users', user.uid);

    if (isAdminUser) {
      const adminUserData = {
        id: user.uid, userType: 'admin', email: values.email,
        username: values.name, planId: 'admin-plan', isActive: true,
      };
      await setDoc(userDocRef, adminUserData, { merge: true });

      const adminDocRef = doc(firestore, 'admins', user.uid);
      await setDoc(adminDocRef, { id: user.uid, userId: user.uid }, { merge: true });
      
      toast({
        title: 'Conta de Administrador configurada!',
        description: 'Você será redirecionado para o dashboard.',
      });
      router.push('/dashboard');
    } else {
      const userData = {
        id: user.uid, userType: 'broker', email: values.email,
        username: values.name, planId: 'free-plan', isActive: true,
      };
      await setDoc(userDocRef, userData, { merge: true });

      const brokerDocRef = doc(firestore, 'brokers', user.uid);
      const slug = values.name.toLowerCase().replace(/\s+/g, '-');
      const brokerData = {
        id: user.uid, userId: user.uid, slug: slug,
        brandName: values.name, layoutId: 'urban-padrao',
      };
      await setDoc(brokerDocRef, brokerData, { merge: true });

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você será redirecionado para a escolha de planos.',
      });
      router.push('/planos');
    }
  }

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: values.name });
      await createFirestoreDocuments(user, values);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use' && values.email.toLowerCase() === 'vinicius@oraora.com.br') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          await createFirestoreDocuments(userCredential.user, values);
        } catch (loginError: any) {
          console.error('Erro no login do admin:', loginError);
          toast({
            variant: 'destructive',
            title: 'Erro de Login',
            description: 'A senha do administrador está incorreta. Tente novamente.',
          });
        }
      } else {
        console.error('Erro no cadastro:', error);
        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description:
            error.code === 'auth/email-already-in-use'
              ? 'Este e-mail já está em uso.'
              : 'Ocorreu um erro durante o cadastro. Tente novamente.',
        });
      }
    }
  }

  return (
    <div className="bg-background dark:bg-background-dark font-body text-foreground antialiased min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border dark:border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <Image src={siteData?.logoUrl || "https://dotestudio.com.br/wp-content/uploads/2025/08/oraora.png"} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground dark:text-gray-400 font-medium">
              Já possui conta?
            </span>
            <Button
              asChild
              variant="outline"
              className="h-9 px-4 text-sm font-bold"
            >
              <Link href="/login">Fazer Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl bg-card dark:bg-[#1f2b16] rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-border dark:border-white/10">
          {/* Left Side: Visual / Value Prop */}
          <div className="lg:w-5/12 relative bg-gray-50 dark:bg-black/20 flex flex-col justify-between p-10 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0">
              {bgImage && (
                <Image
                  alt={bgImage.description}
                  src={bgImage.imageUrl}
                  fill
                  className="w-full h-full object-cover opacity-90 grayscale brightness-[1.1]"
                  data-ai-hint="modern architecture background"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium mb-6">
                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                Nova Versão 2.0
              </div>
            </div>
            <div className="relative z-10 text-white">
              <h1 className="text-3xl font-bold leading-tight mb-4 font-headline">
                A plataforma #1 para corretores de alta performance.
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed mb-8">
                Automatize sua rotina, gerencie leads com IA e feche mais
                negócios com o CRM mais intuitivo do mercado imobiliário.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                    <span className="material-symbols-outlined text-primary text-sm">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    Site personalizado em 5 minutos
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                    <span className="material-symbols-outlined text-primary text-sm">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    Integração com portais imobiliários
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                    <span className="material-symbols-outlined text-primary text-sm">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    Dashboard financeiro completo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-7/12 p-8 lg:p-12 relative">
            <div className="max-w-xl mx-auto">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2 font-headline">
                  Cadastro do Corretor
                </h2>
                <p className="text-muted-foreground dark:text-gray-400 text-sm">
                  Preencha suas informações para iniciar seu período de teste
                  grátis de 14 dias.
                </p>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Section: Personal Info */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">
                                  person
                                </span>
                              </div>
                              <Input
                                className="pl-10 h-12"
                                placeholder="Seu nome"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Section: Access Data */}
                  <div className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail Corporativo</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">
                                  mail
                                </span>
                              </div>
                              <Input
                                className="pl-10 h-12"
                                placeholder="seu@email.com"
                                type="email"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">
                                    lock
                                  </span>
                                </div>
                                <Input
                                  className="pl-10 h-12"
                                  placeholder="••••••••"
                                  type="password"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">
                                    lock_reset
                                  </span>
                                </div>
                                <Input
                                  className="pl-10 h-12"
                                  placeholder="••••••••"
                                  type="password"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <Button
                    className="w-full h-12 text-base font-bold tracking-wider mt-4"
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    <span className="material-symbols-outlined mr-2">
                      rocket_launch
                    </span>
                    {form.formState.isSubmitting ? 'Finalizando...' : 'Finalizar Cadastro'}
                  </Button>
                </form>
                {/* Social Login / Divider */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border dark:border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card dark:bg-[#1f2b16] text-muted-foreground dark:text-gray-500">
                        Ou continue com
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" type="button" className="gap-2 h-11">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z"
                          fill="#fff"
                          fillOpacity="0"
                          stroke="none"
                        ></path>
                        <path
                          d="M20.101 13.2501c.15-.9667.2334-1.95.2334-2.9667 0-1.1667-.1167-2.3-.3167-3.4h-7.7333v6.1333h4.5c-.3 1.9333-1.4 3.5667-2.8834 4.5667v.4666l3.5834 2.7667c.3666-.3334 2.65-2.0333 2.6166-7.5667Z"
                          fill="#4285F4"
                        ></path>
                        <path
                          d="M12.2835 20.95c2.2333 0 4.1333-.7333 5.5333-2.0167l-3.0833-2.3833c-.85.6-2.0167.9833-3.2334.8833-2.6166-.2167-4.7666-2.2667-5.0666-4.8833-.0834-.7.0166-1.3833.25-2.0333H3.4501v2.5333c1.4667 3.1 4.7 5.2667 8.35 5.8667.1666.0167.3166.0333.4834.0333Z"
                          fill="#34A853"
                        ></path>
                        <path
                          d="M6.6835 10.5167c.1333-.45.3166-.8667.5666-1.25l.0334-.0667-3.2834-2.55-1.1833.9167c-.6667 1.3333-1.0334 2.85-1.0334 4.45s.3667 3.1167 1.0334 4.45l3.5-2.6834c-.4667-1.0333-.5-2.1833-.3-3.2666Z"
                          fill="#FBBC05"
                        ></path>
                        <path
                          d="M12.2835 6.0333c1.45.0667 2.6167.6 3.5333 1.45l2.6334-2.6333c-1.8834-1.75-4.3167-2.6-6.8167-2.3333-3.65.3666-6.6667 2.95-7.75 6.45L7.2668 11.5c.5334-2.9 3.0334-5.1167 6.0167-5.4667Z"
                          fill="#EB4335"
                        ></path>
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" type="button" className="gap-2 h-11">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-[#0077b5]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          clipRule="evenodd"
                          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 left-0 right-0 justify-center pointer-events-none hidden lg:flex">
        <p className="text-[10px] text-gray-400 font-medium bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200">
          🔒 Seus dados estão protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  );
}

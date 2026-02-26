
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RadarLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

    const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
    );
    const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

    // Placeholder images - in a real scenario, these would come from a CMS or a dedicated image service
    const bgImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBWzh6uISTMq88anhDplYoQR9S-h9IIvtfBbvNce2Kskusv9xuhdgJr2J6r3aO9fB2j_8kt_UlJodvBD9fIZzA0DFKC87gnZp_XcxMbh0f77Ut66PR-MQQvbZbfKAZ8ZteK8HOmS9GbvXri44rEfGR-015SoTGlKQJfxq1boNgqhHDeAzcy3aqE1VcY3JEBOJVGbhT_VYeYZm1-ozBAb7UnlwaUhJetPhk61LXnylxJi9N1uw8G5OYxze0-cO3JSOeLi-HC57e7IuE";
    const userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuAi4UXbaUgoWVmbSEIToD_AJ_0Gxhmgy2_PyLOZlFt5AEwrZWK74rmzyXuz-9F0V2k9RJwOHCU0Pt8ZSee0fGIyVLpOmpBzw16_JobaP_SzfckPFV1qoRFUZ2Ku9gWnjJiAJ3euWivZWPjW6-GZVyrXAYBqJqvJ57G134lJk_bJpSgWeDZn-RSC2ep3ZEmarJ3n_Mfg_34rLeKf1-VO85iPzsaCFlynl9hj96CBgxtnyPSKNX7Qzrq03DK1-XEYxrYdopDEdAQ1sQM";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !firestore) {
            toast({
                variant: "destructive",
                title: "Erro de inicialização",
                description: "Serviços de autenticação não estão prontos.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().userType === 'client') {
                toast({
                    title: "Login bem-sucedido!",
                    description: "Bem-vindo ao seu Radar.",
                });
                router.push('/radar/dashboard');
            } else {
                await signOut(auth);
                toast({
                    variant: "destructive",
                    title: "Acesso Negado",
                    description: "Esta área é exclusiva para clientes. Corretores e administradores devem usar o login principal.",
                });
                router.push('/login');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro de login",
                description: "Credenciais inválidas. Verifique seu e-mail e senha.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="bg-background-light font-display antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-neutral-dark">
            <div className="relative flex min-h-screen w-full flex-row">
                <div className="flex flex-col flex-1 bg-white relative z-10 w-full lg:w-1/2 lg:max-w-[600px] xl:max-w-[700px] border-r border-gray-100">
                    <div className="px-8 py-8 md:px-12 lg:px-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto" style={{ width: 'auto' }} />
                        </Link>
                        <a className="text-sm font-medium text-gray-400 hover:text-neutral-dark transition-colors hidden sm:block" href="/ajuda">
                            Precisa de ajuda?
                        </a>
                    </div>
                    <div className="flex flex-1 flex-col justify-center px-8 md:px-12 lg:px-16 py-10">
                        <div className="max-w-[420px] w-full mx-auto flex flex-col">
                            <div className="mb-10">
                                <h1 className="text-4xl font-extrabold text-neutral-dark tracking-tight mb-4">Acesse seu Radar</h1>
                                <p className="text-gray-500 text-lg leading-relaxed">Entre para visualizar seus imóveis salvos e recomendações exclusivas</p>
                            </div>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-neutral-dark ml-1" htmlFor="email">E-mail</Label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>mail</span>
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 rounded-xl bg-gray-50 border-transparent focus:bg-white border-2 focus:border-primary focus:ring-0 transition-all duration-200 text-neutral-dark placeholder:text-gray-400" id="email" placeholder="seu@email.com" required type="email"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label className="text-sm font-semibold text-neutral-dark" htmlFor="password">Senha</Label>
                                        <Link className="text-sm font-bold text-gray-400 hover:text-neutral-dark transition-colors" href="/esqueceu-a-senha">Esqueci minha senha</Link>
                                    </div>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>lock</span>
                                        <Input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-14 pl-12 pr-12 rounded-xl bg-gray-50 border-transparent focus:bg-white border-2 focus:border-primary focus:ring-0 transition-all duration-200 text-neutral-dark placeholder:text-gray-400" id="password" placeholder="••••••••" required type={showPassword ? 'text' : 'password'}
                                        />
                                        <button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-neutral-dark transition-colors focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-primary hover:bg-[#b0d132] text-neutral-dark font-extrabold rounded-xl shadow-glow transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 group mt-8" type="submit" disabled={isSubmitting || !auth}>
                                    <span className="text-lg">{isSubmitting ? 'Acessando...' : 'Acessar Radar'}</span>
                                    {!isSubmitting && <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: '22px' }}>arrow_forward</span>}
                                </Button>
                            </form>
                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-400">Novo por aqui?</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <Button asChild variant="outline" className="inline-flex items-center justify-center w-full h-14 px-6 font-bold text-neutral-dark transition-all duration-200 bg-white border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-gray-50">
                                    <Link href="/radar/nova">Criar minha conta agora</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-8 md:px-12 lg:px-16 text-center md:text-left">
                        <p className="text-xs text-gray-400 font-medium">© 2024 Oraora Radar. Todos os direitos reservados.</p>
                    </div>
                </div>
                <div className="hidden lg:flex flex-1 relative bg-neutral-dark overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <Image alt="Arquitetura moderna e luxuosa com linhas tecnológicas" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out scale-105" src={bgImage} fill />
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

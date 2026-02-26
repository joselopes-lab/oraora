
'use client';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useAuthContext, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SearchFilters from '@/components/SearchFilters';
import { PlaceHolderImages } from '@/lib/placeholder-images';


export default function PoliticaDePrivacidadePage() {
  const { user, userProfile, isReady } = useAuthContext();
  const router = useRouter();
  const auth = useAuth();
  const dashboardUrl = userProfile?.userType === 'client' ? '/radar/dashboard' : '/dashboard';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const firestore = useFirestore();
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const siteContentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
      [firestore]
  );
  const { data: siteData, isLoading: isSiteDataLoading } = useDoc<{ logoUrl?: string, footerSlogan?: string }>(siteContentRef);

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const handleSearch = (queryString: string) => {
    setIsSearchModalOpen(false); // Close the modal
    router.push(`/imoveis?${queryString}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] bg-white/90 px-4 md:px-6 backdrop-blur-md transition-all lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
            {/* Left side items */}
            <div className="flex items-center">
                {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 flex flex-col bg-white">
                             <SheetHeader>
                              <VisuallyHidden>
                                <SheetTitle>Menu Principal</SheetTitle>
                                <SheetDescription>Navegue pelas seções do site ou acesse sua conta.</SheetDescription>
                              </VisuallyHidden>
                            </SheetHeader>
                            <div className="p-6 border-b">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-2 p-4 text-lg font-semibold">
                                <Link href="/imoveis" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Imóveis
                                </Link>
                                <Link href="/corretor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">real_estate_agent</span>Para Corretores
                                </Link>
                                <Link href="/sobre" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">info</span>Sobre
                                </Link>
                                <Link href="/contato" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">mail</span>Contato
                                </Link>
                                 <Link href="/ajuda" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg py-3 px-4 hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined">help</span>Ajuda
                                </Link>
                            </nav>
                            <div className="mt-auto p-6 space-y-4 border-t">
                                {user ? (
                                    <>
                                      <div className='flex items-center gap-3'>
                                        <Avatar>
                                          <AvatarImage src={user.photoURL || ''} />
                                          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                          <div>
                                              <p className="text-sm font-bold text-foreground">{user.displayName}</p>
                                               <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                      </div>
                                      <Button asChild className="w-full h-12 text-base">
                                        <Link href={dashboardUrl}>Acessar Painel</Link>
                                      </Button>
                                       <Button variant="outline" className="w-full h-12 text-base" onClick={handleLogout}>Sair</Button>
                                    </>
                                ) : (
                                    <>
                                    <Button asChild variant="outline" className="w-full h-12 text-base">
                                        <Link href="/radar">
                                            <span className="material-symbols-outlined text-base mr-2">radar</span>
                                            Meu Radar
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full h-12 text-base">
                                        <Link href="/login">
                                           Sou Corretor
                                        </Link>
                                    </Button>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                 {/* Desktop Logo */}
                <Link className="hidden lg:flex items-center gap-3" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                </Link>
            </div>

            {/* Center items */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Mobile Logo */}
                <Link className="flex items-center gap-3 lg:hidden" href="/">
                    <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={120} height={30} className="h-[30px] w-auto" style={{ width: 'auto' }} />
                </Link>
                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                    <Link className="text-text-main transition hover:text-primary" href="/imoveis">Imóveis</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/corretor">Para Corretores</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/sobre">Sobre</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/contato">Contato</Link>
                    <Link className="text-text-main transition hover:text-primary" href="/ajuda">Ajuda</Link>
                </nav>
            </div>

            {/* Right side items */}
            <div className="flex items-center justify-end">
                <div className="hidden lg:flex items-center gap-2 md:gap-4">
                    {!isReady ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    ) : user && userProfile ? (
                        <div className="flex items-center gap-4">
                            <Button asChild>
                                <Link href={dashboardUrl} className='flex items-center gap-2'>
                                    <span className="material-symbols-outlined text-base">grid_view</span>
                                    Acessar Painel
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={handleLogout} className='flex items-center gap-2'>
                                <span className="material-symbols-outlined text-base">logout</span>
                                Sair
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 h-10 rounded-full px-6 transition">
                                <Link href="/login" className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                                    Corretor
                                </Link>
                            </Button>
                            <Button asChild className="h-10 rounded-full px-6 text-sm font-bold transition">
                                <Link href="/radar">
                                    <span className="material-symbols-outlined text-base mr-2">radar</span>
                                    Meu Radar
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
                 {/* Mobile Icons */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <button className="flex size-10 items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Busca de Imóveis</DialogTitle>
                                <DialogDescription>
                                    Utilize os filtros abaixo para encontrar o imóvel dos seus sonhos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <SearchFilters onSearch={handleSearch} />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Link href="/radar" className="flex size-10 items-center justify-center text-text-main">
                        <span className="material-symbols-outlined">radar</span>
                    </Link>
                </div>
            </div>
        </div>
      </header>
      <main className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-foreground mb-4 font-headline">Política de Privacidade</h1>
                <p className="text-muted-foreground">Última atualização: 26 de Julho de 2024</p>
            </div>
            <div className="prose prose-lg max-w-none mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h2>1. COMPROMISSO COM A PRIVACIDADE</h2>
                <p>O Oraora respeita a privacidade dos usuários e trata dados pessoais conforme a Lei nº 13.709/2018 (LGPD).</p>
                <br />
                <h2>2. DADOS COLETADOS</h2>
                <p>Podemos coletar:</p>
                <ul>
                    <li>Dados de cadastro (nome, e-mail, telefone);</li>
                    <li>Dados profissionais de corretores e construtoras;</li>
                    <li>Dados de navegação (IP, cookies, páginas acessadas);</li>
                    <li>Dados enviados em formulários de contato.</li>
                </ul>
                <br />
                <h2>3. FINALIDADE DO TRATAMENTO</h2>
                <p>Os dados são utilizados para:</p>
                <ul>
                    <li>Funcionamento da plataforma;</li>
                    <li>Conexão entre usuários;</li>
                    <li>Gestão de contas;</li>
                    <li>Comunicação e marketing;</li>
                    <li>Relatórios internos e inteligência de mercado (dados anonimizados);</li>
                    <li>Melhoria da experiência do usuário.</li>
                </ul>
                <br />
                <h2>4. COOKIES E TECNOLOGIAS</h2>
                <p>Utilizamos:</p>
                <ul>
                    <li>Google Analytics;</li>
                    <li>Google Ads;</li>
                    <li>Meta/Facebook Pixel;</li>
                    <li>Cookies de performance;</li>
                    <li>Cookies de marketing.</li>
                </ul>
                <p>O usuário pode gerenciar consentimentos via banner de cookies.</p>
                <br />
                <h2>5. PAPÉIS LGPD</h2>
                <p>Corretores e Construtoras: Controladores dos dados dos leads.</p>
                <p>OraOra:</p>
                <ul>
                    <li>Operador dos dados dos leads;</li>
                    <li>Controlador dos dados de cadastro, navegação e analytics da plataforma.</li>
                </ul>
                <br />
                <h2>6. COMPARTILHAMENTO</h2>
                <p>Os dados podem ser compartilhados:</p>
                <ul>
                    <li>Com corretores e construtoras responsáveis;</li>
                    <li>Com fornecedores de tecnologia;</li>
                    <li>Por obrigação legal ou ordem judicial.</li>
                </ul>
                <br />
                <h2>7. SEGURANÇA</h2>
                <p>Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados.</p>
                <br />
                <h2>8. DIREITOS DO TITULAR</h2>
                <p>O usuário pode solicitar:</p>
                <ul>
                    <li>Acesso;</li>
                    <li>Correção;</li>
                    <li>Exclusão;</li>
                    <li>Revogação de consentimento.</li>
                </ul>
                <p>Solicitações via <a href="mailto:contato@oraora.com.br">contato@oraora.com.br</a>.</p>
                <br />
                <h2>9. PRAZO DE ARMAZENAMENTO</h2>
                <p>Os dados são mantidos pelo tempo necessário para cumprir as finalidades legais e contratuais.</p>
                <br />
                <h2>10. ALTERAÇÕES</h2>
                <p>Esta Política pode ser atualizada a qualquer momento.</p>
                <br />
                <h2>11. FORO E LEI APLICÁVEL</h2>
                <p>Aplica-se exclusivamente a legislação brasileira, com foro em João Pessoa/PB.</p>
            </div>
        </div>
      </main>
      <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-8 w-auto" style={{ width: 'auto' }} />
                    </div>
                    {isSiteDataLoading ? (
                      <div className="space-y-2 max-w-xs">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <div
                        className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: siteData?.footerSlogan || 'Conectando pessoas aos seus sonhos. A plataforma mais moderna para comprar, vender e alugar imóveis no Brasil.' }}
                      />
                    )}
                    <div className="flex gap-4">
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">camera_alt</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                        <a className="text-gray-400 hover:text-dark-text transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Imóveis</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><a className="hover:text-primary transition-colors" href="/imoveis">Comprar</a></li>
                        <li><a className="hover:text-primary transition-colors" href="/imoveis">Lançamentos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Institucional</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link className="hover:text-primary transition-colors" href="/sobre">Sobre</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="/contato">Contato</Link></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link className="hover:text-primary transition-colors" href="/termos-de-uso">Termos de Uso</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="/politica-de-privacidade">Política de Privacidade</Link></li>
                        <li><a className="hover:text-primary transition-colors" href="#">Política de Cookies</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">© 2025 Oraora Tecnologia. Todos os direitos reservados. CNPJ: 64.052.552/0001-26</p>
                <div className="flex items-center gap-4">
                     <Button asChild variant="ghost" className="text-sm font-medium text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200">
                        <Link href="/login" className="flex items-center gap-2">
                           <span className="material-symbols-outlined">manage_accounts</span>
                           Área do corretor
                        </Link>
                    </Button>
                    <Link href="/corretor" className="text-xs text-gray-400 hover:text-primary transition-colors">Desenvolvido por <strong>Oraora</strong></Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

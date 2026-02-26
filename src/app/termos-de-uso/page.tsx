
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


export default function TermosDeUsoPage() {
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
                <h1 className="text-4xl font-black text-foreground mb-4 font-headline">Termos de Uso</h1>
                <p className="text-muted-foreground">Última atualização: 26 de Julho de 2024</p>
            </div>
            <div className="prose prose-lg max-w-none mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h2>1. IDENTIFICAÇÃO</h2>
                <p>Este site e a plataforma Oraora são operados por ORAORA SOLUÇÕES DIGITAIS INOVA SIMPLES (I.S.), pessoa jurídica inscrita no CNPJ nº 64.052.552/0001-26, com sede na Rua Rui Barbosa, nº 1486, Centro, Foz do Iguaçu/PR, e e-mail de contato <a href="mailto:contato@oraora.com.br">contato@oraora.com.br</a>, doravante denominada “OraOra”.</p>
                <br />
                <h2>2. ACEITAÇÃO DOS TERMOS</h2>
                <p>Ao acessar, navegar, cadastrar-se ou utilizar qualquer funcionalidade do site OraOra, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a Política de Privacidade.</p>
                <p>Caso não concorde, o usuário deve se abster de utilizar a plataforma.</p>
                <br />
                <h2>3. O QUE É O ORAORA</h2>
                <p>O OraOra é um ecossistema digital imobiliário, que atua como:</p>
                <ul>
                    <li>Plataforma tecnológica (SaaS);</li>
                    <li>Canal de distribuição de informações imobiliárias;</li>
                    <li>Hub de visibilidade, curadoria e conexão entre corretores, construtoras e o público final.</li>
                </ul>
                <p>O OraOra não é imobiliária, não intermedeia negócios imobiliários, não participa de negociações, não recebe comissões e não firma contratos de compra, venda, locação ou promessa de imóveis.</p>
                <p>Toda e qualquer relação comercial ocorre diretamente entre usuários (corretores, construtoras e público final).</p>
                <br />
                <h2>4. USUÁRIOS DA PLATAFORMA</h2>
                <p>A plataforma pode ser utilizada por:</p>
                <h3>4.1 Público Final</h3>
                <p>Pode navegar livremente sem cadastro.</p>
                <p>Algumas funcionalidades exigem criação de conta.</p>
                <h3>4.2 Corretores de Imóveis</h3>
                <p>Devem criar conta própria e comprovar registro ativo no CRECI.</p>
                <p>São responsáveis pelas informações, conteúdos e imóveis divulgados.</p>
                <h3>4.3 Construtoras</h3>
                <p>Possuem conta própria e são responsáveis pelas informações de seus empreendimentos.</p>
                <br />
                <h2>5. RESPONSABILIDADE SOBRE IMÓVEIS E CONTEÚDOS</h2>
                <p>As informações dos imóveis são de responsabilidade exclusiva dos corretores e/ou construtoras.</p>
                <p>O OraOra atua apenas como plataforma de exibição, organização, curadoria e distribuição de conteúdo.</p>
                <p>O OraOra não garante veracidade, disponibilidade, valores, condições ou atualização dos imóveis anunciados.</p>
                <br />
                <h2>6. MODERAÇÃO, SUSPENSÃO E EXCLUSÃO</h2>
                <p>O OraOra se reserva o direito de, a qualquer momento, sem aviso prévio:</p>
                <ul>
                    <li>Remover anúncios;</li>
                    <li>Excluir conteúdos;</li>
                    <li>Suspender ou encerrar contas;</li>
                </ul>
                <p>Sempre que houver:</p>
                <ul>
                    <li>Violação destes Termos;</li>
                    <li>Uso indevido da plataforma;</li>
                    <li>Informações falsas ou ilegais;</li>
                    <li>Descumprimento de normas legais ou éticas.</li>
                </ul>
                <br />
                <h2>7. LEADS E CONTATOS</h2>
                <p>Os contatos enviados pelo público final são direcionados diretamente ao corretor ou construtora responsável.</p>
                <p>O OraOra mantém cópia dos dados para fins operacionais, legais e de melhoria da plataforma.</p>
                <p>O corretor/construtora atua como <strong>Controlador</strong> dos dados dos leads.</p>
                <p>O OraOra atua como <strong>Operador</strong> desses dados, nos termos da LGPD.</p>
                <br />
                <h2>8. PLANOS, PAGAMENTOS E CANCELAMENTO</h2>
                <p>O OraOra opera em modelo SaaS com planos mensais e renovação automática.</p>
                <p>O cancelamento pode ser solicitado a qualquer momento, produzindo efeitos ao final do ciclo vigente.</p>
                <p>Não há reembolso de valores já pagos.</p>
                <p>O OraOra pode alterar preços, planos e funcionalidades mediante aviso prévio.</p>
                <p>Novos planos, produtos ou serviços pagos podem ser criados a qualquer tempo.</p>
                <br />
                <h2>9. PROPRIEDADE INTELECTUAL</h2>
                <p>Todo o conteúdo da plataforma (marca, layout, sistema, textos, códigos, funcionalidades) pertence ao OraOra ou a seus licenciantes, sendo vedada qualquer reprodução sem autorização.</p>
                <br />
                <h2>10. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                <p>O OraOra não se responsabiliza por:</p>
                <ul>
                    <li>Negociações imobiliárias;</li>
                    <li>Atos praticados por usuários;</li>
                    <li>Perdas financeiras decorrentes de contratos entre terceiros;</li>
                    <li>Indisponibilidade temporária da plataforma.</li>
                </ul>
                <br />
                <h2>11. ALTERAÇÕES DOS TERMOS</h2>
                <p>Estes Termos podem ser alterados a qualquer momento. O uso contínuo da plataforma implica aceitação das novas versões.</p>
                <br />
                <h2>12. FORO</h2>
                <p>Fica eleito o foro da Comarca de João Pessoa/PB, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
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

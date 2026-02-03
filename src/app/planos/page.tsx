'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';

export default function PaymentPage() {
  const { user } = useUser();
  
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background text-foreground font-body overflow-x-hidden antialiased">
      {/* Top Navigation */}
      <header className="bg-card border-b border-solid border-border sticky top-0 z-50">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="size-8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">real_estate_agent</span>
            </div>
            <h2 className="text-foreground text-xl font-bold leading-tight tracking-[-0.015em] font-headline">Oraora</h2>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
            <nav className="flex items-center gap-9">
              <Link className="text-foreground text-sm font-medium hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
              <Link className="text-foreground text-sm font-medium hover:text-primary transition-colors" href="#">Imóveis</Link>
              <Link className="text-foreground text-sm font-medium hover:text-primary transition-colors" href="#">CRM</Link>
            </nav>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted overflow-hidden border border-border">
                {user?.photoURL ? (
                  <Image alt="Profile Picture" className="w-full h-full object-cover" src={user.photoURL} width={32} height={32} />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-bold">{user?.displayName || 'Usuário'}</span>
            </div>
          </div>
          <div className="md:hidden">
            <span className="material-symbols-outlined cursor-pointer">menu</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight font-headline">Complete sua Assinatura</h1>
          <p className="text-muted-foreground text-base">Confirme o plano escolhido e preencha os dados para ativar sua conta.</p>
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Plans & Payment */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Plan Selection Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Selecione seu Plano</h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">Cobrança Mensal</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <Card className="group relative flex flex-col gap-4 p-5 cursor-pointer hover:border-gray-400 transition-all opacity-70 hover:opacity-100">
                  <div>
                    <h4 className="text-foreground font-bold">Grátis</h4>
                    <p className="text-2xl font-black mt-1">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  </div>
                  <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base">check</span> Até 5 imóveis</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base">check</span> Site básico</li>
                  </ul>
                  <div className="mt-auto pt-2">
                    <Button variant="outline" className="w-full text-xs font-bold">Selecionar</Button>
                  </div>
                </Card>

                {/* Basic Plan */}
                <Card className="group relative flex flex-col gap-4 p-5 cursor-pointer hover:border-gray-400 transition-all opacity-70 hover:opacity-100">
                  <div>
                    <h4 className="text-foreground font-bold">Básico</h4>
                    <p className="text-2xl font-black mt-1">R$ 99<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  </div>
                  <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base">check</span> Até 50 imóveis</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base">check</span> Site personalizado</li>
                  </ul>
                  <div className="mt-auto pt-2">
                    <Button variant="outline" className="w-full text-xs font-bold">Selecionar</Button>
                  </div>
                </Card>

                {/* Premium Plan (Selected) */}
                <Card className="group relative flex flex-col gap-4 p-5 cursor-pointer border-2 border-primary bg-primary/5 shadow-md transform scale-[1.02] md:scale-105 z-10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Recomendado</div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-foreground font-bold">Premium</h4>
                      <p className="text-2xl font-black mt-1">R$ 199<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                    </div>
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <ul className="flex flex-col gap-2 text-xs text-foreground font-medium">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary font-bold">check</span> Imóveis ilimitados</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary font-bold">check</span> Site premium</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary font-bold">check</span> CRM avançado</li>
                  </ul>
                  <div className="mt-auto pt-2">
                    <Button className="w-full text-xs font-bold shadow-sm">Selecionado</Button>
                  </div>
                </Card>
              </div>
            </Card>

            {/* Payment Method Section */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-6">Método de Pagamento</h3>
              <div className="flex border-b border-border gap-6 mb-8 overflow-x-auto">
                <button className="flex items-center gap-2 border-b-[3px] border-foreground pb-3 px-1 min-w-max transition-all">
                  <span className="material-symbols-outlined text-foreground" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  <span className="text-foreground text-sm font-bold">Cartão de Crédito</span>
                </button>
                <button className="flex items-center gap-2 border-b-[3px] border-transparent pb-3 px-1 min-w-max text-muted-foreground hover:text-foreground transition-all">
                  <span className="material-symbols-outlined">qr_code_2</span>
                  <span className="text-sm font-bold">Pix</span>
                </button>
                <button className="flex items-center gap-2 border-b-[3px] border-transparent pb-3 px-1 min-w-max text-muted-foreground hover:text-foreground transition-all">
                  <span className="material-symbols-outlined">receipt_long</span>
                  <span className="text-sm font-bold">Boleto</span>
                </button>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <Label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Número do Cartão</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground material-symbols-outlined">credit_card</span>
                    <Input className="w-full pl-12 pr-4 py-3 bg-muted" placeholder="0000 0000 0000 0000" type="text" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-50 h-6">
                      <Image alt="Mastercard" className="h-full w-auto object-contain" width={32} height={20} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDeB4LhCKT16LrQpdxEPt0KR274xvVCIdUiG8IbAtLXe8C57924EmDeaAzVlZCm4GhBQ_Nv_KW9MFrv6Ki1uBxFYFzT3WxpmfqpRtmI5k8sRYbNgk7j2jszA636cr9-z2_IY7PlrTg7vutZ2aa5_9O6iPw7gP_neqOykOKXvxmpbOKaFh5nF_F-jmOpgU4vpbKLshrHq_qvPQWjJU1_Ij5b78icY32fIO2RFQwBhMIDQVvSIDBjvNvxMeZ7vX_MNb-vCA1nThH_yY" data-ai-hint="credit card logo"/>
                      <Image alt="Visa" className="h-full w-auto object-contain" width={32} height={20} src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-xypS_i1433f7917TVMpqigXdFHo2PxFytYhIkm46ZS2Wsoye4xM_QFX0-2e6HlahHeNbpaLuGSWEsguZWejippWXu4mJEbfThujpunHcQgmOq9dNmuJuPwcD960XYQmUa7aT1hO4Aifhe1k3q7i0zjr5cF-Cy-Dfl4sByx0qO14qCTW7cX44rVy3o9sZKboHV8hOaLrPN4nihIzz_gLz5MRXOKn1BpS8yaXQpsP1JQ4G-X929JbNp4CUEYWAE0awsqSC1TaUZiI" data-ai-hint="credit card logo"/>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nome no Cartão</Label>
                  <Input className="w-full px-4 py-3 bg-muted" placeholder="COMO ESTÁ NO CARTÃO" type="text" />
                </div>
                <div className="col-span-1">
                  <Label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Validade</Label>
                  <Input className="w-full px-4 py-3 bg-muted" placeholder="MM/AA" type="text" />
                </div>
                <div className="col-span-1">
                  <Label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">CVV</Label>
                  <div className="relative">
                    <Input className="w-full px-4 py-3 bg-muted" placeholder="123" type="text" />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-help" title="Código de 3 dígitos no verso">help</span>
                  </div>
                </div>
              </form>
              <div className="mt-6 flex items-center gap-2 text-muted-foreground text-xs">
                <span className="material-symbols-outlined text-base">lock</span>
                <p>Seus dados de pagamento são processados de forma segura e criptografada.</p>
              </div>
            </Card>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:w-[380px] flex flex-col gap-6">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-6">Resumo do Pedido</h3>
              <div className="flex flex-col gap-4 border-b border-border pb-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">Plano Premium</span>
                  <span className="text-foreground font-bold">R$ 199,00</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Cobrança</span>
                  <span>Mensal</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary font-medium">
                  <span>Desconto de boas-vindas</span>
                  <span>- R$ 0,00</span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-6">
                <span className="text-muted-foreground font-medium">Total a pagar</span>
                <div className="text-right">
                  <span className="block text-3xl font-black text-foreground tracking-tight">R$ 199,00</span>
                  <span className="text-xs text-muted-foreground">Renovação automática</span>
                </div>
              </div>
              <Button asChild className="w-full font-bold py-4 h-auto rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 group">
                <Link href="/dashboard">
                  Confirmar e Pagar
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4 leading-relaxed">
                Ao confirmar, você concorda com nossos <a className="underline hover:text-foreground" href="#">Termos de Uso</a> e <a className="underline hover:text-foreground" href="#">Política de Privacidade</a>.
              </p>
            </Card>
            <Card className="bg-muted/30 p-5 flex items-start gap-4">
              <div className="bg-card p-2 rounded-lg border border-border shadow-sm text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Precisa de ajuda?</h4>
                <p className="text-xs text-muted-foreground mt-1">Fale com nosso time comercial ou chame no suporte.</p>
                <a className="text-xs font-bold text-foreground mt-2 inline-block border-b border-foreground hover:text-primary hover:border-primary transition-colors" href="#">Entrar em contato</a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, CreditCard, Lock, Star } from 'lucide-react';
import Image from 'next/image';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceAnnual?: number;
  features: string[];
}

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    plan: Plan | null;
    billingCycle: 'monthly' | 'annual';
}

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function GooglePayIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path d="M20.21,10.22A8.34,8.34,0,0,0,12,8.1a8.34,8.34,0,0,0-8.22,8.1,8.34,8.34,0,0,0,8.22,8.1,8.34,8.34,0,0,0,8.22-8.1" fill="#4285f4"/>
            <path d="M12,4A8.1,8.1,0,0,0,3.9,12.1a8.1,8.1,0,0,0,8.1,8.1,8.1,8.1,0,0,0,8.1-8.1A8.1,8.1,0,0,0,12,4Zm0,14.4A6.3,6.3,0,0,1,5.7,12.1a6.3,6.3,0,0,1,6.3-6.3,6.3,6.3,0,0,1,6.3,6.3A6.3,6.3,0,0,1,12,18.4Z" fill="#34a853"/>
            <path d="M15.4,12.1a3.3,3.3,0,0,0-3.3-3.3,3.3,3.3,0,0,0-3.4,3.3,3.3,3.3,0,0,0,3.4,3.3A3.3,3.3,0,0,0,15.4,12.1Zm-3.3,1.8a1.8,1.8,0,0,1-1.8-1.8,1.8,1.8,0,0,1,1.8-1.8,1.8,1.8,0,0,1,1.8,1.8A1.8,1.8,0,0,1,12.1,13.9Z" fill="#fbbc05"/>
            <path d="M12.1,10.3a1.8,1.8,0,0,0-1.8,1.8,1.8,1.8,0,0,0,1.8,1.8,1.8,1.8,0,0,0,1.8-1.8A1.8,1.8,0,0,0,12.1,10.3Z" fill="#ea4335"/>
        </svg>
    )
}

export default function PaymentDialog({ isOpen, onOpenChange, plan, billingCycle }: PaymentDialogProps) {
    if (!plan) return null;

    const price = billingCycle === 'annual' && plan.priceAnnual ? plan.priceAnnual : plan.price;
    const period = billingCycle === 'annual' ? 'ano' : 'mês';
    const originalPrice = billingCycle === 'annual' ? plan.price * 12 : price;
    const discount = billingCycle === 'annual' && plan.priceAnnual ? originalPrice - plan.priceAnnual : 0;
    
    const today = new Date();
    const renewalDate = new Date();
    if(billingCycle === 'annual'){
        renewalDate.setFullYear(today.getFullYear() + 1);
    } else {
        renewalDate.setMonth(today.getMonth() + 1);
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Pagamento do Plano {plan.name}</DialogTitle>
                    <DialogDescription>Preencha os dados do seu cartão para finalizar a assinatura.</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2">
                    {/* Left side */}
                    <div className="p-8 md:p-10 bg-muted/50 rounded-l-lg">
                        <div className="flex items-center gap-4 mb-8">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                                <ArrowLeft className="h-5 w-5"/>
                            </Button>
                            <h2 className="text-2xl font-bold">Upgrade para {plan.name}</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Ciclo de cobrança</span>
                                <Badge variant="secondary">{billingCycle === 'annual' ? 'Anual' : 'Mensal'}</Badge>
                            </div>
                            
                            <div className="border-t pt-4 space-y-3">
                                {billingCycle === 'annual' && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{formatCurrency(plan.price)} x 12 meses</span>
                                        <span>{formatCurrency(originalPrice)}</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Desconto anual</span>
                                        <span>-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="border-t pt-4 flex justify-between items-center text-lg font-semibold">
                                <span>Total hoje</span>
                                <span>{formatCurrency(price)}</span>
                            </div>
                        </div>

                         <div className="mt-10 p-6 rounded-lg bg-background border text-center">
                            <p className="italic">"Esta plataforma me deu as ferramentas para alcançar um novo patamar de vendas. Indispensável!"</p>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <Image src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Foto de um corretor" width={40} height={40} className="rounded-full" />
                                <div>
                                    <p className="font-semibold">Viktor Baltus</p>
                                    <p className="text-xs text-muted-foreground">Corretor de Imóveis</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side */}
                    <div className="p-8 md:p-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Detalhes do Pagamento</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Lock className="h-4 w-4"/>
                                Pagamento Seguro
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-16 flex items-center justify-center gap-2 border-primary ring-2 ring-primary">
                                    <CreditCard />
                                    Cartão
                                </Button>
                                <Button variant="outline" className="h-16 flex items-center justify-center gap-2 text-muted-foreground">
                                    <GooglePayIcon />
                                    Google Pay
                                </Button>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Nome no Cartão</Label>
                                <Input placeholder="Nome como no cartão" />
                            </div>
                            <div className="space-y-2">
                                <Label>Número do Cartão</Label>
                                <Input placeholder="**** **** **** ****" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Validade</Label>
                                    <Input placeholder="MM/AA" />
                                </div>
                                <div className="space-y-2">
                                    <Label>CVV</Label>
                                    <Input placeholder="***" />
                                </div>
                            </div>
                            
                            <Button className="w-full h-12 text-lg" size="lg">
                                <Lock className="mr-2 h-5 w-5"/>
                                Pagar {formatCurrency(price)}
                            </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground text-center mt-6 space-y-2">
                            <p>Sua assinatura será renovada em {renewalDate.toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'})}. Você pode cancelar a qualquer momento.</p>
                            <p>Pagamentos processados por <span className="font-semibold text-foreground">Stripe</span>. <a href="#" className="underline">Termos</a> | <a href="#" className="underline">Privacidade</a></p>
                             <div className="flex justify-center items-center gap-2 pt-2">
                                <Star className="h-4 w-4 text-amber-400" fill="currentColor"/>
                                <span>Trustpilot | Reviews 924 | 4.7</span>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

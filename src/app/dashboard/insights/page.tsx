'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InsightsPage() {
    return (
        <main className="flex-grow flex items-center justify-center px-4 py-12">
            <div className="max-w-xl w-full">
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e5e7eb] p-8 md:p-12 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                            <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        </div>
                    </div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-text-main mb-4 leading-tight">
                        Funcionalidade não disponível no seu plano
                    </h1>
                    <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-10 max-w-md mx-auto">
                        Parece que você tentou acessar um recurso exclusivo de nossos planos superiores. Faça um upgrade agora para desbloquear ferramentas avançadas de inteligência e automação.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-text-main font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                             <Link href="/dashboard/loja">
                                Ver Planos e Preços
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-text-secondary font-semibold rounded-xl transition-all flex items-center justify-center">
                             <Link href="/dashboard">
                                Voltar para o Dashboard
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-8 grayscale opacity-50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                            <span className="text-xs font-semibold uppercase tracking-widest">IA Advanced</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                            <span className="text-xs font-semibold uppercase tracking-widest">Automation</span>
                        </div>
                    </div>
                </div>
                <p className="text-center text-text-secondary/60 text-xs mt-8">
                    Dúvidas sobre os planos? <a className="underline hover:text-primary transition-colors" href="#">Fale com nosso suporte</a>
                </p>
            </div>
        </main>
    );
}

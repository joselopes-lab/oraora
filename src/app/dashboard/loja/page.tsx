'use client';

import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useDoc, useFirebase, useMemoFirebase, useAuthContext } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as catalogService from '@/lib/themeCatalog/catalogService';
import { PlayCircle, Eye, ShoppingCart, LayoutGrid } from 'lucide-react';

const layoutSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    price: z.coerce.number().min(0, "O preço deve ser positivo"),
    description: z.string().min(1, "A descrição é obrigatória"),
    imageUrl: z.string().url("A URL da imagem é inválida").optional().or(z.literal('')),
});

type LayoutFormData = z.infer<typeof layoutSchema>;

type Broker = {
    layoutId?: string;
    slug?: string;
}

export default function LayoutStorePage() {
    const { firestore, user } = useFirebase();
    const { userProfile, isReady } = useAuthContext();
    const { toast } = useToast();

    // 1. Fetch layouts via Catalog Service (Unificação de Manifest + Comercial)
    const allThemes = useMemo(() => catalogService.getAllThemes(), []);

    // 2. Fetch broker-specific profile (to check active layout)
    const brokerDocRef = useMemoFirebase(
        () => (firestore && user?.uid && userProfile?.userType === 'broker' && isReady ? doc(firestore, 'brokers', user.uid) : null), 
        [firestore, user?.uid, userProfile?.userType, isReady]
    );
    const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<Broker>(brokerDocRef);

    const form = useForm<LayoutFormData>({
        resolver: zodResolver(layoutSchema),
        defaultValues: {
            name: "",
            price: 0,
            description: "",
            imageUrl: "",
        },
    });

    const handleSelectLayout = async (layoutId: string) => {
        if (!firestore || !user?.uid || userProfile?.userType !== 'broker') return;

        const brokerRef = doc(firestore, 'brokers', user.uid);
        try {
            await setDocumentNonBlocking(brokerRef, { layoutId }, { merge: true });
            toast({
                title: "Layout Selecionado!",
                description: "Seu site público agora usará este novo layout.",
            });
        } catch (error) {
            console.error("Erro ao selecionar layout:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível selecionar o layout.",
            });
        }
    };

    const isLoading = isBrokerLoading || !isReady;
    const isBroker = userProfile?.userType === 'broker';

    return (
        <div className="text-left animate-in fade-in duration-500">
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Painel</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main font-bold">Loja de Layouts</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-main uppercase">Loja de Layouts</h1>
                    <p className="text-text-secondary max-w-2xl mt-1">Escolha o design perfeito para o seu site imobiliário. Templates premium otimizados para conversão.</p>
                </div>
            </div>

            <div className="space-y-12">
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl border border-slate-100 h-96 animate-pulse" />
                            ))
                        ) : allThemes.map(theme => {
                            const isSelected = isBroker && brokerProfile?.layoutId === theme.id;
                            const isFree = theme.commercial.price === 0;

                            return (
                                <div key={theme.id} className={cn(
                                    "bg-white rounded-3xl border shadow-soft overflow-hidden flex flex-col hover:shadow-xl transition-all duration-500 group",
                                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-slate-100"
                                )}>
                                    <div className="relative h-64 bg-slate-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-4">
                                            <Button asChild className="bg-primary text-slate-950 font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg border-none hover:scale-[1.05] transition-transform">
                                                <Link href={`/dashboard/loja/preview/${theme.id}`}>
                                                    <PlayCircle className="size-4 mr-2" />
                                                    Visualizar Demo
                                                </Link>
                                            </Button>
                                            <Button variant="secondary" asChild className="bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl hover:scale-[1.05] transition-transform">
                                                <Link href={`/sites/${brokerProfile?.slug}`} target="_blank">
                                                    <Eye className="size-4 mr-2" />
                                                    Live Site
                                                </Link>
                                            </Button>
                                        </div>

                                        {theme.commercial.thumbnail ? (
                                            <Image 
                                                alt={theme.commercial.displayName} 
                                                className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110" 
                                                src={theme.commercial.thumbnail} 
                                                fill
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <LayoutGrid className="size-12 text-slate-200" />
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                            {theme.commercial.featured && (
                                                <Badge className="bg-primary text-slate-900 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg">
                                                    Destaque
                                                </Badge>
                                            )}
                                            {theme.commercial.premium && (
                                                <Badge className="bg-slate-900 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-lg">
                                                    PREMIUM
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col text-left">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{theme.commercial.displayName}</h3>
                                            <Badge variant="outline" className="border-slate-200 text-[8px] font-black uppercase text-slate-400">
                                                v{theme.technical.manifest.version}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-8">{theme.commercial.description}</p>
                                        
                                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Investimento</span>
                                                <p className="text-2xl font-black text-slate-900">
                                                    {isFree ? 'Grátis' : theme.commercial.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isBroker && (
                                                    <Button 
                                                        onClick={() => handleSelectLayout(theme.id)} 
                                                        disabled={isSelected}
                                                        className={cn(
                                                            "h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                                            isSelected ? "bg-slate-100 text-slate-400" : "bg-primary text-slate-900 shadow-glow hover:brightness-110 active:scale-95"
                                                        )}
                                                    >
                                                        {isSelected ? 'INSTALADO' : isFree ? 'INSTALAR AGORA' : 'COMPRAR TEMA'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

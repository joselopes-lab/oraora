
'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


const layoutSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    price: z.coerce.number().min(0, "O preço deve ser positivo"),
    description: z.string().min(1, "A descrição é obrigatória"),
    imageUrl: z.string().url("A URL da imagem é inválida").optional().or(z.literal('')),
});

type LayoutFormData = z.infer<typeof layoutSchema>;

type Layout = {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    badge?: string;
    tags?: string[];
};

type User = {
    userType: 'admin' | 'broker' | 'constructor';
};

type Broker = {
    layoutId?: string;
    slug?: string;
}

export default function LayoutStorePage() {
    const { firestore, user: authUser, isUserLoading: isAuthLoading } = useFirebase();
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(
        useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser])
    );
     // Adicionado 'authUser' como dependência para garantir que a query não rode sem usuário
    const { data: layouts, isLoading: areLayoutsLoading } = useCollection<Layout>(
        useMemoFirebase(() => (firestore && authUser ? collection(firestore, 'layouts') : null), [firestore, authUser])
    );
    const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<Broker>(
        useMemoFirebase(() => (firestore && authUser && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', authUser.uid) : null), [firestore, authUser, userProfile])
    );

    const { toast } = useToast();
    const form = useForm<LayoutFormData>({
        resolver: zodResolver(layoutSchema),
        defaultValues: {
            name: "",
            price: 0,
            description: "",
            imageUrl: "",
        },
    });

    const onSubmit = async (data: LayoutFormData) => {
        if (!firestore) return;
        const layoutsCollection = collection(firestore, "layouts");
        await addDocumentNonBlocking(layoutsCollection, data);
        toast({
            title: "Layout Adicionado!",
            description: `O layout "${data.name}" foi cadastrado com sucesso.`,
        });
        form.reset();
    };

    const handleSelectLayout = async (layoutId: string) => {
        if (!firestore || !authUser || userProfile?.userType !== 'broker') return;

        const brokerDocRef = doc(firestore, 'brokers', authUser.uid);
        try {
            await setDocumentNonBlocking(brokerDocRef, { layoutId }, { merge: true });
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

    const isLoading = isAuthLoading || isProfileLoading || isBrokerLoading || areLayoutsLoading;
    const isAdmin = userProfile?.userType === 'admin';
    const isBroker = userProfile?.userType === 'broker';

    const urbanPadraoLayout: Layout = {
        id: 'urban-padrao',
        name: 'Urban Padrão',
        price: 0,
        description: 'Minimalismo moderno com foco na experiência do usuário móvel. Ideal para corretores independentes e dinâmicos.',
        tags: ['Moderno', 'Clean', 'Rápido'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMMoHyFKw2DksNaiMJnjn9RTWYQXgprmYJeuM0HAijjD00G8ZRK5AclD5FE_fG59nsTIkBoq78olATGgVMJhQ8iIeBeGyrlFE753aLqieop9Vlhavc96iJgUKiNjJFoqGRTtiYngQOlaj38Ee2LMVsd7mZdJtFxnW6O1_Otj7d9VIXNOG0FNihlDpNtTwgY4fwRw6ElNwqN96HlL4OpVlppPSSEvBst8sEbnWEuJCmGxV8n6sS_7slmJgL86CHwEIYGFGGiFpchnw',
        badge: 'Novo'
    };

    const livingLayout: Layout = {
        id: 'living',
        name: 'Living',
        price: 0,
        description: 'Um layout sofisticado e elegante, ideal para imóveis de alto padrão e uma experiência visualmente rica.',
        tags: ['Elegante', 'Sofisticado', 'Visual'],
        imageUrl: 'https://images.unsplash.com/photo-1613553423758-d84269955d8f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        badge: 'Novo'
    };
    
    const domusLayout: Layout = {
        id: 'domus',
        name: 'Domus',
        price: 0,
        description: 'Um layout moderno e elegante, com foco em curadoria e experiência visual, ideal para apresentar imóveis de alto padrão.',
        tags: ['Moderno', 'Curadoria', 'Elegante'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlzbiXYY0BpchRCPRPqvTEk5BWBLgaa5EubTInww9SGxsUFqt1kdnrgrvROu_1uGCm_zf9dbSwIXVo9j14bfmkXYsdWizi8b4n-nxIvOTCFKn_-3cmrodAG0oMOMJS_BkQFTbOgsaTzlk_2ta7QqGoKM0benjx5savhNz0Q9NukbSP9UFGZEOkILVFfG35YLUD52Dw6EDPI5VeqxQyCNnn9-fqZ74F6pWzXw9T9PIfhaRPJyrLfKDt38xm-twOo6v8OrV1r77JMow',
        badge: 'Novo'
    };

    const baseLayouts = [urbanPadraoLayout, livingLayout, domusLayout];
    const allLayouts = areLayoutsLoading ? baseLayouts : [...baseLayouts, ...(layouts || [])];


    return (
        <>
            <nav className="flex mb-6 text-sm font-medium text-text-secondary">
                <Link className="hover:text-text-main" href="/dashboard">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-text-main">Loja</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">Loja de Layouts</h1>
                    <p className="text-text-secondary max-w-2xl">Escolha o design perfeito para o seu site imobiliário. Navegue por templates premium otimizados para conversão.</p>
                </div>
            </div>
            <div className="space-y-8">
                 {isAdmin && (
                    <section className="bg-white rounded-xl border border-card-border shadow-sm p-6 md:p-8">
                        <h3 className="text-lg font-bold text-text-main mb-4 border-b pb-4">Adicionar Novo Layout</h3>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4">
                                <Input {...form.register("name")} placeholder="Nome do Layout" />
                                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                                <Input {...form.register("price")} placeholder="Preço" type="number" step="0.01" />
                                {form.formState.errors.price && <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>}
                            </div>
                            <div className="space-y-4">
                                <Textarea {...form.register("description")} placeholder="Descrição do Layout" rows={3}/>
                                {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
                                <Input {...form.register("imageUrl")} placeholder="URL da Imagem de Preview" />
                                {form.formState.errors.imageUrl && <p className="text-xs text-red-500">{form.formState.errors.imageUrl.message}</p>}
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Salvando..." : "Salvar Layout"}
                                </Button>
                            </div>
                        </form>
                    </section>
                 )}
                <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="flex-1 w-full relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">search</span>
                            <input className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-card-border rounded-lg text-text-main placeholder-text-secondary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm" placeholder="Buscar por nome, estilo ou categoria..." type="text" />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <button className="px-4 py-2 rounded-full bg-primary text-text-main font-bold text-sm shadow-sm whitespace-nowrap hover:bg-primary-hover transition-colors">
                                Todos
                            </button>
                            <button className="px-4 py-2 rounded-full bg-white border border-card-border text-text-secondary font-medium text-sm whitespace-nowrap hover:border-primary hover:text-text-main transition-colors">
                                Lançamentos
                            </button>
                            <button className="px-4 py-2 rounded-full bg-white border border-card-border text-text-secondary font-medium text-sm whitespace-nowrap hover:border-primary hover:text-text-main transition-colors">
                                Minimalistas
                            </button>
                            <button className="px-4 py-2 rounded-full bg-white border border-card-border text-text-secondary font-medium text-sm whitespace-nowrap hover:border-primary hover:text-text-main transition-colors">
                                Premium
                            </button>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allLayouts.map(layout => {
                            const isSelected = isBroker && brokerProfile?.layoutId === layout.id;
                            return (
                                <div key={layout.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-card-border'}`}>
                                    <div className="relative h-48 bg-gray-100 overflow-hidden border-b border-card-border">
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10"></div>
                                        {layout.imageUrl ? (
                                            <Image alt="Layout Preview" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" src={layout.imageUrl} fill/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-6xl text-gray-300 group-hover:scale-110 transition-transform duration-500">grid_view</span>
                                            </div>
                                        )}
                                        {layout.badge && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-wide ${layout.badge === 'Novo' ? 'bg-primary text-text-main' : 'bg-white/90 backdrop-blur-sm text-text-main'}`}>
                                                {layout.badge}
                                            </span>
                                        </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-text-main">{layout.name}</h3>
                                        </div>
                                        <p className="text-sm text-text-secondary line-clamp-2 mb-4">{layout.description}</p>
                                        <div className="mt-auto pt-4 border-t border-card-border">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="text-xl font-bold text-text-main">
                                                    {layout.price > 0 ? `R$ ${layout.price.toFixed(2).replace('.', ',')}` : 'Grátis'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                 {isBroker && (
                                                    <Button 
                                                        onClick={() => handleSelectLayout(layout.id)} 
                                                        disabled={isSelected || isBrokerLoading}
                                                        size="sm"
                                                        className={`py-2 px-4 rounded-lg font-bold text-sm transition-colors shadow-sm ${isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-text-main hover:bg-primary-hover shadow-primary/20'}`}
                                                    >
                                                        {isSelected ? 'Selecionado' : 'Selecionar'}
                                                    </Button>
                                                )}
                                                {isBroker && layout.id === 'urban-padrao' && (
                                                    <>
                                                        <Button asChild variant="outline" size="icon" title="Editar Cores" className="size-9 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors">
                                                            <Link href="/dashboard/meu-site/cores">
                                                                <span className="material-symbols-outlined text-base">palette</span>
                                                            </Link>
                                                        </Button>
                                                        <Button asChild variant="outline" size="icon" title="Gerenciar Imagens" className="size-9 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors">
                                                            <Link href="/dashboard/meu-site/imagens">
                                                                <span className="material-symbols-outlined text-base">image</span>
                                                            </Link>
                                                        </Button>
                                                    </>
                                                )}
                                                {!isBroker && (
                                                     <Button size="sm" className="py-2 px-4 rounded-lg bg-primary text-text-main font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20">
                                                        Detalhes
                                                    </Button>
                                                )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </>
    )
}

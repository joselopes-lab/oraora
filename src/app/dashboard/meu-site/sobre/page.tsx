'use client';

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDoc, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const awardSchema = z.object({
  yearOrEntity: z.string().optional(),
  title: z.string().optional(),
});

const differentialSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const sobreSchema = z.object({
  profileImageUrl: z.string().url("URL inválida.").or(z.literal('')).optional(),
  brokerName: z.string().optional(),
  brokerTitle: z.string().optional(),
  bio: z.string().optional(),
  // Visibility Flags
  showStatsSection: z.boolean().optional().default(true),
  showVideoSection: z.boolean().optional().default(true),
  showValuesSection: z.boolean().optional().default(true),
  showAreasSection: z.boolean().optional().default(true),
  showDifferentialsSection: z.boolean().optional().default(true),
  showAwardsSection: z.boolean().optional().default(true),
  // Data fields
  statManagedDeals: z.string().optional(),
  statAssistedFamilies: z.string().optional(),
  statYearsExperience: z.string().optional(),
  videoUrl: z.string().url().or(z.literal('')).optional(),
  videoTitle: z.string().optional(),
  videoDescription: z.string().optional(),
  value1Title: z.string().optional(),
  value1Description: z.string().optional(),
  value2Title: z.string().optional(),
  value2Description: z.string().optional(),
  value3Title: z.string().optional(),
  value3Description: z.string().optional(),
  areas: z.array(z.string()).optional(),
  differentials: z.array(differentialSchema).optional(),
  awards: z.array(awardSchema).optional(),
});

type SobreFormData = z.infer<typeof sobreSchema>;

type BrokerData = {
    urbanPadraoSobre?: SobreFormData;
}

export default function EditSobrePage() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const brokerDocRef = useMemoFirebase(() => user ? doc(firestore, 'brokers', user.uid) : null, [firestore, user]);
    const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

    const form = useForm<SobreFormData>({
        resolver: zodResolver(sobreSchema),
        defaultValues: {
            profileImageUrl: '',
            brokerName: '',
            brokerTitle: '',
            bio: '',
            showStatsSection: true,
            showVideoSection: true,
            showValuesSection: true,
            showAreasSection: true,
            showDifferentialsSection: true,
            showAwardsSection: true,
            statManagedDeals: '',
            statAssistedFamilies: '',
            statYearsExperience: '',
            videoUrl: '',
            videoTitle: '',
            videoDescription: '',
            value1Title: '',
            value1Description: '',
            value2Title: '',
            value2Description: '',
            value3Title: '',
            value3Description: '',
            areas: [],
            differentials: [],
            awards: [],
        },
    });
    
    const { fields: awards, append: appendAward, remove: removeAward } = useFieldArray({
        control: form.control,
        name: "awards",
    });

    const { fields: areas, append: appendArea, remove: removeArea } = useFieldArray({
        control: form.control,
        name: "areas",
    });
    
    const { fields: differentials, append: appendDifferential, remove: removeDifferential } = useFieldArray({
        control: form.control,
        name: "differentials",
    });

    useEffect(() => {
        if (brokerData?.urbanPadraoSobre) {
            form.reset(brokerData.urbanPadraoSobre);
        }
    }, [brokerData, form]);

    const onSubmit = (data: SobreFormData) => {
        if (!brokerDocRef || !user) return;
        setDocumentNonBlocking(brokerDocRef, { urbanPadraoSobre: data, userId: user.uid }, { merge: true });
        toast({
            title: 'Página "Sobre" atualizada!',
            description: 'Suas informações foram salvas com sucesso.',
        });
    };

    if (isLoading) {
      return <div>Carregando...</div>
    }

    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 pb-24">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex items-center justify-between">
                    <div>
                        <Link href="/dashboard/meu-site" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Voltar para Meu Site
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Editar Página Sobre</h1>
                    </div>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    </div>
                    
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-muted">person</span>
                            <h2 className="font-bold text-text-main">Informações do Corretor</h2>
                        </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-4 flex flex-col">
                                <div className="w-full">
                                    <Label className="block text-sm font-medium text-text-main mb-2">URL da Foto de Perfil</Label>
                                    <Input id="profileImageUrl" {...form.register('profileImageUrl')} placeholder="https://exemplo.com/foto.jpg" />
                                </div>
                            </div>
                            <div className="md:col-span-8 space-y-6">
                                <div>
                                    <Label className="block text-sm font-medium text-text-main mb-1.5" htmlFor="brokerName">Nome Completo</Label>
                                    <Input id="brokerName" {...form.register('brokerName')} />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-text-main mb-1.5" htmlFor="brokerTitle">Título / Especialização</Label>
                                    <Input id="brokerTitle" {...form.register('brokerTitle')} />
                                    <p className="mt-1 text-xs text-text-muted">Exibido logo abaixo do seu nome na página principal.</p>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-text-main mb-1.5" htmlFor="bio">Biografia</Label>
                                    <Textarea id="bio" rows={6} {...form.register('bio')} />
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-muted">bar_chart</span>
                                <h2 className="font-bold text-text-main">Destaques Numéricos</h2>
                            </div>
                            <FormField name="showStatsSection" control={form.control} render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-medium cursor-pointer" htmlFor="showStatsSection">Visível</Label>
                                    <Switch id="showStatsSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                </div>
                            )}/>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="block text-sm font-medium text-text-main mb-1.5">Negócios Geridos</Label>
                                <div className="relative">
                                    <Input className="pl-10" {...form.register('statManagedDeals')} />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-[20px]">attach_money</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium text-text-main mb-1.5">Famílias Assessoradas</Label>
                                <div className="relative">
                                    <Input className="pl-10" {...form.register('statAssistedFamilies')} />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-[20px]">groups</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium text-text-main mb-1.5">Anos de Experiência</Label>
                                <div className="relative">
                                    <Input className="pl-10" {...form.register('statYearsExperience')} />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_month</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-muted">play_circle</span>
                                <h2 className="font-bold text-text-main">Vídeo de Apresentação</h2>
                            </div>
                            <FormField name="showVideoSection" control={form.control} render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-medium cursor-pointer" htmlFor="showVideoSection">Visível</Label>
                                    <Switch id="showVideoSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                </div>
                            )}/>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className='space-y-4'>
                                    <div>
                                        <Label className="block text-sm font-medium text-text-main mb-1.5" htmlFor="videoUrl">URL do Vídeo (YouTube)</Label>
                                        <Input id="videoUrl" {...form.register('videoUrl')} />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-text-main mb-1.5">Título do Vídeo</Label>
                                        <Input {...form.register('videoTitle')} />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-text-main mb-1.5">Descrição Curta</Label>
                                        <Textarea rows={3} {...form.register('videoDescription')} />
                                    </div>
                                </div>
                                <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden group">
                                    {form.watch('videoUrl') ? (
                                        <iframe src={`https://www.youtube.com/embed/${new URL(form.watch('videoUrl')!).searchParams.get('v')}`} title={form.watch('videoTitle')} className="w-full h-full"/>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDzPeUZUrjmZi1J6YXvGV6PUhFRbF5C43OfQNC14zZjfRDhiA6SJGvTiMBwmOE6NONcPtqlUT-byvh0sabE8__a8rXqGsHVmCRktA8lqGHtXsQLdsEoewXy2QBy6gY780D68cWXi_y3oXYoy6essuqpeSCCySFlIh0JcOuINOy7EpKFi58DMV9dEDK6yg-ZhpdOXpU5_SFlJ77FjB-DgGMFngpcbp6tAnMRQflFN1ocdH4KTnLAGONujmpJBOrpUhWQgzI7rb4_N0E")'}}></div>
                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-white text-5xl">play_circle</span>
                                                <span className="text-white text-xs font-bold uppercase tracking-wider">Preview</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-muted">diamond</span>
                                <h2 className="font-bold text-text-main">Meus Valores e Princípios</h2>
                            </div>
                            <FormField name="showValuesSection" control={form.control} render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-medium cursor-pointer" htmlFor="showValuesSection">Visível</Label>
                                    <Switch id="showValuesSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                </div>
                            )}/>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="size-8 rounded bg-white flex items-center justify-center shadow-sm text-primary border border-gray-100">
                                        <span className="material-symbols-outlined text-lg">verified_user</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-muted uppercase">Pilar 1</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input placeholder="Título" {...form.register('value1Title')} />
                                    <Textarea placeholder="Descrição" rows={2} {...form.register('value1Description')} />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="size-8 rounded bg-white flex items-center justify-center shadow-sm text-primary border border-gray-100">
                                        <span className="material-symbols-outlined text-lg">person_check</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-muted uppercase">Pilar 2</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input placeholder="Título" {...form.register('value2Title')} />
                                    <Textarea placeholder="Descrição" rows={2} {...form.register('value2Description')} />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="size-8 rounded bg-white flex items-center justify-center shadow-sm text-primary border border-gray-100">
                                        <span className="material-symbols-outlined text-lg">auto_graph</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-muted uppercase">Pilar 3</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input placeholder="Título" {...form.register('value3Title')} />
                                    <Textarea placeholder="Descrição" rows={2} {...form.register('value3Description')} />
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted">map</span>
                                    <h2 className="font-bold text-text-main">Áreas de Atuação</h2>
                                </div>
                                <FormField name="showAreasSection" control={form.control} render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-medium cursor-pointer" htmlFor="showAreasSection">Visível</Label>
                                        <Switch id="showAreasSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                    </div>
                                )}/>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-text-muted mb-4">Liste os bairros ou regiões onde você tem maior expertise.</p>
                                <div className="space-y-3">
                                    {areas.map((field, index) => (
                                        <div key={field.id} className="flex gap-2">
                                            <Input {...form.register(`areas.${index}` as const)} />
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeArea(index)}><span className="material-symbols-outlined">delete</span></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" className="w-full" onClick={() => appendArea('')}>
                                    <span className="material-symbols-outlined text-lg mr-2">add</span> Adicionar Região
                                    </Button>
                                </div>
                            </div>
                        </section>
                        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted">star</span>
                                    <h2 className="font-bold text-text-main">Diferenciais</h2>
                                </div>
                                <FormField name="showDifferentialsSection" control={form.control} render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-medium cursor-pointer" htmlFor="showDifferentialsSection">Visível</Label>
                                        <Switch id="showDifferentialsSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                    </div>
                                )}/>
                            </div>
                            <div className="p-6 space-y-4">
                                {differentials.map((field, index) => (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-3 relative">
                                        <Input className="font-bold mb-1" placeholder="Título do Diferencial" {...form.register(`differentials.${index}.title` as const)} />
                                        <Textarea placeholder="Descrição do diferencial" rows={2} {...form.register(`differentials.${index}.description` as const)} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500 hover:bg-red-50" onClick={() => removeDifferential(index)}>
                                            <span className="material-symbols-outlined">delete</span>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full" onClick={() => appendDifferential({title: '', description: ''})}>
                                    <span className="material-symbols-outlined text-lg mr-2">add</span> Adicionar Diferencial
                                </Button>
                            </div>
                        </section>
                    </div>

                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-muted">trophy</span>
                                <h2 className="font-bold text-text-main">Reconhecimentos & Prêmios</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <FormField name="showAwardsSection" control={form.control} render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-medium cursor-pointer" htmlFor="showAwardsSection">Visível</Label>
                                        <Switch id="showAwardsSection" checked={field.value !== false} onCheckedChange={field.onChange} />
                                    </div>
                                )}/>
                                <Button type="button" className="text-sm font-semibold" onClick={() => appendAward({ yearOrEntity: '', title: '' })}>Adicionar Novo</Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Ano / Entidade</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Título do Prêmio</th>
                                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {awards.map((field, index) => (
                                            <tr key={field.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Input {...form.register(`awards.${index}.yearOrEntity` as const)} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap w-full">
                                                    <Input {...form.register(`awards.${index}.title` as const)} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button type="button" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removeAward(index)}>
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </form>
            </FormProvider>
        </main>
    );
}

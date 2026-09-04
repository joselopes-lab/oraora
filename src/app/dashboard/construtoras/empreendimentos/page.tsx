'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectForm, { ProjectFormData } from './components/project-form';
import { createProjectServer, getProjectsServer } from './actions.server';
import { useToast } from '@/hooks/use-toast';
import { Building2, MapPin, ChevronRight, Plus } from 'lucide-react';

export default function EmpreendimentosPage() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [projects, setProjects] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadProjects = async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const data = await getProjectsServer(idToken);
            setProjects(data);
        } catch (err: any) {
            toast({ title: 'Erro ao carregar empreendimentos', description: err.message, variant: 'destructive' });
        }
    };

    useEffect(() => {
        if (isUserLoading) return;
        loadProjects();
    }, [user, isUserLoading]);

    const handleSave = async (data: ProjectFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const idToken = await user.getIdToken();
            await createProjectServer({
                name: data.name,
                localizacao: {
                    estado: data.estado,
                    cidade: data.cidade,
                    bairro: data.bairro,
                    address: data.address,
                    cep: data.cep,
                },
                idToken
            });
            setIsCreating(false);
            await loadProjects();
        } catch (err: any) {
            toast({ title: 'Erro ao criar empreendimento', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Meus Empreendimentos</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie os empreendimentos da construtora e acompanhe o cockpit de lançamento.</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} className="shrink-0">
                        <Plus className="w-4 h-4 mr-2" /> Novo Empreendimento
                    </Button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Cadastrar Novo Empreendimento</h2>
                    <ProjectForm onSave={handleSave} isSubmitting={isSubmitting} />
                    <Button variant="ghost" onClick={() => setIsCreating(false)} className="mt-4 text-muted-foreground">Cancelar</Button>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-card rounded-xl border border-border/80 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
                    <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Você ainda não possui empreendimentos</h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        Crie seu primeiro empreendimento para começar a organizar informações, estoque, materiais e publicação.
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Novo Empreendimento
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map(p => {
                        const locationStr = p.localizacao?.cidade && p.localizacao?.estado 
                            ? `${p.localizacao.cidade} - ${p.localizacao.estado}` 
                            : p.localizacao?.cidade || p.localizacao?.estado || 'Localização não informada';
                        
                        const isPublished = !!p.isPublished;

                        const hasBasicInfo = !!p.name && !!p.status && !!p.standard;
                        const hasLocation = !!p.localizacao?.estado && !!p.localizacao?.cidade;
                        const hasFinancials = !!p.vgvEstimado || p.percentualObra !== undefined;
                        const hasPresentation = !!p.descricaoCurta || !!p.descricaoCompleta;
                        const hasCommercial = !!p.tituloComercial && !!p.precoInicial;
                        const hasCharacteristics = !!p.numTorres && !!p.numUnidades;
                        const hasPersona = (p.personaIds?.length || 0) > 0;
                        const hasMedia = (p.midia?.length || 0) > 0;
                        const hasMaterials = (p.materiais?.length || 0) > 0;

                        const checks = [hasBasicInfo, hasLocation, hasFinancials, hasPresentation, hasCommercial, hasCharacteristics, hasPersona, hasMedia, hasMaterials];
                        const doneCount = checks.filter(Boolean).length;
                        const percent = Math.round((doneCount / checks.length) * 100);

                        return (
                            <Link 
                                key={p.id} 
                                href={`/dashboard/construtoras/empreendimentos/${p.id}`}
                                className="group block bg-card p-5 rounded-xl border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
                                            {isPublished ? "Publicado" : "Rascunho"}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform" />
                                    </div>
                                </div>

                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                                    {p.name || 'Empreendimento sem nome'}
                                </h3>

                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{locationStr}</span>
                                </div>

                                <div className="space-y-1.5 pt-3 border-t border-border">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Progresso do cadastro</span>
                                        <span className="font-medium text-foreground">{percent}%</span>
                                    </div>
                                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all duration-300" 
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { classificarProperty } from '@/lib/utils';
import { doc, collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo, useState, useEffect } from 'react';
import { getAllProjectsServer } from '@/app/dashboard/construtoras/empreendimentos/actions.server';

type User = {
  userType: 'admin' | 'broker' | 'constructor';
  tenantId?: string;
};

type Property = {
  id: string;
  builderId?: string;
  tenantId?: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    slug?: string;
  };
  valores?: {
    venda?: number;
  };
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
    numero?: string;
    unidade?: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[];
    tamanho?: string;
  };
  projectId?: string;
  project?: string;
  empreendimentoId?: string;
  projectRef?: any;
  builderInfo?: {
    projectId?: string;
  };
  availableToNetwork?: boolean;
  isVisibleOnSite?: boolean;
};

function PropertyCard({ property, canEdit, projectMap }: { property: Property; canEdit: boolean; projectMap: Record<string, any> }) {
    const getStatusVariant = (status: string) : "default" | "secondary" | "destructive" | "outline" | null | undefined => {
        switch (status) {
            case 'Lançamento': return 'default';
            case 'Em Construção': return 'secondary';
            case 'Pronto para Morar': return 'outline';
            default: return 'outline';
        }
    };

    const quartosLabel = () => {
        if (!property.caracteristicasimovel?.quartos || property.caracteristicasimovel.quartos.length === 0) {
            return null;
        }
        if (property.caracteristicasimovel.quartos.length === 1 && property.caracteristicasimovel.quartos[0] === '1') {
            return '1 Quarto';
        }
        const joinedQuartos = property.caracteristicasimovel.quartos.join(', ');
        return `${joinedQuartos} Quartos`;
    };

    const formatPrice = (val?: number) => {
        if (!val && val !== 0) return null;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const tipo = classificarProperty(property);

    const loc = property.localizacao || (property.projectId ? projectMap[property.projectId]?.localizacao : null);
    const bairro = loc?.bairro || '';
    const cidade = loc?.cidade || '';

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white rounded-xl border border-card-border shadow-sm mb-4">
            <div className="w-full sm:w-24 h-32 sm:h-20 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-card-border">
                {property.midia?.[0] ? (
                    <Image alt={property.informacoesbasicas?.nome || 'Imóvel'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src={property.midia[0]} width={96} height={80} referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300 text-3xl">image</span></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {property.informacoesbasicas?.status && (
                      <Badge variant={getStatusVariant(property.informacoesbasicas.status)} className="text-[10px] font-bold uppercase tracking-wide">{property.informacoesbasicas.status}</Badge>
                    )}
                    <span className="text-xs text-text-secondary">Ref: {property.id.substring(0, 6).toUpperCase()}</span>
                    <Badge variant={tipo === 'empreendimento' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase tracking-wide">
                      {tipo === 'empreendimento' ? 'Empreendimento' : 'Avulso'}
                    </Badge>
                    {(property.localizacao?.unidade || property.localizacao?.numero) && (
                        <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-text-main">
                            Unidade: {property.localizacao.unidade || property.localizacao.numero}
                        </span>
                    )}
                </div>
                 <Link href={`/dashboard/imoveis/${property.id}`} className="text-base font-bold text-text-main truncate hover:text-primary transition-colors block">{property.informacoesbasicas?.nome || 'Imóvel sem nome'}</Link>
                <p className="text-sm text-text-secondary truncate">{bairro && cidade ? `${bairro}, ${cidade}` : bairro || cidade || 'Localização não informada'}</p>
                {property.valores?.venda && (
                    <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(property.valores.venda)}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                    {property.caracteristicasimovel?.quartos && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span> {quartosLabel()}</span>}
                    {property.caracteristicasimovel?.tamanho && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">straighten</span> {property.caracteristicasimovel.tamanho}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-card-border">
                <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none py-2 sm:py-1.5 px-3 rounded-lg text-sm font-medium">
                    <Link href={`/dashboard/imoveis/${property.id}`}>Detalhes</Link>
                </Button>
                {canEdit && (
                    <Button asChild variant="ghost" size="icon" className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors">
                        <Link href={`/dashboard/imoveis/editar/${property.id}`}><span className="material-symbols-outlined">edit</span></Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function ConstrutoraImoveisCentralPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const currentTab = searchParams.get('tab') || 'todos';

  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<User>(userDocRef);

  const propertiesQueryTenant = useMemoFirebase(
    () => (firestore && id ? query(collection(firestore, 'properties'), where('tenantId', '==', id)) : null),
    [firestore, id]
  );
  const { data: tenantProperties, isLoading: isTenantLoading } = useCollection<Property>(propertiesQueryTenant);

  const propertiesQueryBuilder = useMemoFirebase(
    () => (firestore && id ? query(collection(firestore, 'properties'), where('builderId', '==', id)) : null),
    [firestore, id]
  );
  const { data: builderProperties, isLoading: isBuilderLoading } = useCollection<Property>(propertiesQueryBuilder);

  const [projects, setProjects] = useState<any[]>([]);
  const [areProjectsLoading, setAreProjectsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await getAllProjectsServer();
        const projectsList = res?.success ? res.projects : (Array.isArray(res) ? res : []);
        setProjects(projectsList || []);
      } catch (err) {
        console.error('Erro ao carregar projetos no servidor:', err);
      } finally {
        setAreProjectsLoading(false);
      }
    }
    loadProjects();
  }, []);

  const projectMap = useMemo(() => {
    if (!projects) return {};
    return projects
      .filter(p => !id || p.builderId === id)
      .reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, any>);
  }, [projects, id]);

  const properties = useMemo(() => {
    const map = new Map<string, Property>();
    tenantProperties?.forEach(p => map.set(p.id, p));
    builderProperties?.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [tenantProperties, builderProperties]);

  const canEditProperty = userProfile?.userType === 'admin' || (userProfile?.userType === 'constructor' && (user?.uid === id || userProfile?.tenantId === id));

  const handleTabChange = (val: string) => {
    router.push(`/dashboard/construtoras/${id}/imoveis?tab=${val}`);
  };

  const empreendimentosList = useMemo(() => properties.filter(p => classificarProperty(p) === 'empreendimento'), [properties]);
  const avulsosList = useMemo(() => properties.filter(p => classificarProperty(p) === 'avulso'), [properties]);

  const isLoading = isTenantLoading || isBuilderLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imóveis</h1>
          <p className="text-sm text-text-secondary">Gerencie todos os imóveis comercializados pela sua empresa.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/construtoras/${id}`}>Voltar para Construtora</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/construtoras/${id}/imoveis/nova`}>
              <span className="material-symbols-outlined text-lg mr-1">add</span>
              Cadastrar imóvel avulso
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden p-6">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-between items-center mb-6 border-b border-card-border pb-4">
            <TabsList>
              <TabsTrigger value="todos">Todos ({properties.length})</TabsTrigger>
              <TabsTrigger value="empreendimentos">Empreendimentos ({empreendimentosList.length})</TabsTrigger>
              <TabsTrigger value="avulsos">Avulsos ({avulsosList.length})</TabsTrigger>
            </TabsList>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-text-secondary">Carregando imóveis...</div>
          ) : (
            <>
              <TabsContent value="todos" className="space-y-2 mt-0">
                {properties.length > 0 ? (
                  properties.map(prop => <PropertyCard key={prop.id} property={prop} canEdit={canEditProperty} projectMap={projectMap} />)
                ) : (
                  <div className="p-12 text-center text-text-secondary">
                    <p>Nenhum imóvel cadastrado.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="empreendimentos" className="space-y-2 mt-0">
                {empreendimentosList.length > 0 ? (
                  empreendimentosList.map(prop => <PropertyCard key={prop.id} property={prop} canEdit={canEditProperty} projectMap={projectMap} />)
                ) : (
                  <div className="p-12 text-center text-text-secondary">
                    <p>Nenhum imóvel de empreendimento vinculado.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="avulsos" className="space-y-2 mt-0">
                {avulsosList.length > 0 ? (
                  avulsosList.map(prop => <PropertyCard key={prop.id} property={prop} canEdit={canEditProperty} projectMap={projectMap} />)
                ) : (
                  <div className="p-12 text-center text-text-secondary">
                    <p>Nenhum imóvel avulso cadastrado.</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

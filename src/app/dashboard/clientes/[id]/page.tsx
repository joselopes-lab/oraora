'use client';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, setDocumentNonBlocking, useAuthContext } from '@/firebase';
import { collection, doc, query, where, Timestamp, limit, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ClientDetailView from '../components/client-detail-view';
import { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogTrigger, 
    DialogClose 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Zap } from 'lucide-react';

const ClientSideDate = ({ date }: { date: Date }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);
    useEffect(() => { setFormattedDate(date.toLocaleDateString('pt-BR')); }, [date]);
    return <>{formattedDate || '...'}</>;
}

// Mapeamento de traduções para os estados do sistema
const statusTranslations: Record<string, string> = {
  new: 'Novo',
  pending: 'Pendente',
  accepted: 'Aceita',
  negotiating: 'Em negociação',
  closed: 'Concluído',
  cancelled: 'Cancelado',
  rejected: 'Recusado',
};

type NetworkState = {
    published: boolean;
    publishedAt?: Timestamp | null;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    description: string;
    acceptsOffMarket: boolean;
    acceptsCapture: boolean;
    acceptsExclusive: boolean;
    expiresAt?: string;
};

type Lead = {
    id: string;
    brokerId: string;
    brokerName?: string;
    name: string;
    email: string;
    phone: string;
    clientType?: 'comprador' | 'vendedor';
    propertyInterest?: string;
    source?: string;
    status: string;
    createdAt: Timestamp;
    address?: { city?: string; state?: string; };
    potentialValue?: number;
    personaIds?: string[];
    network?: NetworkState;
};

type Event = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  completed?: boolean;
  clientId?: string;
  journeyId?: string;
  propertyId?: string;
  propertySource?: 'properties' | 'brokerProperties';
};

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { user, isReady } = useAuthContext();
    
    const [isNetworkWizardOpen, setIsNetworkWizardOpen] = useState(false);
    const [networkFormData, setNetworkFormData] = useState<Partial<NetworkState>>({
        urgency: 'normal',
        description: '',
        acceptsOffMarket: false,
        acceptsCapture: false,
        acceptsExclusive: false,
    });

    const leadDocRef = useMemoFirebase(
      () => (isReady && firestore && id ? doc(firestore, 'leads', id) : null),
      [isReady, firestore, id]
    );
    const { data: client, isLoading } = useDoc<Lead>(leadDocRef);

    const brokerDocRef = useMemoFirebase(
      () => (isReady && firestore && user?.uid ? doc(firestore, 'brokers', user.uid) : null),
      [isReady, firestore, user?.uid]
    );
    const { data: brokerData } = useDoc<any>(brokerDocRef);

    // Consulta simplificada para evitar necessidade de índices compostos
    const eventsQuery = useMemoFirebase(
      () => (isReady && firestore && user?.uid ? query(collection(firestore, 'events'), where('brokerId', '==', user.uid)) : null),
      [isReady, firestore, user?.uid]
    );
    const { data: allEvents } = useCollection<Event>(eventsQuery);

    // Filtro e ordenação em memória
    const clientEvents = useMemo(() => {
        if (!allEvents || !id) return [];
        return allEvents
            .filter(e => e.clientId === id)
            .sort((a, b) => {
                const dateA = a.date + (a.time || '00:00');
                const dateB = b.date + (b.time || '00:00');
                return dateB.localeCompare(dateA);
            });
    }, [allEvents, id]);

    const handlePublishToNetwork = async () => {
        if (!leadDocRef || !user) return;
        const payload = {
            network: {
                ...networkFormData,
                published: true,
                publishedAt: serverTimestamp(),
            }
        };
        try {
            await setDocumentNonBlocking(leadDocRef, payload, { merge: true });
            setIsNetworkWizardOpen(false);
        } catch (e) { console.error(e); }
    };

    if (isLoading || !isReady) return <div className="p-10 text-center italic text-slate-500">Carregando dossiê do cliente...</div>;
    if (!client) return <div className="p-10 text-center">Cliente não encontrado.</div>;

    const initials = client.name?.substring(0, 2).toUpperCase() || 'CL';

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full text-left">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/clientes" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"><span className="material-symbols-outlined text-slate-400">arrow_back</span></Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dossiê do Cliente</h1>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm ml-10">
                        <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                        <span>ID: #{client.id.substring(0, 6)}</span>
                        <span className="mx-1">•</span>
                        <span>Cadastrado em <ClientSideDate date={client.createdAt.toDate()} /></span>
                    </div>
                </div>
                <div className="flex gap-3">
                    {!client.network?.published ? (
                        <Dialog open={isNetworkWizardOpen} onOpenChange={setIsNetworkWizardOpen}>
                            <DialogTrigger asChild>
                                <button className="bg-primary text-slate-900 font-black h-11 px-6 rounded-xl shadow-glow border-none hover:scale-[1.02] transition-transform flex items-center gap-2 cursor-pointer">
                                    <Zap className="size-4" /> Publicar na Rede
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Publicar Solicitação na Rede</DialogTitle>
                                    <DialogDescription>A rede verá apenas os critérios da busca, seus dados e do cliente permanecem privados.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label>O que você procura e ainda não encontrou?</Label>
                                        <Textarea value={networkFormData.description} onChange={e => setNetworkFormData({...networkFormData, description: e.target.value})} rows={3} placeholder="Descreva os detalhes da necessidade..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Urgência</Label>
                                            <Select value={networkFormData.urgency} onValueChange={(val: any) => setNetworkFormData({...networkFormData, urgency: val})}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data Limite</Label>
                                            <Input type="date" value={networkFormData.expiresAt} onChange={e => setNetworkFormData({...networkFormData, expiresAt: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer"><Checkbox checked={networkFormData.acceptsOffMarket} onCheckedChange={(val) => setNetworkFormData({...networkFormData, acceptsOffMarket: !!val})} /><span className="text-sm font-medium">Aceito imóveis Off Market</span></label>
                                        <label className="flex items-center gap-3 cursor-pointer"><Checkbox checked={networkFormData.acceptsCapture} onCheckedChange={(val) => setNetworkFormData({...networkFormData, acceptsCapture: !!val})} /><span className="text-sm font-medium">Aceito propostas de captação</span></label>
                                        <label className="flex items-center gap-3 cursor-pointer"><Checkbox checked={networkFormData.acceptsExclusive} onCheckedChange={(val) => setNetworkFormData({...networkFormData, acceptsExclusive: !!val})} /><span className="text-sm font-medium">Busco exclusividade no atendimento</span></label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                                    <Button onClick={handlePublishToNetwork} className="bg-primary text-slate-900 font-bold">Publicar Agora</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Button asChild variant="outline" className="h-11 px-6 rounded-xl border-primary text-primary font-bold">
                            <Link href={`/dashboard/solicitacoes-rede/${client.id}`}>Gerenciar na Rede</Link>
                        </Button>
                    )}
                    <Button asChild variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-900 font-bold h-11 px-6 rounded-xl"><Link href={`/dashboard/clientes/editar/${client.id}`}>Editar</Link></Button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 text-left">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="size-32 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary-hover font-black text-4xl shrink-0 uppercase shadow-inner">
                        {initials}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{client.name}</h2>
                            <p className="text-slate-500 font-medium">{client.email} • {client.phone}</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-lg bg-primary/5 text-green-700 font-bold uppercase text-[10px]">{client.clientType || 'Comprador'}</Badge>
                            <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] bg-slate-50 text-slate-600 border-slate-200">Status: {statusTranslations[client.status] || client.status}</Badge>
                            {client.source && <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">Origem: {client.source}</Badge>}
                            {client.address?.city && <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] bg-slate-50 text-slate-600 border-slate-200">📍 {client.address.city}{client.address.state ? `, ${client.address.state}` : ''}</Badge>}
                            {client.network?.published && <Badge className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"><Zap className="size-3 mr-1 text-primary fill-current" /> ATIVO NA REDE</Badge>}
                        </div>
                    </div>
                </div>
            </div>
            <ClientDetailView client={client as any} personas={[]} recommendedProperties={[]} linkedProperties={[]} clientEvents={clientEvents as any} brokerSlug={brokerData?.slug || client?.brokerId || user?.uid} />
        </main>
    );
}

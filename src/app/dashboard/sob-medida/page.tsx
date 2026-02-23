
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuthContext, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';


const ClientSideDate = ({ dateString, options }: { dateString: string, options?: Intl.DateTimeFormatOptions }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString('pt-BR', options));
  }, [dateString, options]);

  return <>{formattedDate || '...'}</>;
};


type Lead = {
    id: string;
    name: string;
    propertyInterest?: string;
    phone: string;
    email: string;
    source: string;
    createdAt: string;
    status: LeadStatus;
};

type LeadStatus = string;

type LeadFunnelColumn = {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  order: number;
}

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};


const sourceStyles: { [key: string]: string } = {
    'WhatsApp': 'bg-green-50 text-green-700 border border-green-100',
    'Site': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Ads': 'bg-purple-50 text-purple-700 border border-purple-100',
    'Indicação': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Site Público': 'bg-blue-50 text-blue-700 border border-blue-100'
};

const sourceIcons: { [key: string]: string } = {
    'WhatsApp': 'chat',
    'Site': 'public',
    'Ads': 'campaign',
    'Indicação': 'person',
    'Site Público': 'public'
};


export default function SobMedidaPage() {
    const { user, userProfile } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'options' | 'form' | 'catalog'>('options');
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    
    const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
    const [arePortfolioPropsLoading, setArePortfolioPropsLoading] = useState(true);

    const avulsoPropertiesQuery = useMemoFirebase(
        () => (user ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
        [user, firestore]
    );
    const { data: avulsoProperties, isLoading: areAvulsoLoading } = useCollection<Property>(avulsoPropertiesQuery);

    const portfolioDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'portfolios', user.uid) : null),
        [user, firestore]
    );
    const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<{ propertyIds: string[] }>(portfolioDocRef);

    useEffect(() => {
        const fetchPortfolioProperties = async () => {
            if (!firestore || !portfolio) {
                setPortfolioProperties([]);
                setArePortfolioPropsLoading(false);
                return;
            }

            const propertyIds = portfolio.propertyIds || [];
            if (propertyIds.length === 0) {
                setPortfolioProperties([]);
                setArePortfolioPropsLoading(false);
                return;
            }
            
            setArePortfolioPropsLoading(true);
            const propertiesData: Property[] = [];
            const propertiesRef = collection(firestore, 'properties');

            for (let i = 0; i < propertyIds.length; i += 30) {
                const batch = propertyIds.slice(i, i + 30);
                if (batch.length > 0) {
                    const q = query(propertiesRef, where('__name__', 'in', batch));
                    const propertiesSnap = await getDocs(q);
                    propertiesSnap.forEach(doc => {
                        propertiesData.push({ id: doc.id, ...doc.data() } as Property);
                    });
                }
            }
            setPortfolioProperties(propertiesData);
            setArePortfolioPropsLoading(false);
        };

        if (!isPortfolioLoading) {
            fetchPortfolioProperties();
        }
    }, [firestore, portfolio, isPortfolioLoading]);

    const allSelectableProperties = useMemo(() => {
        const combined = [...(avulsoProperties || []), ...portfolioProperties];
        return Array.from(new Map(combined.map(p => [p.id, p])).values());
    }, [avulsoProperties, portfolioProperties]);

    const isLoading = areAvulsoLoading || arePortfolioPropsLoading;

    const openModal = () => {
        setModalView('options'); // Reset to default view every time it opens
        setIsModalOpen(true);
    }
    
    return (
        <>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
                            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-text-main">Sob Medida</span>
                        </nav>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Sob Medida — Pedidos de Clientes</h1>
                        <p className="text-text-secondary text-sm mt-1">Gerencie solicitações personalizadas e encontre o imóvel ideal para seus clientes.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="bg-white border border-gray-200 hover:border-gray-300 text-text-main font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                            Filtrar
                        </Button>
                        <Button className="bg-primary hover:bg-primary-hover text-text-main font-bold py-2.5 px-6 rounded-lg shadow-glow transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Novo Pedido
                        </Button>
                    </div>
                </div>
                <div className="space-y-6 mb-12">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary font-bold text-lg border border-gray-200">
                                        RA
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main">Roberto Almeida</h3>
                                        <p className="text-xs text-text-secondary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            Pedido realizado em 24 Out, 2024
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                                    Urgência: Agora
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-50 mb-6">
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Tipo de Imóvel</p>
                                    <p className="text-text-main font-bold text-sm">Apartamento Garden</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Cidade / Bairro</p>
                                    <p className="text-text-main font-bold text-sm">São Paulo, Jardins</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Faixa de Valor</p>
                                    <p className="text-text-main font-bold text-sm">R$ 2.5M - R$ 4.0M</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Objetivo</p>
                                    <p className="text-text-main font-bold text-sm">Morar</p>
                                </div>
                            </div>
                            <div className="mb-8">
                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-3">Observações do Cliente</p>
                                <div className="bg-background-light rounded-xl p-5 border border-gray-200/50">
                                    <p className="text-text-main text-lg leading-relaxed font-medium">
                                        "Busco um apartamento com ampla área externa privativa, preferencialmente face norte. É essencial ter 3 suítes e vaga para 3 carros. O condomínio deve ter infraestrutura moderna de lazer e segurança 24h."
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary border border-gray-100">
                                        <span className="material-symbols-outlined text-[20px]">phone</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter">Contato</p>
                                        <p className="text-text-main font-bold text-sm blur-phone">(11) 98765-4321</p>
                                    </div>
                                </div>
                                <DialogTrigger asChild>
                                    <Button onClick={openModal} className="bg-primary hover:bg-primary-hover text-text-main font-bold py-3 px-8 rounded-lg shadow-glow hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                        Enviar Imóvel
                                    </Button>
                                </DialogTrigger>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary font-bold text-lg border border-gray-200">
                                        MC
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main">Mariana Costa</h3>
                                        <p className="text-xs text-text-secondary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            Pedido realizado em 22 Out, 2024
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                                    Urgência: 90 dias
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-50 mb-6">
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Tipo de Imóvel</p>
                                    <p className="text-text-main font-bold text-sm">Comercial / Escritório</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Cidade / Bairro</p>
                                    <p className="text-text-main font-bold text-sm">São Paulo, Itaim Bibi</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Faixa de Valor</p>
                                    <p className="text-text-main font-bold text-sm">R$ 1.2M - R$ 2.0M</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Objetivo</p>
                                    <p className="text-text-main font-bold text-sm">Investir</p>
                                </div>
                            </div>
                            <div className="mb-8">
                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-3">Observações do Cliente</p>
                                <div className="bg-background-light rounded-xl p-5 border border-gray-200/50">
                                    <p className="text-text-main text-lg leading-relaxed font-medium">
                                        "Procura por laje corporativa ou salas integradas para sede de agência. Importante proximidade com transporte público e restaurantes. Preferência por prédios com certificação Green Building."
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary border border-gray-100">
                                        <span className="material-symbols-outlined text-[20px]">phone</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter">Contato</p>
                                        <p className="text-text-main font-bold text-sm blur-phone">(11) 94433-2211</p>
                                    </div>
                                </div>
                                <DialogTrigger asChild>
                                    <Button onClick={openModal} className="bg-primary hover:bg-primary-hover text-text-main font-bold py-3 px-8 rounded-lg shadow-glow hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                        Enviar Imóvel
                                    </Button>
                                </DialogTrigger>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="flex items-center justify-center gap-2">
                    <button className="size-10 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-white hover:text-primary hover:border-primary transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="size-10 rounded-lg bg-primary text-text-main font-bold shadow-sm">1</button>
                    <button className="size-10 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-white hover:border-gray-300 transition-all font-bold">2</button>
                    <button className="size-10 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-white hover:border-gray-300 transition-all font-bold">3</button>
                    <span className="text-text-secondary px-2">...</span>
                    <button className="size-10 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-white hover:border-gray-300 transition-all font-bold">12</button>
                    <button className="size-10 rounded-lg border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-white hover:text-primary hover:border-primary transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </nav>
                 <DialogContent className="p-0 max-w-2xl">
                    <VisuallyHidden>
                        <DialogHeader>
                            <DialogTitle>Enviar Sugestão</DialogTitle>
                            <DialogDescription>Escolha como deseja enviar uma sugestão de imóvel para o cliente.</DialogDescription>
                        </DialogHeader>
                    </VisuallyHidden>
                    {modalView === 'options' ? (
                        <>
                            <div className="flex items-center justify-between px-8 pt-8 pb-4">
                                <h2 className="text-2xl font-bold tracking-tight text-text-main">Como você deseja enviar a sugestão?</h2>
                            </div>
                            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group relative bg-white border border-gray-100 rounded-xl p-6 hover:border-primary transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                        <span className="material-symbols-outlined text-[32px] text-text-secondary group-hover:text-text-main">description</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-text-main mb-2">Quero enviar informações via texto</h3>
                                    <p className="text-sm text-text-secondary mb-8">Escreva uma mensagem personalizada ou explicação técnica para o cliente.</p>
                                    <Button onClick={() => setModalView('form')} className="mt-auto w-full bg-primary hover:bg-primary-hover text-text-main font-bold py-3 rounded-lg shadow-glow transition-all">
                                        Escrever Mensagem
                                    </Button>
                                </div>
                                <div className="group relative bg-white border border-gray-100 rounded-xl p-6 hover:border-primary transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                        <span className="material-symbols-outlined text-[32px] text-text-secondary group-hover:text-text-main">apartment</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-text-main mb-2">Quero selecionar imóveis da minha carteira</h3>
                                    <p className="text-sm text-text-secondary mb-8">Abra seu catálogo e vincule diretamente um ou mais imóveis cadastrados.</p>
                                    <Button onClick={() => setModalView('catalog')} className="mt-auto w-full bg-primary hover:bg-primary-hover text-text-main font-bold py-3 rounded-lg shadow-glow transition-all">
                                        Abrir Catálogo
                                    </Button>
                                </div>
                            </div>
                            <div className="px-8 pb-8 pt-4 flex justify-center">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
                                        Cancelar
                                    </Button>
                                </DialogClose>
                            </div>
                        </>
                    ) : modalView === 'form' ? (
                        <>
                           <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                                <h2 className="text-xl font-bold tracking-tight text-text-main">Enviar Sugestão Personalizada</h2>
                            </div>
                            <form className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Valor Sugerido</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">R$</span>
                                            <Input className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-text-main bg-gray-50/30" placeholder="0,00" type="text"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tamanho (m²)</Label>
                                        <div className="relative">
                                            <Input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-text-main bg-gray-50/30" placeholder="Ex: 120" type="number"/>
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">m²</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bairro</Label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium text-[20px]">location_on</span>
                                        <Input className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-text-main bg-gray-50/30" placeholder="Ex: Jardins, Itaim Bibi" type="text"/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Número de Quartos</Label>
                                    <select defaultValue="" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-text-main bg-gray-50/30 custom-select">
                                        <option disabled value="">Selecione a quantidade</option>
                                        <option value="1">1 Quarto</option>
                                        <option value="2">2 Quartos</option>
                                        <option value="3">3 Quartos</option>
                                        <option value="4">4 Quartos</option>
                                        <option value="5+">5+ Quartos</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Descrição e Detalhes</Label>
                                    <Textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-text-main bg-gray-50/30 resize-none" placeholder="Descreva os diferenciais, acabamentos ou informações técnicas adicionais..." rows={4}></Textarea>
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <Button onClick={() => setModalView('options')} className="flex-1 bg-white border border-gray-200 hover:border-gray-300 text-text-main font-bold py-3.5 rounded-xl transition-all" type="button">
                                        Voltar
                                    </Button>
                                    <Button className="flex-[2] bg-primary hover:bg-primary-hover text-text-main font-bold py-3.5 rounded-xl shadow-glow transition-all flex items-center justify-center gap-2" type="submit">
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                        Enviar para o Cliente
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                      <div className="bg-white w-full h-[85vh] rounded-2xl shadow-modal overflow-hidden flex flex-col">
                          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                              <div className="flex items-center justify-between mb-6">
                                  <h2 className="text-2xl font-bold tracking-tight text-text-main">Selecionar Imóveis da Carteira</h2>
                              </div>
                              <div className="space-y-4">
                                  <div className="relative group">
                                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-text-main transition-colors">search</span>
                                      <input className="w-full bg-gray-50 border-gray-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary transition-all outline-none" placeholder="Buscar por nome ou código" type="text"/>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-text-secondary hover:border-primary hover:text-text-main transition-all">
                                          Tipo de Imóvel
                                          <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                          <div className="flex-grow overflow-y-auto px-8 py-6 space-y-4">
                             {isLoading ? <p>Carregando imóveis...</p> : allSelectableProperties.map(property => (
                              <label key={property.id} className="group flex items-center gap-6 p-4 rounded-xl border border-gray-50 hover:border-primary/50 hover:bg-gray-50/50 transition-all cursor-pointer">
                                  <div className="size-20 rounded-lg overflow-hidden flex-shrink-0">
                                      <Image alt={property.informacoesbasicas.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={property.midia?.[0] || `https://picsum.photos/seed/${property.id}/200/200`} width={80} height={80}/>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-0.5">ID #{property.id.substring(0,6)}</p>
                                      <h4 className="font-bold text-text-main text-base truncate">{property.informacoesbasicas.nome}</h4>
                                      <p className="text-xs text-text-secondary flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                                          {property.localizacao.bairro}, {property.localizacao.cidade}
                                      </p>
                                      <p className="text-sm font-bold text-text-main mt-1">{property.informacoesbasicas.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                  </div>
                                  <div className="flex-shrink-0 px-4">
                                      <Checkbox
                                          className="size-6 rounded-md border-gray-300 text-primary focus:ring-primary custom-checkbox cursor-pointer"
                                          checked={selectedProperties.includes(property.id)}
                                          onCheckedChange={(checked) => {
                                              setSelectedProperties(prev => 
                                                  checked ? [...prev, property.id] : prev.filter(id => id !== property.id)
                                              );
                                          }}
                                      />
                                  </div>
                              </label>
                             ))}
                          </div>
                          <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-between">
                              <Button type="button" variant="ghost" onClick={() => setModalView('options')}>Voltar</Button>
                              <Button className="bg-primary hover:bg-primary-hover text-text-main font-bold py-3 px-8 rounded-lg shadow-glow transition-all flex items-center gap-2">
                                  Confirmar Seleção ({selectedProperties.length})
                              </Button>
                          </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}


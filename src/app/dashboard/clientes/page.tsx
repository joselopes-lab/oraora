

'use client';
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useAuthContext } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

const ClientSideDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        setFormattedDate(new Date(dateString).toLocaleDateString('pt-BR'));
    }, [dateString]);

    return <>{formattedDate || '...'}</>;
}


type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost';
  createdAt: string;
}

export default function ClientListPage() {
  const firestore = useFirestore();
  const { user, userProfile } = useAuthContext();

  const leadsQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      if (userProfile?.userType === 'admin') {
        return query(collection(firestore, 'leads'));
      }
      return query(collection(firestore, 'leads'), where('brokerId', '==', user.uid));
    },
    [firestore, user, userProfile]
  );
  
  const { data: clients, isLoading, error } = useCollection<Lead>(leadsQuery);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Listagem de Clientes</h1>
          <p className="text-text-secondary mt-1">Gerencie leads, históricos de contato e carteira de clientes.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
            <Link href="/dashboard/clientes/nova">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Cadastrar Novo Cliente
            </Link>
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mb-8">
        <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
          Filtros de Busca
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Nome ou E-mail</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input className="w-full pl-9 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Buscar cliente..." type="text" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Status</label>
            <div className="relative">
              <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                <option value="">Todos</option>
                <option value="new">Novo</option>
                <option value="contacted">Em Atendimento</option>
                <option value="proposal">Proposta</option>
                <option value="converted">Finalizado</option>
                <option value="lost">Perdido</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Origem do Lead</label>
            <div className="relative">
              <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                <option value="">Todas</option>
                <option value="site">Site</option>
                <option value="indicacao">Indicação</option>
                <option value="portal">Portal Imobiliário</option>
                <option value="instagram">Instagram</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Interesse</label>
            <div className="relative">
              <select className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                <option value="">Qualquer</option>
                <option value="compra">Compra</option>
                <option value="aluguel">Aluguel</option>
                <option value="investimento">Investimento</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-secondary">
                <th className="px-6 py-4 font-semibold">Nome Completo</th>
                <th className="px-6 py-4 font-semibold">Contatos</th>
                <th className="px-6 py-4 font-semibold">Interesse / Origem</th>
                <th className="px-6 py-4 font-semibold text-center">Cadastro</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading && (
              <tr><td colSpan={6} className="text-center p-6">Carregando clientes...</td></tr>
            )}
            {!isLoading && error && (
              <tr><td colSpan={6} className="text-center p-6 text-red-500">Erro ao carregar clientes.</td></tr>
            )}
            {!isLoading && clients?.map(client => (
              <tr key={client.id} className="group hover:bg-background-light transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 text-primary-hover font-bold flex items-center justify-center shrink-0 border border-primary/10">{client.name.charAt(0)}</div>
                    <div>
                      <Link href={`/dashboard/clientes/${client.id}`} className="font-bold text-text-main text-base hover:text-primary transition-colors">{client.name}</Link>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-text-main font-medium text-xs">
                      <span className="material-symbols-outlined text-gray-400 text-[16px]">mail</span>
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-xs">
                      <span className="material-symbols-outlined text-green-500 text-[16px]">chat</span>
                      {client.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-text-main font-medium">{client.propertyInterest || 'Não especificado'}</div>
                  <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">link</span> {client.source || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-text-secondary font-medium text-xs"><ClientSideDate dateString={client.createdAt} /></span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${client.status === 'new' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon" className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors" title="Ver Detalhes">
                      <Link href={`/dashboard/clientes/${client.id}`}>
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                    </Button>
                    <button className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{clients?.length || 0}</span> de <span className="font-bold text-text-main">{clients?.length || 0}</span> clientes</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-200 rounded text-text-secondary hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 text-sm bg-primary text-text-main font-bold rounded hover:bg-primary-hover">1</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded text-text-secondary hover:bg-gray-50">Próximo</button>
          </div>
        </div>
      </div>
    </>
  )
}

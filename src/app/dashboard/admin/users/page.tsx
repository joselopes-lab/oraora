
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

type User = {
  id: string;
  username: string;
  email: string;
  userType: 'admin' | 'broker' | 'constructor';
  lastAccess?: string; 
  isActive: boolean;
  slug?: string; // slug for broker's public site
  planId?: string;
};

type Plan = {
  id: string;
  name: string;
};


export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<'admin' | 'constructor' | 'broker'>('admin');
    const [searchTerm, setSearchTerm] = useState('');
    const firestore = useFirestore();
    const { toast } = useToast();
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users')) : null),
        [firestore]
    );

    const brokersQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'brokers')) : null),
      [firestore]
    );

    const plansQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'plans')) : null),
        [firestore]
    );

    const { data: initialUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);
    const { data: brokers, isLoading: areBrokersLoading } = useCollection<{id: string, slug: string}>(brokersQuery);
    const { data: plans, isLoading: arePlansLoading } = useCollection<Plan>(plansQuery);


    const [users, setUsers] = useState<User[]>([]);
    
    const planNameMap = useMemo(() => {
        if (!plans) return {};
        return plans.reduce((acc, plan) => {
            acc[plan.id] = plan.name;
            return acc;
        }, {} as Record<string, string>);
    }, [plans]);

    useEffect(() => {
        if (initialUsers && brokers) {
            const brokerSlugs = new Map(brokers.map(b => [b.id, b.slug]));
            const combinedUsers = initialUsers.map(user => ({
                ...user,
                slug: user.userType === 'broker' ? brokerSlugs.get(user.id) : undefined,
            }));
            setUsers(combinedUsers);
        } else if (initialUsers) {
             setUsers(initialUsers);
        }
    }, [initialUsers, brokers]);

    const handleDelete = () => {
      if (!userToDelete || !firestore) return;
      
      const userDocRef = doc(firestore, 'users', userToDelete.id);
      deleteDocumentNonBlocking(userDocRef);

      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));

      toast({
        title: "Usuário excluído!",
        description: `O cadastro de "${userToDelete.username}" foi removido com sucesso.`,
      });

      setUserToDelete(null); // Close the dialog
    };
    
    const handleStatusChange = (user: User, newStatus: boolean) => {
      if (!firestore) return;

      const userDocRef = doc(firestore, 'users', user.id);
      setDocumentNonBlocking(userDocRef, { isActive: newStatus }, { merge: true });
      
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
      
      toast({
        title: "Status alterado!",
        description: `O usuário "${user.username}" foi ${newStatus ? 'ativado' : 'desativado'}.`,
      });
    }

    const filteredUsers = useMemo(() => {
      if (!users) return [];
      return users.filter(user => 
        user.userType === activeTab &&
        (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }, [users, activeTab, searchTerm]);
    
    const isUserListLoading = areUsersLoading || isAuthUserLoading || areBrokersLoading || arePlansLoading;


  return (
    <AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Gestão de Usuários</h1>
          <p className="text-text-secondary">Gerencie acessos, permissões e cadastro de novos membros.</p>
        </div>
        <Button asChild className="bg-secondary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
          <Link href="/dashboard/admin/users/nova">
            <span className="material-symbols-outlined">add</span>
            Novo Usuário
          </Link>
        </Button>
      </div>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 px-6 pt-4 pb-0 bg-white">
          <div className="flex items-center w-full sm:w-auto overflow-x-auto gap-8">
            <button
              onClick={() => setActiveTab('admin')}
              className={`group relative pb-4 px-1 text-sm transition-colors ${activeTab === 'admin' ? 'font-bold text-text-main' : 'font-medium text-text-secondary hover:text-text-main'}`}
            >
              Administradores
              <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${activeTab === 'admin' ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'}`}></span>
              <span className={`ml-2 text-xs py-0.5 px-2 rounded-full transition-colors ${activeTab === 'admin' ? 'bg-primary/20 text-text-main' : 'bg-gray-50 text-text-secondary'}`}>{users?.filter(u => u.userType === 'admin').length || 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('constructor')}
              className={`group relative pb-4 px-1 text-sm transition-colors ${activeTab === 'constructor' ? 'font-bold text-text-main' : 'font-medium text-text-secondary hover:text-text-main'}`}
            >
              Construtoras
              <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${activeTab === 'constructor' ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'}`}></span>
              <span className={`ml-2 text-xs py-0.5 px-2 rounded-full transition-colors ${activeTab === 'constructor' ? 'bg-primary/20 text-text-main' : 'bg-gray-50 text-text-secondary'}`}>{users?.filter(u => u.userType === 'constructor').length || 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('broker')}
              className={`group relative pb-4 px-1 text-sm transition-colors ${activeTab === 'broker' ? 'font-bold text-text-main' : 'font-medium text-text-secondary hover:text-text-main'}`}
            >
              Corretores
              <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${activeTab === 'broker' ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'}`}></span>
              <span className={`ml-2 text-xs py-0.5 px-2 rounded-full transition-colors ${activeTab === 'broker' ? 'bg-primary/20 text-text-main' : 'bg-gray-50 text-text-secondary'}`}>{users?.filter(u => u.userType === 'broker').length || 0}</span>
            </button>
          </div>
          <div className="hidden sm:flex pb-3 pt-1">
            <button className="text-xs font-medium text-text-secondary hover:text-text-main flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Exportar Lista
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400"
              placeholder="Buscar por nome, email ou ID..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group">
              <select className="appearance-none bg-white border border-gray-200 text-text-secondary text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-primary cursor-pointer hover:border-gray-300 transition-colors w-full md:w-40">
                <option>Status: Todos</option>
                <option>Ativos</option>
                <option>Inativos</option>
                <option>Pendentes</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
            </div>
            <button className="bg-white border border-gray-200 hover:border-primary hover:text-primary text-text-secondary rounded-lg p-2.5 transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-text-secondary font-semibold tracking-wider">
                <TableHead className="px-6 py-4 font-bold">Usuário</TableHead>
                <TableHead className="px-6 py-4 font-bold">Função</TableHead>
                <TableHead className="px-6 py-4 font-bold">Plano</TableHead>
                <TableHead className="px-6 py-4 font-bold">Status</TableHead>
                <TableHead className="px-6 py-4 font-bold">Último Acesso</TableHead>
                <TableHead className="px-6 py-4 font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 bg-white">
            {isUserListLoading && (
                Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell colSpan={6} className="p-6 text-center">Carregando usuários...</TableCell>
                    </TableRow>
                ))
            )}
            {!isUserListLoading && filteredUsers?.map(user => (
              <TableRow key={user.id} className="group hover:bg-background-light/50 transition-colors">
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      
                      <span className="w-full h-full flex items-center justify-center bg-primary text-text-main font-bold">{user.username.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">{user.username}</p>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {user.userType === 'admin' && 'Administrador'}
                    {user.userType === 'broker' && 'Corretor'}
                    {user.userType === 'constructor' && 'Construtor'}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-text-secondary">{planNameMap[user.planId || ''] || 'N/A'}</span>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className='flex items-center gap-2'>
                        <Switch
                          id={`status-${user.id}`}
                          checked={user.isActive}
                          onCheckedChange={(newStatus) => handleStatusChange(user, newStatus)}
                        />
                        <span className={`text-xs font-bold ${user.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  Hoje, 10:30
                </TableCell>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {user.userType === 'broker' && user.slug && (
                      <Button asChild variant="ghost" className="text-text-main hover:text-text-main p-1" title="Ver Site">
                        <Link href={`/sites/${user.slug}`} target="_blank">
                          <span className="material-symbols-outlined text-[20px]">public</span>
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" className="text-text-main hover:text-text-main p-1" title="Editar">
                      <Link href={`/dashboard/admin/users/editar/${user.id}`}>
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                    </Button>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" className="text-text-secondary hover:text-red-500 p-1" title="Remover" onClick={() => setUserToDelete(user)}>
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                </td>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <p className="text-xs text-text-secondary">Mostrando <span className="font-bold text-text-main">1-{filteredUsers?.length || 0}</span> de <span className="font-bold text-text-main">{filteredUsers?.length || 0}</span> usuários</p>
          <div className="flex items-center gap-2">
            <button className="size-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="size-8 rounded bg-primary text-text-main text-xs font-bold flex items-center justify-center shadow-sm">1</button>
            <button className="size-8 rounded border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o cadastro do usuário <span className="font-bold">{userToDelete?.username}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

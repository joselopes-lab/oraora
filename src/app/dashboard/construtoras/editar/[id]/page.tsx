
'use client';
import { useRouter, useParams } from 'next/navigation';
import ConstructorForm, { ConstructorFormData } from '../../components/constructor-form';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuth, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { createConstructorMemberServer } from '../../actions.server';

type ConstructorDoc = {
    id: string;
    userId: string;
    websiteUrl: string;
    name: string;
    cnpj: string;
    stateRegistration: string;
    address: string;
    state: string;
    city: string;
    zip: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    publicEmail: string;
    logoUrl: string;
    isVisibleOnSite: boolean;
    members?: { uid: string; role: 'admin' | 'gerente' | 'vendas' | 'marketing' }[];
};

type UserDoc = {
    id: string;
    username: string;
    email: string;
};

export default function EditConstructorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params as { id: string };
    const firestore = useFirestore();
    const { toast } = useToast();
    const auth = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const constructorDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'constructors', id) : null),
      [firestore, id]
    );
    const { data: constructorDoc, isLoading: isConstructorLoading } = useDoc<ConstructorDoc>(constructorDocRef);

    const usersQuery = useMemoFirebase(
        () => (firestore && id ? query(collection(firestore, 'users'), where('tenantId', '==', id)) : null),
        [firestore, id]
    );
    const { data: constructorUsers } = useCollection<any>(usersQuery);

    const userMap = useMemo(() => {
        const map = new Map<string, any>();
        constructorUsers?.forEach(u => map.set(u.id, u));
        return map;
    }, [constructorUsers]);

    const userDocRef = useMemoFirebase(
      () => (firestore && id ? doc(firestore, 'users', id) : null),
      [firestore, id]
    );
    const { data: userDoc, isLoading: isUserLoading } = useDoc<UserDoc>(userDocRef);

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberPassword, setMemberPassword] = useState('');
    const [memberRole, setMemberRole] = useState<'admin' | 'gerente' | 'vendas' | 'marketing'>('vendas');
    const [isSubmittingMember, setIsSubmittingMember] = useState(false);

    const handleAddMember = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!memberName || !memberEmail || !memberPassword) {
        toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios.' });
        return;
      }
      setIsSubmittingMember(true);
      try {
        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) {
          toast({ variant: 'destructive', title: 'Usuário não autenticado.' });
          setIsSubmittingMember(false);
          return;
        }
        const result = await createConstructorMemberServer({
          constructorId: id,
          name: memberName,
          email: memberEmail,
          password: memberPassword,
          role: memberRole,
          idToken,
        });
        if (result.success) {
          toast({ title: 'Membro Adicionado!', description: `O usuário ${memberName} foi cadastrado com sucesso.` });
          setIsAddMemberOpen(false);
          setMemberName('');
          setMemberEmail('');
          setMemberPassword('');
          setMemberRole('vendas');
        } else {
          toast({ variant: 'destructive', title: 'Erro ao cadastrar membro', description: result.error });
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Erro', description: err.message || 'Erro inesperado.' });
      } finally {
        setIsSubmittingMember(false);
      }
    };

    const handleSave = async (data: ConstructorFormData) => {
        if (!firestore || !id) return;
        setIsSubmitting(true);

        try {
            // Update constructor document
            const constructorDataToUpdate = {
                websiteUrl: data.website || '',
                name: data.name,
                cnpj: data.cnpj || '',
                stateRegistration: data.stateRegistration || '',
                address: data.address || '',
                state: data.state,
                city: data.city,
                zip: data.zip || '',
                phone: data.phone || '',
                whatsapp: data.whatsapp || '',
                instagram: data.instagram || '',
                publicEmail: data.publicEmail || '',
                logoUrl: data.logoUrl || '',
                isVisibleOnSite: data.isVisibleOnSite,
                accessEmail: data.accessEmail
            };
            setDocumentNonBlocking(constructorDocRef!, constructorDataToUpdate, { merge: true });

            // Update user document (The contact/display email in Firestore)
            const userDataToUpdate = {
                username: data.name,
                email: data.accessEmail
            };
            setDocumentNonBlocking(userDocRef!, userDataToUpdate, { merge: true });

            toast({
                title: 'Dados Atualizados!',
                description: `As informações de "${data.name}" foram salvas no banco de dados.`,
            });
            router.push('/dashboard/construtoras');

        } catch (error: any) {
            console.error("Erro ao atualizar construtora: ", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Algo deu errado.",
                description: "Não foi possível atualizar os dados da construtora.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (email: string) => {
        if (!email || !auth) {
            toast({
                variant: "destructive",
                title: "Dados insuficientes",
                description: "O serviço de autenticação não está pronto ou o e-mail está vazio.",
            });
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Comando enviado!",
                description: `Um link de redefinição de senha foi disparado para ${email}. Peça para verificarem a caixa de entrada.`,
            });
        } catch (error: any) {
            console.error("Erro ao enviar e-mail de redefinição:", error);
            let description = "Não foi possível disparar o e-mail agora. Tente novamente mais tarde.";
            
            if (error.code === 'auth/user-not-found') {
                description = "Este e-mail não existe no sistema de login. Se você trocou o e-mail acima, deve primeiro alterá-lo manualmente no Console do Firebase para que a redefinição funcione.";
            } else if (error.code === 'auth/invalid-email') {
                description = "O e-mail digitado não é um formato válido.";
            }

            toast({
                variant: "destructive",
                title: "Erro de Sincronização",
                description: description,
            });
        }
    };
    
    const isLoading = isConstructorLoading || isUserLoading;

    if (isLoading) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p className="text-center py-20 text-slate-400 italic">Carregando dossiê da construtora...</p>
             </main>
        )
    }

    if (!constructorDoc || !userDoc) {
        return (
             <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
                <p>Construtora não encontrada.</p>
             </main>
        )
    }

    const formData = {
        ...constructorDoc,
        ...userDoc,
        website: constructorDoc.websiteUrl,
        accessEmail: userDoc.email,
        name: constructorDoc.name,
    };

    return (
        <main className="flex-grow flex flex-col py-8 px-4 md:px-10 max-w-[1440px] mx-auto w-full space-y-8">
            <ConstructorForm 
                onSave={handleSave} 
                isEditing={true} 
                constructorData={formData} 
                isSubmitting={isSubmitting}
                onResetPassword={handleResetPassword}
            />

            <section className="bg-white rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-secondary">group</span>
                        Usuários da Construtora
                        <span className="text-sm font-normal text-text-secondary bg-white px-2 py-0.5 rounded-full border border-card-border ml-2">{constructorDoc.members?.length || 0} membros</span>
                    </h3>
                    <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="text-sm font-bold bg-primary text-text-main hover:bg-primary-hover flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Adicionar usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white">
                            <DialogHeader>
                                <DialogTitle>Adicionar usuário</DialogTitle>
                                <DialogDescription>Cadastre um novo usuário para esta construtora.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMember} className="space-y-4 py-2">
                                <div>
                                    <label className="text-xs font-bold text-text-main uppercase">Nome</label>
                                    <input type="text" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Nome completo" value={memberName} onChange={e => setMemberName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-main uppercase">Email de Acesso</label>
                                    <input type="email" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="email@construtora.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-main uppercase">Senha Inicial</label>
                                    <input type="password" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="********" value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-main uppercase">Cargo / Papel</label>
                                    <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white" value={memberRole} onChange={e => setMemberRole(e.target.value as any)}>
                                        <option value="admin">Admin</option>
                                        <option value="gerente">Gerente</option>
                                        <option value="vendas">Vendas</option>
                                        <option value="marketing">Marketing</option>
                                    </select>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmittingMember} className="bg-primary text-text-main hover:bg-primary-hover font-bold">
                                        {isSubmittingMember ? 'Salvando...' : 'Criar Membro'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="divide-y divide-card-border">
                    {constructorDoc.members && constructorDoc.members.length > 0 ? (
                        constructorDoc.members.map((m: any, idx: number) => {
                            const uData = userMap.get(m.uid);
                            const name = uData?.username || uData?.name || (m.uid === id ? constructorDoc.name : 'Membro da Construtora');
                            const email = uData?.email || constructorDoc.publicEmail || 'Sem e-mail cadastrado';
                            const isActive = uData?.isActive !== false;
                            const roleLabel = m.role === 'admin' ? 'Administrador' : m.role === 'gerente' ? 'Gerente' : m.role === 'marketing' ? 'Marketing' : 'Vendas';
                            return (
                                <div key={m.uid || idx} className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text-main truncate">{name}</p>
                                            <p className="text-xs text-text-secondary truncate">{email}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID técnico: {m.uid}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="px-2.5 py-1 text-xs font-semibold uppercase border rounded-md bg-white text-text-main">{roleLabel}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                            {isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-text-secondary">
                            <p>Nenhum membro registrado além do proprietário.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

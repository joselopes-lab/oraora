
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useState } from "react";

// Define a placeholder type for user data
export type UserFormData = {
    name: string;
    userType: 'admin' | 'broker' | 'constructor';
    cpf?: string;
    creci?: string;
    cnpj?: string;
    address?: string;
    state?: string;
    city?: string;
    isActive: boolean;
    email: string;
    phone?: string;
    whatsapp?: string;
    avatarUrl?: string;
    planId?: string;
};

type Plan = {
  id: string;
  name: string;
  type: 'corretor' | 'construtora' | 'admin';
};


type UserFormProps = {
    userData?: Partial<UserFormData>;
    onSave: (data: UserFormData) => void;
    isEditing: boolean;
};

export default function UserForm({ userData, onSave, isEditing }: UserFormProps) {
    const firestore = useFirestore();

    const plansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'plans')) : null, [firestore]);
    const { data: plans, isLoading: arePlansLoading } = useCollection<Plan>(plansQuery);
    
    const [currentUserType, setCurrentUserType] = useState(userData?.userType || 'broker');
    
    const userTypeToPlanTypeMap = {
        broker: 'corretor',
        constructor: 'construtora',
        admin: 'admin', 
    };

    const planTypeForFilter = userTypeToPlanTypeMap[currentUserType as keyof typeof userTypeToPlanTypeMap] || '';
    const filteredPlans = plans?.filter(plan => plan.type === planTypeForFilter) || [];


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: UserFormData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            userType: formData.get('userType') as 'admin' | 'broker' | 'constructor',
            cpf: formData.get('cpf') as string,
            creci: formData.get('creci') as string,
            cnpj: formData.get('cnpj') as string,
            address: formData.get('address') as string,
            state: formData.get('state') as string,
            city: formData.get('city') as string,
            phone: formData.get('phone') as string,
            whatsapp: formData.get('whatsapp') as string,
            isActive: (formData.get('isActive') === 'on'),
            planId: formData.get('planId') as string,
            avatarUrl: userData?.avatarUrl || ''
        };
        onSave(data);
    };


    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link className="text-text-secondary hover:text-primary transition-colors text-sm flex items-center gap-1" href="/dashboard/admin/users">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Voltar para Lista de Usuários
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h1>
                    <p className="text-text-secondary mt-1">Gerencie as informações pessoais, permissões e credenciais de acesso.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild className="bg-white border border-gray-200 hover:bg-gray-50 text-text-main font-medium py-2.5 px-5 rounded-lg transition-all duration-300">
                       <Link href="/dashboard/admin/users">Cancelar</Link>
                    </Button>
                    <Button type="submit" className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Salvar
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4">Dados Pessoais &amp; Perfil</h3>
                        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                            <div className="w-full md:w-auto flex flex-col items-center gap-3">
                                <div className="relative size-32 bg-gray-50 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors group cursor-pointer">
                                    {userData?.avatarUrl && <img alt="User Avatar" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" src={userData.avatarUrl} />}
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary z-10 text-[32px]">account_circle</span>
                                    <span className="text-xs text-gray-400 font-medium z-10 group-hover:text-text-main mt-1">Alterar Foto</span>
                                    <input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file" />
                                </div>
                                <p className="text-[10px] text-text-secondary text-center max-w-[128px]">JPG ou PNG até 2MB</p>
                            </div>
                            <div className="flex-1 w-full space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-text-main mb-1.5">Nome do Usuário <span className="text-red-500">*</span></label>
                                        <Input name="name" defaultValue={userData?.name} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Ex: Nome Completo" type="text" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1.5">Tipo de Usuário <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select name="userType" defaultValue={userData?.userType || ""} onChange={e => setCurrentUserType(e.target.value as UserFormData['userType'])} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                                <option disabled value="">Selecione</option>
                                                <option value="admin">Administrador</option>
                                                <option value="broker">Corretor</option>
                                                <option value="constructor">Construtora</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                        </div>
                                    </div>
                                     {(currentUserType === 'broker' || currentUserType === 'constructor') && (
                                        <div>
                                            <label className="block text-sm font-medium text-text-main mb-1.5">Plano de Assinatura</label>
                                            <div className="relative">
                                                <select name="planId" defaultValue={userData?.planId || ""} disabled={arePlansLoading} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer disabled:bg-gray-200">
                                                    <option value="">{arePlansLoading ? 'Carregando...' : 'Nenhum Plano'}</option>
                                                    {filteredPlans.map(plan => (
                                                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                            </div>
                                        </div>
                                     )}
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1.5">CPF</label>
                                        <Input name="cpf" defaultValue={userData?.cpf} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="000.000.000-00" type="text" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-5 border border-dashed border-gray-200 mt-6">
                            <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">badge</span>
                                Dados Profissionais (Corretor/Construtora)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">CRECI (Se Corretor)</label>
                                    <Input name="creci" defaultValue={userData?.creci} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Ex: 12345-F" type="text" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">CNPJ (Se Construtora)</label>
                                    <Input name="cnpj" defaultValue={userData?.cnpj} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="00.000.000/0000-00" type="text" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
                        <h4 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4">Endereço Residencial</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-text-main mb-1.5">Endereço Completo</label>
                                <Input name="address" defaultValue={userData?.address} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="Rua, Número, Bairro, Complemento" type="text" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Estado</label>
                                <div className="relative">
                                    <select name="state" defaultValue={userData?.state} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                        <option value="SP">São Paulo (SP)</option>
                                        <option value="RJ">Rio de Janeiro (RJ)</option>
                                        <option value="MG">Minas Gerais (MG)</option>
                                        <option value="PR">Paraná (PR)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Cidade</label>
                                <div className="relative">
                                    <select name="city" defaultValue={userData?.city} className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer">
                                        <option value="Sao Paulo">São Paulo</option>
                                        <option value="Campinas">Campinas</option>
                                        <option value="Santos">Santos</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[20px]">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">lock</span>
                            Credenciais &amp; Status
                        </h3>
                        <div className="space-y-5">
                            <div className="p-4 bg-background-light rounded-lg border border-gray-200">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-bold text-text-main">Status do Usuário</span>
                                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                        <input name="isActive" defaultChecked={userData?.isActive} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer peer" id="toggle_active" type="checkbox" />
                                        <label htmlFor="toggle_active" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                    </div>
                                </label>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-block size-2 rounded-full bg-secondary"></span>
                                    <p className="text-xs text-text-secondary">Usuário Ativo (Pode acessar)</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Email de Acesso</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                                    <Input name="email" defaultValue={userData?.email} className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" type="email" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Senha</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">key</span>
                                    <Input name="password" className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="********" type="password" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Confirmar Senha</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock_reset</span>
                                    <Input name="confirmPassword" className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" placeholder="********" type="password" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 md:p-8 h-full">
                        <h3 className="text-lg font-bold text-text-main mb-6 border-b border-gray-100 pb-4">Contato Rápido</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">Telefone / Celular</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">smartphone</span>
                                    <Input name="phone" defaultValue={userData?.phone} className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" type="tel" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1.5">WhatsApp</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-[20px]">chat</span>
                                    <Input name="whatsapp" defaultValue={userData?.whatsapp} className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-400" type="tel" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

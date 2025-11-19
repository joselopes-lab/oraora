
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, PlusCircle, FilePen, Trash2, X, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceAnnual?: number;
  type: 'corretor' | 'construtora';
  description?: string;
  features: string[];
  userLimit?: number;
  propertyLimit?: number;
  storageLimit?: number;
  isFree?: boolean;
}

interface User {
    id: string;
    name: string;
    planId: string;
}

const getInitialState = (): Omit<Plan, 'id'> => ({
    name: '',
    price: 0,
    priceAnnual: 0,
    type: 'corretor',
    description: '',
    features: [],
    isFree: false,
});

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>(getInitialState());
  const [featureInput, setFeatureInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  
  const [formattedPrice, setFormattedPrice] = useState('');
  const [formattedAnnualPrice, setFormattedAnnualPrice] = useState('');

  useEffect(() => {
    const unsubscribePlans = onSnapshot(collection(db, 'plans'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
        data.sort((a, b) => a.price - b.price);
        setPlans(data);
        setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar planos: ", error);
        toast({ variant: 'destructive', title: 'Falha ao carregar planos' });
        setIsLoading(false);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, planId: doc.data().planId } as User));
        setUsers(usersData);
    });


    return () => {
        unsubscribePlans();
        unsubscribeUsers();
    };
  }, [toast]);
  
  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setCurrentPlan(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setCurrentPlan(prev => ({
        ...prev,
        features: (prev.features || []).filter((_, i) => i !== index)
    }));
  }

  const openDialog = (plan: Plan | null = null) => {
    if (plan) {
        setIsEditing(true);
        setCurrentPlan(plan);
        setFormattedPrice(plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
        setFormattedAnnualPrice(plan.priceAnnual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
    } else {
        setIsEditing(false);
        setCurrentPlan(getInitialState());
        setFormattedPrice('');
        setFormattedAnnualPrice('');
    }
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPlan.name || typeof currentPlan.price !== 'number') {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e Preço Mensal são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);
    
    const planData: Partial<Plan> = { ...currentPlan };
    delete planData.id;

    if (!planData.priceAnnual) {
        delete (planData as any).priceAnnual;
    }

    try {
      if (isEditing && currentPlan.id) {
        await updateDoc(doc(db, 'plans', currentPlan.id), planData);
        toast({ title: 'Plano Atualizado!' });
      } else {
        await addDoc(collection(db, 'plans'), planData);
        toast({ title: 'Plano Salvo!' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDeleteAlert = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteDoc(doc(db, 'plans', planToDelete.id));
      toast({ title: 'Plano Deletado' });
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const onlyDigits = value.replace(/\D/g, '');
    const numberValue = Number(onlyDigits) / 100;
    
    setFormattedPrice(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setCurrentPlan(p => ({...p, price: numberValue }));
  };

  const handleAnnualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const onlyDigits = value.replace(/\D/g, '');
    const numberValue = Number(onlyDigits) / 100;
    
    setFormattedAnnualPrice(numberValue > 0 ? numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
    setCurrentPlan(p => ({...p, priceAnnual: numberValue > 0 ? numberValue : undefined }));
  };

  const usersByPlan = users.reduce((acc, user) => {
      if (user.planId) {
          if (!acc[user.planId]) {
              acc[user.planId] = [];
          }
          acc[user.planId].push(user);
      }
      return acc;
  }, {} as Record<string, User[]>);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Package /> Planos e Assinaturas</CardTitle>
            <CardDescription>Crie e gerencie os planos para corretores e construtoras.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => openDialog()}>
            <PlusCircle className="h-4 w-4" /> Cadastrar Plano
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome do Plano</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Limites</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans.map((plan) => {
                        const planUsers = usersByPlan[plan.id] || [];
                        return (
                        <TableRow key={plan.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {plan.name}
                                {plan.isFree && <Badge variant="outline">Gratuito</Badge>}
                            </TableCell>
                            <TableCell><Badge variant={plan.type === 'construtora' ? 'default' : 'secondary'}>{plan.type === 'construtora' ? 'Construtora' : 'Corretor'}</Badge></TableCell>
                            <TableCell>
                                {formatCurrency(plan.price)}/mês
                                {plan.priceAnnual && <span className="text-xs text-muted-foreground block">{formatCurrency(plan.priceAnnual)}/ano</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                                {plan.userLimit != null && <div>Usuários: {plan.userLimit}</div>}
                                {plan.propertyLimit != null && <div>Imóveis: {plan.propertyLimit}</div>}
                                {plan.storageLimit != null && <div>Mídia: {plan.storageLimit}MB</div>}
                            </TableCell>
                            <TableCell>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto flex items-center gap-2" disabled={planUsers.length === 0}>
                                            <Users className="h-4 w-4"/>
                                            {planUsers.length}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Usuários no plano "{plan.name}"</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-4 max-h-80 overflow-y-auto">
                                            <ul className="space-y-2">
                                                {planUsers.map(u => <li key={u.id} className="text-sm">{u.name}</li>)}
                                            </ul>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => openDialog(plan)}><FilePen className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(plan)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Plano' : 'Cadastrar Novo Plano'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[75vh] overflow-y-auto pr-4">
                    <div className="grid md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome do Plano</Label>
                            <Input id="name" value={currentPlan.name || ''} onChange={(e) => setCurrentPlan(p => ({...p, name: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select onValueChange={(v) => setCurrentPlan(p => ({...p, type: v as any}))} value={currentPlan.type}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="corretor">Corretor</SelectItem>
                                    <SelectItem value="construtora">Construtora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Descrição do Plano</Label>
                        <Textarea id="description" placeholder="Ex: Ideal para corretores iniciantes..." value={currentPlan.description || ''} onChange={(e) => setCurrentPlan(p => ({...p, description: e.target.value}))} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço Mensal (R$)</Label>
                            <Input id="price" type="text" value={formattedPrice} onChange={handlePriceChange} placeholder="R$ 0,00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priceAnnual">Preço Anual (R$)</Label>
                            <Input id="priceAnnual" type="text" value={formattedAnnualPrice} onChange={handleAnnualPriceChange} placeholder="R$ 0,00" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="userLimit">Limite de Usuários</Label>
                            <Input id="userLimit" type="number" value={currentPlan.userLimit || ''} onChange={(e) => setCurrentPlan(p => ({...p, userLimit: parseInt(e.target.value) || undefined}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="propertyLimit">Limite de Imóveis</Label>
                            <Input id="propertyLimit" type="number" value={currentPlan.propertyLimit || ''} onChange={(e) => setCurrentPlan(p => ({...p, propertyLimit: parseInt(e.target.value) || undefined}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storageLimit">Mídia (MB)</Label>
                            <Input id="storageLimit" type="number" value={currentPlan.storageLimit || ''} onChange={(e) => setCurrentPlan(p => ({...p, storageLimit: parseInt(e.target.value) || undefined}))} />
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="isFree" checked={currentPlan.isFree} onCheckedChange={(checked) => setCurrentPlan(p => ({...p, isFree: checked}))} />
                        <Label htmlFor="isFree">Plano Gratuito (ativação imediata)</Label>
                    </div>
                    <div className="space-y-4 rounded-lg border p-4">
                        <Label>Recursos do Plano</Label>
                        <div className="flex items-center gap-2">
                           <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Ex: Suporte 24/7"/>
                           <Button type="button" onClick={handleAddFeature}>Adicionar</Button>
                        </div>
                         <div className="space-y-2">
                            {currentPlan.features?.map((feature, index) => (
                                <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                                    <span>{feature}</span>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFeature(index)}><X className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar'}
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita e irá deletar o plano <strong>{planToDelete?.name}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

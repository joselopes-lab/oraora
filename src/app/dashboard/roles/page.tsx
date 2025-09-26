
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const permissionGroups = {
  'Geral': [
    'Acessar Painel',
    'Acessar Log de Atividades',
    'Acessar Configurações',
    'Acessar Suporte',
    'Acessar Aparência',
  ],
  'Leads e Personas': [
    'Acessar Leads',
    'Acessar Personas',
    'Criar Personas',
    'Editar Personas',
    'Deletar Personas',
  ],
  'Leads de Parceiros': [
      'Acessar Leads de Construtoras',
      'Acessar Leads de Corretores',
  ],
  'Publicidade': [
    'Acessar Destaques',
    'Acessar Banners',
  ],
  'Usuários': [
    'Acessar Usuários',
    'Criar Usuários',
    'Editar Usuários',
    'Deletar Usuários',
  ],
  'Funções': [
    'Acessar Funções',
    'Criar Funções',
    'Editar Funções',
    'Deletar Funções',
  ],
  'Construtoras': [
    'Acessar Construtoras',
    'Criar Construtoras',
    'Editar Construtoras',
    'Deletar Construtoras',
  ],
  'Imóveis': [
    'Acessar Imóveis',
    'Criar Imóveis',
    'Editar Imóveis',
    'Deletar Imóveis',
  ],
};


export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Create/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Delete Dialog
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        const rolesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Role)
        );
        setRoles(rolesData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar funções: ', error);
        toast({
          variant: 'destructive',
          title: 'Falha ao carregar funções',
          description: 'Não foi possível obter os dados das funções do banco de dados.',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = new Set(selectedPermissions);
    if (checked) {
      newPermissions.add(permission);
    } else {
      newPermissions.delete(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const openDialog = (role: Role | null = null) => {
    if (role) {
      setIsEditing(true);
      setCurrentRole(role);
      setSelectedPermissions(new Set(role.permissions));
    } else {
      setIsEditing(false);
      setCurrentRole({ name: '' });
      setSelectedPermissions(new Set());
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentRole({});
    setSelectedPermissions(new Set());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentRole.name) {
      toast({
        variant: 'destructive',
        title: 'O nome da função é obrigatório',
      });
      return;
    }
    setIsSubmitting(true);

    const roleData = {
      name: currentRole.name,
      permissions: Array.from(selectedPermissions),
    };

    try {
      if (isEditing && currentRole.id) {
        const roleRef = doc(db, 'roles', currentRole.id);
        await updateDoc(roleRef, roleData);
        toast({ title: 'Função Atualizada', description: 'A função foi salva com sucesso.' });
      } else {
        // Checar se já existe uma função com o mesmo nome
        const q = query(collection(db, "roles"), where("name", "==", currentRole.name));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
           toast({ variant: 'destructive', title: 'Erro', description: 'Uma função com este nome já existe.' });
           setIsSubmitting(false);
           return;
        }

        await addDoc(collection(db, 'roles'), roleData);
        toast({ title: 'Função Criada', description: 'A nova função foi adicionada com sucesso.' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operação Falhou', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteDoc(doc(db, 'roles', roleToDelete.id));
      toast({ title: 'Função Deletada', description: 'A função foi removida.' });
      setIsDeleteAlertOpen(false);
      setRoleToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Funções</CardTitle>
            <CardDescription>
              Crie e edite funções de usuário e atribua permissões de acesso e ação.
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => openDialog()}>
            <PlusCircle className="h-4 w-4" />
            Criar Função
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Função</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="flex flex-wrap gap-1 max-w-md">
                    {role.permissions.map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => openDialog(role)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDeleteAlert(role)} className="text-destructive">
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Função' : 'Criar Nova Função'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Atualize os detalhes da função.' : 'Defina uma nova função e selecione suas permissões.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nome da Função</Label>
                <Input
                  id="role-name"
                  placeholder="ex: Gerente de Conteúdo"
                  value={currentRole.name || ''}
                  onChange={(e) =>
                    setCurrentRole({ ...currentRole, name: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="space-y-4 rounded-md border p-4 max-h-72 overflow-y-auto">
                  {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                    <div key={groupName} className="space-y-3">
                       <h4 className="text-sm font-medium">{groupName}</h4>
                       <div className="grid grid-cols-2 gap-4">
                          {permissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={permission}
                                checked={selectedPermissions.has(permission)}
                                onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor={permission} className="font-normal text-sm">
                                {permission}
                              </Label>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Criar Função')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente a função {' '}
              <strong>{roleToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

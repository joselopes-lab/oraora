
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PasswordStrength from '@/components/password-strength';
import { z } from 'zod';


interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  status: string;
}

interface Role {
  id: string;
  name: string;
}

const passwordSchema = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial.');


export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Create User Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // State for Edit User Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  
  // State for Delete Dialog
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar usuários: ", error);
      toast({
        variant: 'destructive',
        title: 'Falha ao carregar usuários',
        description: 'Não foi possível obter os dados dos usuários do banco de dados.',
      });
      setIsLoading(false);
    });

    const unsubscribeRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      let rolesData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Role));
      // Manually add "Corretor" if it doesn't exist as a formal role
        if (!rolesData.some(role => role.name === 'Corretor')) {
            rolesData.push({ id: 'corretor_role', name: 'Corretor' });
        }
      setRoles(rolesData);
      if (rolesData.length > 0 && !newRoleId) {
        setNewRoleId(rolesData[0].id); // Define um padrão
      }
    }, (error) => {
      console.error("Erro ao buscar funções: ", error);
      toast({
        variant: 'destructive',
        title: 'Falha ao carregar funções',
        description: 'Não foi possível obter as funções para seleção.',
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
    };
  }, [toast, newRoleId]);

  const resetCreateForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRoleId(roles.length > 0 ? roles[0].id : '');
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newRoleId) {
      toast({ variant: 'destructive', title: 'Campos faltando', description: 'Por favor, preencha todos os campos.' });
      return;
    }

    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast({ variant: 'destructive', title: 'Senha inválida', description: passwordValidation.error.errors[0].message });
      return;
    }

    setIsCreatingUser(true);
    
    // This is a temporary auth context for user creation.
    // The user will be created but not logged in here.
    try {
      // NOTE: This creates the user in the *client's* auth context.
      // For a real multi-user admin panel, this should be an Admin SDK call from a backend.
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const user = userCredential.user;

      // Set display name
      await updateProfile(user, { displayName: newName });
      
      const selectedRole = roles.find(r => r.id === newRoleId);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: newName,
        email: newEmail,
        role: selectedRole?.name || 'Sem função',
        roleId: newRoleId,
        status: 'Active',
        createdAt: new Date(),
      });

      toast({ title: 'Usuário Criado', description: 'Novo usuário foi adicionado com sucesso.' });
      resetCreateForm();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso por outro usuário.';
      }
      toast({ variant: 'destructive', title: 'Erro ao criar usuário', description: errorMessage });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, { status: newStatus });
      toast({ title: 'Usuário Atualizado', description: `Status do usuário alterado para ${newStatus === 'Active' ? 'Ativo' : 'Inativo'}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha na Atualização', description: error.message });
    }
  };

  const openDeleteAlert = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    // Note: This only deletes the user from Firestore.
    // Deleting from Firebase Auth requires admin privileges and should be done from a secure backend environment.
    const userRef = doc(db, 'users', userToDelete.id);
    try {
      await deleteDoc(userRef);
      toast({ title: 'Usuário Deletado', description: 'Usuário foi removido do banco de dados.' });
      setUserToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao Deletar', description: error.message });
      setUserToDelete(null);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    const userRef = doc(db, 'users', editingUser.id);
    try {
      const selectedRole = roles.find(r => r.id === editingUser.roleId);
      await updateDoc(userRef, {
        name: editingUser.name,
        role: selectedRole?.name || 'Sem função',
        roleId: editingUser.roleId
      });
      toast({ title: 'Usuário Atualizado', description: 'As informações do usuário foram salvas.' });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha na Atualização', description: error.message });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Visualize, crie e gerencie contas de usuário.</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>Preencha os detalhes para adicionar um novo usuário ao sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isCreatingUser} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={isCreatingUser} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isCreatingUser} />
                  </div>
                  <PasswordStrength password={newPassword} />
                  <div className="space-y-2">
                    <Label htmlFor="create-role">Função</Label>
                     <Select
                        value={newRoleId}
                        onValueChange={setNewRoleId}
                        disabled={isCreatingUser}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                             <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingUser}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreatingUser}>
                    {isCreatingUser ? <Loader2 className="animate-spin" /> : 'Criar Usuário'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'}>
                        {user.status === 'Active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog open={!!userToDelete && userToDelete.id === user.id} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleToggleStatus(user)}>
                              {user.status === 'Active' ? 'Desabilitar' : 'Habilitar'}
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteAlert(user); }} className="text-destructive">
                                Deletar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso irá deletar permanentemente os dados do usuário do banco de dados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize os detalhes do usuário aqui. Clique em salvar quando terminar.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nome</Label>
                <Input id="edit-name" className="col-span-3" value={editingUser?.name || ''} onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)} disabled={isUpdatingUser} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Função</Label>
                <Select
                  value={editingUser?.roleId || ''}
                  onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, roleId: value } : null)}
                  disabled={isUpdatingUser}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                   <SelectContent>
                      {roles.map((role) => (
                         <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdatingUser}>Cancelar</Button>
              <Button type="submit" disabled={isUpdatingUser}>
                {isUpdatingUser ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

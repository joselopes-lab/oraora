'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '@/firebase/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  listAgencyTeamServer,
  inviteBrokerServer,
  createBrokerWithAuthServer,
  updateAgencyMemberRoleServer,
  suspendAgencyMemberServer,
  reactivateAgencyMemberServer,
  cancelInviteServer,
  AgencyTeamDataDTO,
  AgencyTeamMemberDTO,
  AgencyInviteDTO
} from '@/app/dashboard/imobiliaria/actions.server';
import { validatePasswordPolicy } from '@/app/dashboard/imobiliaria/validation';
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Plus,
  Search,
  MoreVertical,
  Shield,
  ShieldAlert,
  Clock,
  Phone,
  Award,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Edit2,
  UserMinus,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function AgencyTeamPage() {
  const { user, userProfile, isReady, authLoading } = useAuthContext();
  const { toast } = useToast();

  const [teamData, setTeamData] = useState<AgencyTeamDataDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPassword, setBrokerPassword] = useState('');
  const [brokerConfirmPassword, setBrokerConfirmPassword] = useState('');
  const [brokerRole, setBrokerRole] = useState<'broker' | 'manager'>('broker');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordPolicy = useMemo(() => {
    return validatePasswordPolicy(brokerPassword);
  }, [brokerPassword]);

  const passwordsMatch = brokerPassword === brokerConfirmPassword && brokerPassword !== '';

  const [editingMember, setEditingMember] = useState<AgencyTeamMemberDTO | null>(null);
  const [editRole, setEditRole] = useState<'broker' | 'manager'>('broker');

  const [suspendingMember, setSuspendingMember] = useState<AgencyTeamMemberDTO | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<AgencyInviteDTO | null>(null);

  // Fetch Team Data
  const loadTeamData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = await user.getIdToken();
      const result = await listAgencyTeamServer(token);
      if (result.success) {
        setTeamData(result.teamData);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar equipe',
        description: err.message || 'Não foi possível buscar a lista de membros.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && !authLoading && user && userProfile?.userType === 'imobiliaria') {
      loadTeamData();
    }
  }, [isReady, authLoading, user, userProfile]);

  // Handle Create Broker
  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !brokerName || !brokerEmail || !brokerPassword || !brokerConfirmPassword) return;

    if (brokerPassword !== brokerConfirmPassword) {
      toast({
        variant: 'destructive',
        title: 'As senhas não conferem',
        description: 'Certifique-se de que a confirmação da senha é idêntica à senha informada.'
      });
      return;
    }

    const policy = validatePasswordPolicy(brokerPassword);
    if (!policy.isValid) {
      toast({
        variant: 'destructive',
        title: 'Senha fraca',
        description: policy.errors.join(' ')
      });
      return;
    }

    try {
      setIsActionLoading(true);
      const token = await user.getIdToken();
      const result = await createBrokerWithAuthServer({
        name: brokerName,
        email: brokerEmail,
        password: brokerPassword,
        confirmPassword: brokerConfirmPassword,
        role: brokerRole
      }, token);

      if (result.success) {
        toast({
          title: 'Corretor adicionado!',
          description: `A conta de acesso para ${brokerName} foi criada com sucesso no OraOra.`
        });
        setIsInviteOpen(false);
        setBrokerName('');
        setBrokerEmail('');
        setBrokerPassword('');
        setBrokerConfirmPassword('');
        setBrokerRole('broker');
        await loadTeamData();
      }
    } catch (err: any) {
      const msg = err?.message || '';
      const isKnown = msg.includes('e-mail') || msg.includes('senhas') || msg.includes('Senha fraca') || msg.includes('Preencha') || msg.includes('cadastrado');
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar corretor',
        description: isKnown ? msg : 'Não foi possível adicionar o corretor. Tente novamente.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Edit Role
  const handleUpdateRole = async () => {
    if (!user || !editingMember) return;

    try {
      setIsActionLoading(true);
      const token = await user.getIdToken();
      await updateAgencyMemberRoleServer(editingMember.id, editRole, token);

      toast({
        title: 'Função atualizada!',
        description: `O papel de ${editingMember.name} foi alterado para ${editRole === 'manager' ? 'Gestor' : 'Corretor'}.`
      });
      setEditingMember(null);
      await loadTeamData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar função',
        description: err.message || 'Não foi possível alterar a função do membro.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Suspend Member
  const handleSuspendMember = async () => {
    if (!user || !suspendingMember) return;

    try {
      setIsActionLoading(true);
      const token = await user.getIdToken();
      await suspendAgencyMemberServer(suspendingMember.id, token);

      toast({
        title: 'Membro suspenso',
        description: `${suspendingMember.name} foi suspenso da equipe da imobiliária.`
      });
      setSuspendingMember(null);
      await loadTeamData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao suspender membro',
        description: err.message || 'Não foi possível suspender o membro.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reactivate Member
  const handleReactivateMember = async (member: AgencyTeamMemberDTO) => {
    if (!user) return;

    try {
      setIsActionLoading(true);
      const token = await user.getIdToken();
      await reactivateAgencyMemberServer(member.id, token);

      toast({
        title: 'Membro reativado!',
        description: `${member.name} voltou a fazer parte ativa da equipe.`
      });
      await loadTeamData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao reativar membro',
        description: err.message || 'Não foi possível reativar este corretor.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Cancel Invite
  const handleCancelInvite = async () => {
    if (!user || !cancellingInvite) return;

    try {
      setIsActionLoading(true);
      const token = await user.getIdToken();
      await cancelInviteServer(cancellingInvite.id, token);

      toast({
        title: 'Convite cancelado',
        description: `O convite para ${cancellingInvite.email} foi revogado com sucesso.`
      });
      setCancellingInvite(null);
      await loadTeamData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar convite',
        description: err.message || 'Não foi possível cancelar o convite.'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Unified list for filtering & searching
  const filteredList = useMemo(() => {
    if (!teamData) return [];

    const membersFormatted = teamData.members.map(m => ({
      type: 'member' as const,
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      creci: m.creci,
      avatarUrl: m.avatarUrl,
      role: m.role,
      status: m.status,
      date: m.joinedAt || m.createdAt,
      isOwner: m.isOwner,
      raw: m
    }));

    const invitesFormatted = teamData.invites.map(inv => ({
      type: 'invite' as const,
      id: inv.id,
      name: inv.targetUserName || 'Aguardando Cadastro',
      email: inv.email,
      phone: null,
      creci: null,
      avatarUrl: null,
      role: inv.role,
      status: 'pending' as const,
      date: inv.createdAt,
      isOwner: false,
      raw: inv
    }));

    let all = [...membersFormatted, ...invitesFormatted];

    // Status Filter
    if (statusFilter === 'active') {
      all = all.filter(item => item.status === 'active');
    } else if (statusFilter === 'pending') {
      all = all.filter(item => item.status === 'pending');
    } else if (statusFilter === 'suspended') {
      all = all.filter(item => item.status === 'suspended' || item.status === 'inactive');
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      all = all.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.creci && item.creci.toLowerCase().includes(term))
      );
    }

    return all;
  }, [teamData, statusFilter, searchTerm]);

  const isOwner = teamData?.currentMemberRole === 'owner';
  const canManage = teamData?.currentMemberRole === 'owner' || teamData?.currentMemberRole === 'manager';

  if (!isReady || authLoading || (isLoading && !teamData)) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-6 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="size-10 animate-spin text-slate-800" />
        <p className="text-sm font-medium text-slate-500">Carregando governança da equipe...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {teamData?.agency.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Governança
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Equipe
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie os profissionais que fazem parte da sua operação.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTeamData}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
          >
            <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {canManage && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm"
            >
              <Plus className="size-4 mr-1.5" />
              Adicionar corretor
            </Button>
          )}
        </div>
      </div>

      {/* 2. Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {teamData?.summary.total || 0}
              </h3>
            </div>
            <div className="size-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Users className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Ativos</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {teamData?.summary.active || 0}
              </h3>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Convites Pendentes</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {teamData?.summary.pendingInvites || 0}
              </h3>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Suspensos</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {teamData?.summary.suspended || 0}
              </h3>
            </div>
            <div className="size-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, e-mail ou CRECI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs sm:text-sm focus-visible:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl text-xs font-bold h-9 ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Todos ({teamData?.summary.total || 0})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className={`rounded-xl text-xs font-bold h-9 ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-emerald-50'}`}
          >
            Ativos ({teamData?.summary.active || 0})
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className={`rounded-xl text-xs font-bold h-9 ${statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-amber-50'}`}
          >
            Pendentes ({teamData?.summary.pendingInvites || 0})
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('suspended')}
            className={`rounded-xl text-xs font-bold h-9 ${statusFilter === 'suspended' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-rose-50'}`}
          >
            Suspensos ({teamData?.summary.suspended || 0})
          </Button>
        </div>
      </div>

      {/* 4. Team List */}
      {filteredList.length === 0 ? (
        <Card className="rounded-3xl border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="size-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
            <Users className="size-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Sua equipe começa aqui.</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Adicione corretores para organizar sua operação, distribuir oportunidades e acompanhar o trabalho da equipe.
          </p>
          {canManage && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              <Plus className="size-4 mr-1.5" />
              Adicionar corretor
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const isPending = item.status === 'pending';
              const isSuspended = item.status === 'suspended' || item.status === 'inactive';
              const roleLabel = item.role === 'owner' ? 'Proprietário' : item.role === 'manager' ? 'Gestor' : 'Corretor';
              const roleBadgeColor = item.role === 'owner' 
                ? 'bg-slate-900 text-white' 
                : item.role === 'manager' 
                ? 'bg-purple-100 text-purple-800 border-purple-200' 
                : 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <Avatar className="size-12 rounded-2xl border border-slate-200 shrink-0">
                      {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.name} />}
                      <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-700 font-bold text-base">
                        {item.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                          {item.name}
                        </h4>
                        {item.isOwner && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            Owner
                          </span>
                        )}
                        {item.id === teamData?.currentUserId && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                            Você
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="size-3.5 text-slate-400 shrink-0" />
                          {item.email}
                        </span>

                        {item.phone && (
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="size-3.5 text-slate-400 shrink-0" />
                            {item.phone}
                          </span>
                        )}

                        {item.creci && (
                          <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600">
                            <Award className="size-3.5 text-slate-400 shrink-0" />
                            CRECI {item.creci}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status, Role & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider rounded-lg px-2.5 py-1 ${roleBadgeColor}`}>
                        {roleLabel}
                      </Badge>

                      {isPending ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] uppercase tracking-wider rounded-lg px-2.5 py-1">
                          Convite Pendente
                        </Badge>
                      ) : isSuspended ? (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px] uppercase tracking-wider rounded-lg px-2.5 py-1">
                          Suspenso
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] uppercase tracking-wider rounded-lg px-2.5 py-1">
                          Ativo
                        </Badge>
                      )}
                    </div>

                    {/* Actions Menu */}
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-slate-100">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                            Ações do Membro
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-100" />

                          {item.type === 'member' && !item.isOwner && (
                            <>
                              {item.status === 'active' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMember(item.raw as AgencyTeamMemberDTO);
                                      setEditRole((item.raw as AgencyTeamMemberDTO).role === 'manager' ? 'manager' : 'broker');
                                    }}
                                    className="rounded-xl text-xs font-semibold cursor-pointer py-2"
                                  >
                                    <Edit2 className="size-4 mr-2 text-slate-500" />
                                    Alterar Função
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => setSuspendingMember(item.raw as AgencyTeamMemberDTO)}
                                    className="rounded-xl text-xs font-semibold text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer py-2"
                                  >
                                    <UserMinus className="size-4 mr-2 text-rose-500" />
                                    Suspender da Equipe
                                  </DropdownMenuItem>
                                </>
                              )}

                              {isSuspended && (
                                <DropdownMenuItem
                                  onClick={() => handleReactivateMember(item.raw as AgencyTeamMemberDTO)}
                                  className="rounded-xl text-xs font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer py-2"
                                >
                                  <CheckCircle2 className="size-4 mr-2 text-emerald-500" />
                                  Reativar na Equipe
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {item.type === 'invite' && (
                            <DropdownMenuItem
                              onClick={() => setCancellingInvite(item.raw as AgencyInviteDTO)}
                              className="rounded-xl text-xs font-semibold text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer py-2"
                            >
                              <XCircle className="size-4 mr-2 text-rose-500" />
                              Cancelar Convite
                            </DropdownMenuItem>
                          )}

                          {item.isOwner && (
                            <div className="px-2 py-2 text-[11px] text-slate-400 italic">
                              O proprietário não pode ser editado nem suspenso.
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Modal: Adicionar Corretor */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-2 shadow-sm">
              <Plus className="size-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Adicionar corretor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Crie a conta de acesso para o corretor ou gestor operar na equipe sob sua governança no OraOra.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBroker} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="broker-name" className="text-xs font-bold text-slate-700">
                Nome completo *
              </Label>
              <Input
                id="broker-name"
                type="text"
                required
                placeholder="Nome do corretor"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broker-email" className="text-xs font-bold text-slate-700">
                E-mail de acesso *
              </Label>
              <Input
                id="broker-email"
                type="email"
                required
                placeholder="corretor@imobiliaria.com.br"
                value={brokerEmail}
                onChange={(e) => setBrokerEmail(e.target.value)}
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broker-role" className="text-xs font-bold text-slate-700">
                Cargo na imobiliária *
              </Label>
              <Select value={brokerRole} onValueChange={(val: any) => setBrokerRole(val)}>
                <SelectTrigger id="broker-role" className="rounded-xl border-slate-200 text-sm">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100">
                  <SelectItem value="broker" className="text-xs font-semibold py-2">
                    Corretor (Acesso à carteira e captações)
                  </SelectItem>
                  <SelectItem value="manager" className="text-xs font-semibold py-2">
                    Gestor (Acompanhamento e suporte à equipe)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broker-password" className="text-xs font-bold text-slate-700">
                Senha de acesso *
              </Label>
              <div className="relative">
                <Input
                  id="broker-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo de 8 caracteres"
                  value={brokerPassword}
                  onChange={(e) => setBrokerPassword(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {/* Password strength checklist */}
              {brokerPassword.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 mt-2 text-[11px]">
                  <p className="font-bold text-slate-700 mb-1">Requisitos da senha:</p>
                  <div className={`flex items-center gap-1.5 ${brokerPassword.length >= 8 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span>{brokerPassword.length >= 8 ? '✓' : '•'}</span> Mínimo de 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(brokerPassword) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span>{/[A-Z]/.test(brokerPassword) ? '✓' : '•'}</span> Pelo menos uma letra maiúscula
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[a-z]/.test(brokerPassword) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span>{/[a-z]/.test(brokerPassword) ? '✓' : '•'}</span> Pelo menos uma letra minúscula
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[0-9]/.test(brokerPassword) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span>{/[0-9]/.test(brokerPassword) ? '✓' : '•'}</span> Pelo menos um número
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(brokerPassword) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span>{/[^A-Za-z0-9]/.test(brokerPassword) ? '✓' : '•'}</span> Pelo menos um caractere especial
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broker-confirm-password" className="text-xs font-bold text-slate-700">
                Confirmar senha *
              </Label>
              <div className="relative">
                <Input
                  id="broker-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita a senha"
                  value={brokerConfirmPassword}
                  onChange={(e) => setBrokerConfirmPassword(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {brokerConfirmPassword.length > 0 && (
                <p className={`text-[11px] font-semibold mt-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passwordsMatch ? '✓ As senhas conferem' : '✕ As senhas não conferem'}
                </p>
              )}
            </div>

            <DialogFooter className="pt-4 flex items-center gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                disabled={isActionLoading}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isActionLoading || !brokerName || !brokerEmail || !passwordPolicy.isValid || !passwordsMatch}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Corretor'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Alterar Função */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
              <Edit2 className="size-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Alterar Função de {editingMember?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Defina o papel e nível de governança deste membro na organização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nova Função</Label>
              <Select value={editRole} onValueChange={(val: any) => setEditRole(val)}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100">
                  <SelectItem value="broker" className="text-xs font-semibold py-2">
                    Corretor (Acesso à carteira e recursos atribuídos)
                  </SelectItem>
                  <SelectItem value="manager" className="text-xs font-semibold py-2">
                    Gestor (Acompanhamento e suporte à equipe)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setEditingMember(null)}
              disabled={isActionLoading}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isActionLoading}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              {isActionLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Modal: Confirmar Suspensão */}
      <Dialog open={!!suspendingMember} onOpenChange={(open) => !open && setSuspendingMember(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Suspender membro da equipe?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Tem certeza que deseja suspender <strong>{suspendingMember?.name}</strong> da sua imobiliária? O profissional perderá o vínculo com a sua operação, mas sua conta individual no OraOra continuará intacta.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setSuspendingMember(null)}
              disabled={isActionLoading}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendMember}
              disabled={isActionLoading}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isActionLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Confirmar Suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Modal: Cancelar Convite */}
      <Dialog open={!!cancellingInvite} onOpenChange={(open) => !open && setCancellingInvite(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <XCircle className="size-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Revogar convite pendente?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              O convite enviado para <strong>{cancellingInvite?.email}</strong> será cancelado e o link não poderá mais ser utilizado.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCancellingInvite(null)}
              disabled={isActionLoading}
              className="rounded-xl font-bold"
            >
              Manter Convite
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInvite}
              disabled={isActionLoading}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isActionLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Revogar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

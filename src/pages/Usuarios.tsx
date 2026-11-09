import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useBook } from '@/contexts/BookContext'
import {
  getUsers,
  updateUserRoleAndStatus,
  deleteUser,
  getAllBookAccess,
  setBookAccess,
  removeBookAccess,
  getInvitations,
  createInvitation,
  getAuditLogs,
} from '@/services/security'
import type {
  UserRecord,
  UserRole,
  BookAccessRecord,
  InvitationRecord,
  AuditLogRecord,
} from '@/types/book'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Mail,
  Copy,
  Check,
  KeyRound,
  FileText,
  AlertTriangle,
  Plus,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function UsuariosPermissoes() {
  const { user, isAdmin } = useAuth()
  const { books } = useBook()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [accessList, setAccessList] = useState<BookAccessRecord[]>([])
  const [invitations, setInvitations] = useState<InvitationRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Seleção de usuário para gerenciar permissões
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Estado para criar convite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('colaboradora')
  const [inviteBookIds, setInviteBookIds] = useState<string[]>([])
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [uList, accList, invList, logs] = await Promise.all([
        getUsers(),
        getAllBookAccess(),
        getInvitations(),
        getAuditLogs(50),
      ])
      setUsers(uList)
      setAccessList(accList)
      setInvitations(invList)
      setAuditLogs(logs)

      if (!selectedUserId && uList.length > 0) {
        setSelectedUserId(uList[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de segurança:', err)
      toast({
        title: 'Erro de carregamento',
        description: 'Não foi possível carregar os usuários e permissões.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, toast])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, loadData])

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl p-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-amber-700" />
          <h1 className="text-xl font-bold text-stone-900">Acesso Restrito</h1>
          <p className="mt-2 text-sm text-stone-500">
            Apenas administradoras têm permissão para acessar o painel de usuários, permissões e
            auditoria do ERP.
          </p>
        </div>
      </AppLayout>
    )
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  // Alternar permissão de um livro para o usuário selecionado
  const handleTogglePermission = async (
    bookId: string,
    field: 'can_view' | 'can_comment' | 'can_edit' | 'can_attach' | 'can_download' | 'can_export',
    currentVal: boolean,
  ) => {
    if (!selectedUserId) return
    const existing = accessList.find((a) => a.user_id === selectedUserId && a.book_id === bookId)

    const payload = {
      user_id: selectedUserId,
      book_id: bookId,
      can_view: existing ? existing.can_view : true,
      can_comment: existing ? existing.can_comment : false,
      can_edit: existing ? existing.can_edit : false,
      can_attach: existing ? existing.can_attach : false,
      can_download: existing ? existing.can_download : false,
      can_export: existing ? existing.can_export : false,
      [field]: !currentVal,
    }

    try {
      await setBookAccess(payload)
      toast({ title: 'Permissão atualizada com sucesso' })
      const updatedAcc = await getAllBookAccess()
      setAccessList(updatedAcc)
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao atualizar permissão.',
        variant: 'destructive',
      })
    }
  }

  const handleGrantFullBookAccess = async (bookId: string) => {
    if (!selectedUserId) return
    try {
      await setBookAccess({
        user_id: selectedUserId,
        book_id: bookId,
        can_view: true,
        can_comment: true,
        can_edit: true,
        can_attach: true,
        can_download: true,
        can_export: true,
      })
      toast({ title: 'Acesso completo concedido ao livro' })
      const updatedAcc = await getAllBookAccess()
      setAccessList(updatedAcc)
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao conceder acesso.',
        variant: 'destructive',
      })
    }
  }

  const handleRevokeBookAccess = async (bookId: string) => {
    if (!selectedUserId) return
    try {
      await removeBookAccess(selectedUserId, bookId)
      toast({ title: 'Acesso ao livro revogado' })
      const updatedAcc = await getAllBookAccess()
      setAccessList(updatedAcc)
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao revogar acesso.',
        variant: 'destructive',
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRoleAndStatus(userId, { role: newRole })
      toast({ title: 'Perfil atualizado com sucesso' })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Operação bloqueada',
        description: err instanceof Error ? err.message : 'Não foi possível alterar o perfil.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await updateUserRoleAndStatus(userId, { is_active: !currentActive })
      toast({
        title: currentActive ? 'Usuário desativado' : 'Usuário reativado',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Operação bloqueada',
        description: err instanceof Error ? err.message : 'Não foi possível alterar o status.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza de que deseja excluir este usuário do sistema?')) return
    try {
      await deleteUser(userId)
      toast({ title: 'Usuário excluído' })
      if (selectedUserId === userId) setSelectedUserId(null)
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Operação bloqueada',
        description: err instanceof Error ? err.message : 'Falha ao excluir usuário.',
        variant: 'destructive',
      })
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setSubmittingInvite(true)
    try {
      const inv = await createInvitation({
        email: inviteEmail,
        role: inviteRole,
        book_ids: inviteBookIds,
      })
      const inviteUrl = `${window.location.origin}/entrar?convite=${inv.token}`
      setCreatedInviteUrl(inviteUrl)
      toast({ title: 'Convite criado com sucesso!' })
      setInviteEmail('')
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao criar convite.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingInvite(false)
    }
  }

  const handleCopyInviteUrl = () => {
    if (!createdInviteUrl) return
    navigator.clipboard.writeText(createdInviteUrl)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2500)
    toast({ title: 'Link de convite copiado para a área de transferência' })
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Usuários, Permissões e Segurança
            </h1>
            <p className="text-sm text-stone-500">
              Gerencie contas, papéis (Administradora, Colaboradora, Revisora), permissões por livro
              e auditoria.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="permissoes" className="space-y-6">
          <TabsList className="bg-stone-200">
            <TabsTrigger value="permissoes" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários e Permissões
            </TabsTrigger>
            <TabsTrigger value="convites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Convites de Acesso
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Log de Auditoria
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USUÁRIOS E PERMISSÕES */}
          <TabsContent value="permissoes" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Coluna 1: Lista de Usuários */}
              <Card className="lg:col-span-1">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Equipe Cadastrada</span>
                    <Badge variant="outline">{users.length} usuários</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {users.map((u) => {
                    const isSelected = u.id === selectedUserId
                    const isSelf = u.id === user?.id
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition ${
                          isSelected
                            ? 'border-amber-700 bg-amber-50/50 shadow-sm'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-stone-900">
                              {u.name || u.email}
                              {isSelf && (
                                <span className="ml-1.5 text-xs text-amber-800 font-normal">
                                  (você)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-stone-500">{u.email}</p>
                          </div>
                          <Badge
                            className={`shrink-0 text-[10px] ${
                              u.role === 'administradora'
                                ? 'bg-amber-700 text-white'
                                : u.role === 'colaboradora'
                                  ? 'bg-blue-700 text-white'
                                  : 'bg-stone-600 text-white'
                            }`}
                          >
                            {u.role}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                          <span>Status: {u.is_active !== false ? 'Ativo' : 'Desativado'}</span>
                          {u.is_active === false && (
                            <Badge variant="destructive" className="text-[9px]">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Coluna 2 e 3: Detalhes e Permissões por Projeto */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-700" />
                    Gerenciamento da Conta e Matriz de Permissões
                  </CardTitle>
                  <CardDescription>
                    {selectedUser
                      ? `Configurando acesso de ${selectedUser.name || selectedUser.email} (${selectedUser.email})`
                      : 'Selecione uma conta na lista ao lado.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedUser && (
                    <>
                      {/* Controles da Conta */}
                      <div className="grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-stone-700">
                            Perfil no Sistema
                          </Label>
                          <Select
                            value={selectedUser.role}
                            onValueChange={(val: UserRole) =>
                              handleRoleChange(selectedUser.id, val)
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="administradora">
                                Administradora (acesso total)
                              </SelectItem>
                              <SelectItem value="colaboradora">
                                Colaboradora (projetos atribuídos)
                              </SelectItem>
                              <SelectItem value="revisora">
                                Revisora (leitura e comentários)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] text-stone-500">
                            Revisora não tem permissão para editar texto ou exportar manuscrito.
                          </p>
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                          <Button
                            variant={selectedUser.is_active !== false ? 'outline' : 'default'}
                            size="sm"
                            className={
                              selectedUser.is_active !== false
                                ? 'text-stone-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }
                            onClick={() =>
                              handleToggleStatus(selectedUser.id, selectedUser.is_active !== false)
                            }
                          >
                            {selectedUser.is_active !== false ? (
                              <>
                                <UserX className="mr-2 h-4 w-4 text-red-600" /> Desativar Conta
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" /> Reativar Conta
                              </>
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(selectedUser.id)}
                            disabled={selectedUser.id === user?.id}
                          >
                            Excluir Usuário
                          </Button>
                        </div>
                      </div>

                      {/* Permissões Granulares por Livro */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-amber-700" />
                            Acesso por Livro Editorial
                          </h3>
                          <p className="text-xs text-stone-500">
                            {selectedUser.role === 'administradora'
                              ? 'Administradora tem acesso irrestrito a todos os livros.'
                              : 'Marque ou desmarque permissões específicas por projeto.'}
                          </p>
                        </div>

                        {selectedUser.role === 'administradora' ? (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
                            Esta conta possui o perfil <strong>Administradora</strong>. Ela gerencia
                            e acessa todos os livros cadastrados, configurações e logs de auditoria.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {books.map((b) => {
                              const acc = accessList.find(
                                (a) => a.user_id === selectedUser.id && a.book_id === b.id,
                              )
                              const hasAccess = !!acc && acc.can_view

                              return (
                                <div
                                  key={b.id}
                                  className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
                                    <div>
                                      <p className="font-semibold text-stone-900 text-sm">
                                        {b.title}
                                      </p>
                                      <p className="text-xs text-stone-500">
                                        {b.genre || 'Gênero não informado'} • Meta: {b.target_words}{' '}
                                        palavras
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasAccess ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-red-600 hover:text-red-700"
                                          onClick={() => handleRevokeBookAccess(b.id)}
                                        >
                                          Revogar livro
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs text-amber-800"
                                          onClick={() => handleGrantFullBookAccess(b.id)}
                                        >
                                          Conceder acesso
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Matriz de Permissões */}
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={acc?.can_view ?? false}
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_view',
                                            acc?.can_view ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">Visualizar</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={acc?.can_comment ?? false}
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_comment',
                                            acc?.can_comment ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">Comentar</span>
                                    </label>

                                    <label
                                      className={`flex items-center gap-2 ${
                                        selectedUser.role === 'revisora'
                                          ? 'opacity-50 cursor-not-allowed'
                                          : 'cursor-pointer'
                                      }`}
                                    >
                                      <Checkbox
                                        disabled={selectedUser.role === 'revisora'}
                                        checked={
                                          selectedUser.role === 'revisora'
                                            ? false
                                            : (acc?.can_edit ?? false)
                                        }
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_edit',
                                            acc?.can_edit ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">
                                        Editar manuscrito
                                      </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={acc?.can_attach ?? false}
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_attach',
                                            acc?.can_attach ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">Anexos</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={acc?.can_download ?? false}
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_download',
                                            acc?.can_download ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">
                                        Baixar arquivos
                                      </span>
                                    </label>

                                    <label
                                      className={`flex items-center gap-2 ${
                                        selectedUser.role === 'revisora'
                                          ? 'opacity-50 cursor-not-allowed'
                                          : 'cursor-pointer'
                                      }`}
                                    >
                                      <Checkbox
                                        disabled={selectedUser.role === 'revisora'}
                                        checked={
                                          selectedUser.role === 'revisora'
                                            ? false
                                            : (acc?.can_export ?? false)
                                        }
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            b.id,
                                            'can_export',
                                            acc?.can_export ?? false,
                                          )
                                        }
                                      />
                                      <span className="text-stone-700 font-medium">
                                        Exportar EPUB/PDF
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: CONVITES DE ACESSO */}
          <TabsContent value="convites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-700" />
                  Convidar Novo Integrante da Equipe
                </CardTitle>
                <CardDescription>
                  Sem cadastro público: novas contas são criadas exclusivamente por convite
                  administrativo com expiração e uso único.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateInvite} className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="inv-email" className="text-xs font-semibold">
                      E-mail do convidado
                    </Label>
                    <Input
                      id="inv-email"
                      type="email"
                      required
                      placeholder="revisor@dominio.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs font-semibold">Perfil atribuído</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(val: UserRole) => setInviteRole(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaboradora">Colaboradora</SelectItem>
                        <SelectItem value="revisora">Revisora</SelectItem>
                        <SelectItem value="administradora">Administradora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs font-semibold">Livro inicial</Label>
                    <Select
                      value={inviteBookIds[0] || 'all'}
                      onValueChange={(val) =>
                        setInviteBookIds(val === 'all' ? books.map((b) => b.id) : [val])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um livro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os livros</SelectItem>
                        {books.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <Button
                      type="submit"
                      disabled={submittingInvite}
                      className="bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Gerar Convite Seguro
                    </Button>
                  </div>
                </form>

                {createdInviteUrl && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-amber-700" />
                      Link de convite gerado (válido por 7 dias / uso único):
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={createdInviteUrl}
                        className="bg-white font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCopyInviteUrl}
                        className="bg-amber-800 hover:bg-amber-900 text-white shrink-0"
                      >
                        {copiedInvite ? (
                          <Check className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <Copy className="mr-1 h-3.5 w-3.5" />
                        )}
                        {copiedInvite ? 'Copiado!' : 'Copiar link'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Envio por e-mail automático pendente de gateway SMTP. Envie o link acima
                      diretamente ao colaborador convidado.
                    </p>
                  </div>
                )}

                {/* Lista de convites já gerados */}
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <h4 className="text-xs font-bold text-stone-700 mb-2">Histórico de Convites</h4>
                  <div className="space-y-2">
                    {invitations.length === 0 ? (
                      <p className="text-xs text-stone-400">Nenhum convite emitido ainda.</p>
                    ) : (
                      invitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border border-stone-200 p-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-stone-900">{inv.email}</span>
                            <span className="ml-2 text-stone-500">Perfil: {inv.role}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {inv.used ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-700 border-emerald-300 bg-emerald-50"
                              >
                                Utilizado
                              </Badge>
                            ) : new Date(inv.expires_at) < new Date() ? (
                              <Badge
                                variant="outline"
                                className="text-red-700 border-red-300 bg-red-50"
                              >
                                Expirado
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-600 text-white">Pendente</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: LOG DE AUDITORIA */}
          <TabsContent value="auditoria" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-700" />
                  Trilha de Auditoria do Sistema
                </CardTitle>
                <CardDescription>
                  Registro cronológico imutável de ações administrativas, convites, alterações de
                  papéis e acessos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                      <tr>
                        <th className="p-2.5 font-semibold">Data / Hora</th>
                        <th className="p-2.5 font-semibold">Ação</th>
                        <th className="p-2.5 font-semibold">Autor</th>
                        <th className="p-2.5 font-semibold">Alvo</th>
                        <th className="p-2.5 font-semibold">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50">
                          <td className="p-2.5 text-stone-500">
                            {new Date(log.created).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2.5 font-semibold text-stone-900">{log.action}</td>
                          <td className="p-2.5 text-stone-700">{log.author_email || 'sistema'}</td>
                          <td className="p-2.5 text-stone-500">
                            {log.target_type}: {log.target_id || '-'}
                          </td>
                          <td className="p-2.5 text-stone-600 max-w-xs truncate">
                            {typeof log.details === 'string'
                              ? log.details
                              : JSON.stringify(log.details) || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

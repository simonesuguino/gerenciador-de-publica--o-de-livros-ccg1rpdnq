import pb from '@/lib/pocketbase/client'
import type {
  UserRecord,
  UserRole,
  BookAccessRecord,
  InvitationRecord,
  AuditLogRecord,
} from '@/types/book'

/**
 * Registra evento no log de auditoria
 */
export async function logAuditEvent(params: {
  action: string
  target_id?: string
  target_type?: string
  details?: Record<string, unknown>
}) {
  try {
    const authUser = pb.authStore.record
    await pb.collection('audit_log').create({
      action: params.action,
      author_id: authUser?.id || null,
      author_email: authUser?.email || '',
      target_id: params.target_id || '',
      target_type: params.target_type || '',
      details: params.details ? JSON.stringify(params.details) : null,
    })
  } catch (err) {
    console.warn('Não foi possível gravar log de auditoria:', err)
  }
}

/**
 * Consulta logs de auditoria (somente Administradora)
 */
export async function getAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
  const records = await pb.collection('audit_log').getList(1, limit, {
    sort: '-created',
  })
  return records.items.map((item) => ({
    id: item.id,
    action: item.get('action'),
    author_id: item.get('author_id'),
    author_email: item.get('author_email'),
    target_id: item.get('target_id'),
    target_type: item.get('target_type'),
    details: item.get('details'),
    ip: item.get('ip'),
    created: item.created,
    updated: item.updated,
  }))
}

/**
 * Lista todos os usuários (administradora)
 */
export async function getUsers(): Promise<UserRecord[]> {
  const records = await pb.collection('users').getFullList({
    sort: 'name',
  })
  return records.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.get('name') || '',
    avatar: r.get('avatar') || '',
    role: (r.get('role') as UserRole) || 'colaboradora',
    is_active: r.get('is_active') !== false,
  }))
}

/**
 * Atualiza role ou status ativo de um usuário (apenas administradora)
 */
export async function updateUserRoleAndStatus(
  userId: string,
  params: { role?: UserRole; is_active?: boolean },
): Promise<void> {
  // Proteger contra desativação/perda da última administradora ativa
  if (params.is_active === false || (params.role && params.role !== 'administradora')) {
    const users = await getUsers()
    const activeAdmins = users.filter((u) => u.role === 'administradora' && u.is_active !== false)
    if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) {
      throw new Error(
        'Operação bloqueada: não é permitido desativar ou remover o perfil da única administradora ativa.',
      )
    }
  }

  await pb.collection('users').update(userId, params)
  await logAuditEvent({
    action: 'usuario_atualizado',
    target_id: userId,
    target_type: 'user',
    details: params,
  })
}

/**
 * Exclui usuário (apenas administradora)
 */
export async function deleteUser(userId: string): Promise<void> {
  const users = await getUsers()
  const activeAdmins = users.filter((u) => u.role === 'administradora' && u.is_active !== false)
  if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) {
    throw new Error('Operação bloqueada: não é permitido excluir a única administradora ativa.')
  }

  await pb.collection('users').delete(userId)
  await logAuditEvent({
    action: 'usuario_excluido',
    target_id: userId,
    target_type: 'user',
  })
}

/**
 * Lista acessos por livro de um usuário
 */
export async function getUserBookAccess(userId: string): Promise<BookAccessRecord[]> {
  const records = await pb.collection('book_access').getFullList({
    filter: `user_id = "${userId}"`,
    expand: 'book_id',
  })
  return records.map((r) => ({
    id: r.id,
    user_id: r.get('user_id'),
    book_id: r.get('book_id'),
    can_view: r.get('can_view') ?? true,
    can_comment: r.get('can_comment') ?? false,
    can_edit: r.get('can_edit') ?? false,
    can_attach: r.get('can_attach') ?? false,
    can_download: r.get('can_download') ?? false,
    can_export: r.get('can_export') ?? false,
    created: r.created,
    updated: r.updated,
  }))
}

/**
 * Lista todos os registros de acessos de todos os usuários (administradora)
 */
export async function getAllBookAccess(): Promise<BookAccessRecord[]> {
  const records = await pb.collection('book_access').getFullList({
    expand: 'user_id,book_id',
  })
  return records.map((r) => ({
    id: r.id,
    user_id: r.get('user_id'),
    book_id: r.get('book_id'),
    can_view: r.get('can_view') ?? true,
    can_comment: r.get('can_comment') ?? false,
    can_edit: r.get('can_edit') ?? false,
    can_attach: r.get('can_attach') ?? false,
    can_download: r.get('can_download') ?? false,
    can_export: r.get('can_export') ?? false,
    created: r.created,
    updated: r.updated,
  }))
}

/**
 * Atualiza ou cria permissões de acesso a um livro para um usuário
 */
export async function setBookAccess(params: {
  user_id: string
  book_id: string
  can_view?: boolean
  can_comment?: boolean
  can_edit?: boolean
  can_attach?: boolean
  can_download?: boolean
  can_export?: boolean
}): Promise<void> {
  const existing = await pb.collection('book_access').getList(1, 1, {
    filter: `user_id = "${params.user_id}" && book_id = "${params.book_id}"`,
  })

  const payload = {
    user_id: params.user_id,
    book_id: params.book_id,
    can_view: params.can_view ?? true,
    can_comment: params.can_comment ?? false,
    can_edit: params.can_edit ?? false,
    can_attach: params.can_attach ?? false,
    can_download: params.can_download ?? false,
    can_export: params.can_export ?? false,
  }

  if (existing.items.length > 0) {
    await pb.collection('book_access').update(existing.items[0].id, payload)
  } else {
    await pb.collection('book_access').create(payload)
  }

  await logAuditEvent({
    action: 'permissao_livro_atualizada',
    target_id: params.user_id,
    target_type: 'book_access',
    details: { book_id: params.book_id, ...payload },
  })
}

/**
 * Remove acesso de um usuário a um livro
 */
export async function removeBookAccess(userId: string, bookId: string): Promise<void> {
  const existing = await pb.collection('book_access').getList(1, 1, {
    filter: `user_id = "${userId}" && book_id = "${bookId}"`,
  })
  if (existing.items.length > 0) {
    await pb.collection('book_access').delete(existing.items[0].id)
    await logAuditEvent({
      action: 'permissao_livro_removida',
      target_id: userId,
      target_type: 'book_access',
      details: { book_id: bookId },
    })
  }
}

/**
 * Lista convites ativos e usados
 */
export async function getInvitations(): Promise<InvitationRecord[]> {
  const records = await pb.collection('invitations').getFullList({
    sort: '-created',
  })
  return records.map((r) => ({
    id: r.id,
    email: r.get('email'),
    token: r.get('token'),
    role: (r.get('role') as UserRole) || 'colaboradora',
    book_ids: r.get('book_ids') || [],
    permissions: r.get('permissions') || {},
    expires_at: r.get('expires_at'),
    used: !!r.get('used'),
    used_at: r.get('used_at'),
    created_by: r.get('created_by'),
    created: r.created,
    updated: r.updated,
  }))
}

/**
 * Cria um convite com expiração (uso único)
 */
export async function createInvitation(params: {
  email: string
  role: UserRole
  book_ids?: string[]
  permissions?: {
    can_view?: boolean
    can_comment?: boolean
    can_edit?: boolean
    can_attach?: boolean
    can_download?: boolean
    can_export?: boolean
  }
  daysValid?: number
}): Promise<InvitationRecord> {
  const token =
    Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
  const expires = new Date()
  expires.setDate(expires.getDate() + (params.daysValid || 7))

  const authUser = pb.authStore.record

  const record = await pb.collection('invitations').create({
    email: params.email.trim().toLowerCase(),
    token,
    role: params.role,
    book_ids: params.book_ids || [],
    permissions: params.permissions || {
      can_view: true,
      can_comment: params.role !== 'administradora',
      can_edit: params.role === 'colaboradora' || params.role === 'administradora',
      can_attach: params.role === 'colaboradora' || params.role === 'administradora',
      can_download: params.role === 'colaboradora' || params.role === 'administradora',
      can_export: params.role === 'colaboradora' || params.role === 'administradora',
    },
    expires_at: expires.toISOString(),
    used: false,
    created_by: authUser?.id || null,
  })

  await logAuditEvent({
    action: 'convite_criado',
    target_id: record.id,
    target_type: 'invitation',
    details: { email: params.email, role: params.role },
  })

  return {
    id: record.id,
    email: record.get('email'),
    token: record.get('token'),
    role: record.get('role'),
    book_ids: record.get('book_ids') || [],
    permissions: record.get('permissions') || {},
    expires_at: record.get('expires_at'),
    used: false,
    created_by: record.get('created_by'),
    created: record.created,
    updated: record.updated,
  }
}

/**
 * Valida e aceita um convite ao criar a conta
 */
export async function acceptInvitation(
  token: string,
  params: { name: string; password: string },
): Promise<void> {
  const inv = await pb.collection('invitations').getFirstListItem(`token = "${token.trim()}"`)
  if (!inv) throw new Error('Convite não encontrado.')
  if (inv.get('used')) throw new Error('Este convite já foi utilizado.')

  const expiresAt = new Date(inv.get('expires_at'))
  if (expiresAt < new Date()) throw new Error('Este convite expirou.')

  const email = inv.get('email')
  const role = inv.get('role') as UserRole
  const bookIds = (inv.get('book_ids') as string[]) || []
  const permissions = inv.get('permissions') || {}

  // Criar o usuário autenticado
  const newUser = await pb.collection('users').create({
    email,
    password: params.password,
    passwordConfirm: params.password,
    name: params.name,
    role,
    is_active: true,
  })

  // Marcar convite como usado
  await pb.collection('invitations').update(inv.id, {
    used: true,
    used_at: new Date().toISOString(),
  })

  // Atribuir os livros vinculados
  for (const bId of bookIds) {
    try {
      await pb.collection('book_access').create({
        user_id: newUser.id,
        book_id: bId,
        can_view: permissions.can_view ?? true,
        can_comment: permissions.can_comment ?? false,
        can_edit: permissions.can_edit ?? false,
        can_attach: permissions.can_attach ?? false,
        can_download: permissions.can_download ?? false,
        can_export: permissions.can_export ?? false,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  await logAuditEvent({
    action: 'convite_aceito',
    target_id: newUser.id,
    target_type: 'user',
    details: { email, role },
  })
}

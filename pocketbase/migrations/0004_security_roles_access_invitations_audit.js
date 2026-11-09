/// <reference path="../pb_data/types.d.ts" />
/**
 * 0004_security_roles_access_invitations_audit.js
 *
 * Implementa o núcleo de segurança do ERP de livros:
 * 1. Campo role ('administradora' | 'colaboradora' | 'revisora') e is_active (bool) em users
 *    - Simone Suguino (simonesuguino@gmail.com) é definida como administradora ativa
 *    - Bloqueio de auto-alteração de role no users.updateRule para não-administradores
 * 2. Coleção book_access:
 *    - Relaciona user_id + book_id
 *    - Flags de permissão por projeto: can_view, can_comment, can_edit, can_attach, can_download, can_export
 * 3. Coleção invitations:
 *    - Gerenciada exclusivamente por administradores
 *    - token único, email, role, book_ids (json), permissions (json), expires_at, used (bool)
 * 4. Coleção audit_log:
 *    - action, author_id, target_id, target_type, details (json)
 *    - Leitura restrita à administradora, criação por usuários autenticados, proibida edição/deleção
 * 5. Proteção de dados no backend (RLS):
 *    - books: público continua podendo ler página pública (/livro), mas para criar/editar/excluir e listar no ERP requer autenticação de administradora ou colaboradora vinculada com can_edit
 *    - chapters, checklist_items, marketing_posts, sales: restritos a usuários autenticados com acesso ao livro
 */

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id
    const books = app.findCollectionByNameOrId('books')
    const booksId = books.id

    // 1. Atualizar users com role e is_active
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: true,
          values: ['administradora', 'colaboradora', 'revisora'],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('is_active')) {
      users.fields.add(new BoolField({ name: 'is_active' }))
    }

    // Regras de users:
    // list/view: auth users
    // create: apenas admin (@request.auth.role = 'administradora')
    // update: admin pode atualizar qualquer um; o próprio usuário pode atualizar seu nome/avatar mas NÃO role ou is_active
    // delete: apenas admin
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'administradora'"
    users.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || (" +
      'id = @request.auth.id && ' +
      '@request.body.role:changed = false && ' +
      '@request.body.is_active:changed = false' +
      '))'
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.role = 'administradora' && id != @request.auth.id"

    app.save(users)

    // Garantir que a conta Simone Suguino seja administradora ativa
    try {
      const simone = app.findAuthRecordByEmail('_pb_users_auth_', 'simonesuguino@gmail.com')
      simone.set('role', 'administradora')
      simone.set('is_active', true)
      app.save(simone)
    } catch (_) {}

    // 2. Coleção book_access
    const bookAccess = new Collection({
      type: 'base',
      name: 'book_access',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'administradora' || user_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'administradora' || user_id = @request.auth.id)",
      createRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'book_id',
          type: 'relation',
          required: true,
          collectionId: booksId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'can_view', type: 'bool' },
        { name: 'can_comment', type: 'bool' },
        { name: 'can_edit', type: 'bool' },
        { name: 'can_attach', type: 'bool' },
        { name: 'can_download', type: 'bool' },
        { name: 'can_export', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_book_access_user_book ON book_access (user_id, book_id)',
        'CREATE INDEX idx_book_access_user ON book_access (user_id)',
        'CREATE INDEX idx_book_access_book ON book_access (book_id)',
      ],
    })
    app.save(bookAccess)

    // 3. Coleção invitations
    const invitations = new Collection({
      type: 'base',
      name: 'invitations',
      // Administradora gerencia; usuários não autenticados podem ver convite válido pelo token para aceitar
      listRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      viewRule: "used = false || (@request.auth.id != '' && @request.auth.role = 'administradora')",
      createRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'token', type: 'text', required: true, max: 100 },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['colaboradora', 'revisora', 'administradora'],
          maxSelect: 1,
        },
        { name: 'book_ids', type: 'json' }, // array de book_id
        { name: 'permissions', type: 'json' }, // { can_view, can_comment, can_edit, can_attach, can_download, can_export }
        { name: 'expires_at', type: 'date', required: true },
        { name: 'used', type: 'bool' },
        { name: 'used_at', type: 'date' },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_invitations_token ON invitations (token)',
        'CREATE INDEX idx_invitations_email ON invitations (email)',
      ],
    })
    app.save(invitations)

    // 4. Coleção audit_log
    const auditLog = new Collection({
      type: 'base',
      name: 'audit_log',
      // Apenas administradora consulta auditoria; qualquer usuário autenticado pode registrar eventos do sistema
      listRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'administradora'",
      createRule: "@request.auth.id != ''",
      updateRule: null, // Proibido alterar logs
      deleteRule: null, // Proibido deletar logs
      fields: [
        { name: 'action', type: 'text', required: true, max: 100 },
        {
          name: 'author_id',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
        },
        { name: 'author_email', type: 'text', max: 200 },
        { name: 'target_id', type: 'text', max: 100 },
        { name: 'target_type', type: 'text', max: 100 },
        { name: 'details', type: 'json' },
        { name: 'ip', type: 'text', max: 60 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_created ON audit_log (created DESC)',
        'CREATE INDEX idx_audit_action ON audit_log (action)',
        'CREATE INDEX idx_audit_author ON audit_log (author_id)',
      ],
    })
    app.save(auditLog)

    // Log inicial de auditoria
    try {
      const initialLog = new Record(auditLog)
      initialLog.set('action', 'sistema_seguranca_inicializado')
      initialLog.set('author_email', 'simonesuguino@gmail.com')
      initialLog.set('target_type', 'sistema')
      initialLog.set('details', JSON.stringify({ versao: 'v0.0.5', modulo: 'seguranca_erp' }))
      app.save(initialLog)
    } catch (_) {}

    // 5. Ajustar regras de acesso em books, chapters, checklist, marketing e sales
    // books: list/view liberado para página pública e usuários autenticados.
    // create/delete restritos à administradora.
    // update: administradora ou colaboradora com acesso.
    books.createRule = "@request.auth.id != '' && @request.auth.role = 'administradora'"
    books.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = id && @collection.book_access.can_edit = true' +
      ')'
    books.deleteRule = "@request.auth.id != '' && @request.auth.role = 'administradora'"
    app.save(books)

    // chapters:
    // list/view: público (página pública do livro precisa ver capítulos/sumário) e auth users com acesso
    // create/update/delete: administradora ou colaboradora com can_edit
    const chapters = app.findCollectionByNameOrId('chapters')
    chapters.createRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    chapters.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    chapters.deleteRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    app.save(chapters)

    // checklist_items, marketing_posts, sales: apenas auth
    const checklist = app.findCollectionByNameOrId('checklist_items')
    checklist.listRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    checklist.viewRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    checklist.createRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    checklist.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    checklist.deleteRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    app.save(checklist)

    const marketing = app.findCollectionByNameOrId('marketing_posts')
    marketing.listRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    marketing.viewRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    marketing.createRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    marketing.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    marketing.deleteRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    app.save(marketing)

    const sales = app.findCollectionByNameOrId('sales')
    sales.listRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    sales.viewRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id' +
      ')'
    sales.createRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    sales.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    sales.deleteRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'administradora' || " +
      '@collection.book_access.user_id = @request.auth.id && @collection.book_access.book_id = book_id && @collection.book_access.can_edit = true' +
      ')'
    app.save(sales)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('audit_log'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('invitations'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('book_access'))
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('role')
      users.fields.removeByName('is_active')
      users.createRule = ''
      users.updateRule = 'id = @request.auth.id'
      app.save(users)
    } catch (_) {}
  },
)

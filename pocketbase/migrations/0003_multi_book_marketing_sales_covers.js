/// <reference path="../pb_data/types.d.ts" />
/**
 * 0003 — Multi-livros, Marketing, Vendas, Capas e Preferências
 *
 * - books: novos campos (autor, arquivado, capa renderizada e template da página pública)
 * - marketing_posts: planejamento de publicações por plataforma (por livro)
 * - sales: lançamentos manuais de vendas (por livro)
 * - user_preferences: tema/aparência por usuário
 *
 * Nenhum dado existente é alterado ou removido — apenas campos novos (opcionais) e coleções novas.
 */
migrate(
  (app) => {
    const booksId = app.findCollectionByNameOrId('books').id
    const usersId = '_pb_users_auth_'

    // ---------- books: campos novos ----------
    const books = app.findCollectionByNameOrId('books')
    books.fields.add(new TextField({ name: 'author_name', max: 200 }))
    books.fields.add(new BoolField({ name: 'archived' }))
    books.fields.add(new TextField({ name: 'cover_template', max: 50 }))
    books.fields.add(new TextField({ name: 'cover_custom', max: 0 }))
    books.fields.add(new TextField({ name: 'public_template', max: 50 }))
    app.save(books)

    // Backfill dos livros já existentes com padrões de capa/template
    const existingBooks = app.findRecordsByFilter(
      'books',
      'cover_template = "" || cover_template = null',
      '',
      -1,
      0,
    )
    for (const book of existingBooks) {
      book.set('cover_template', 'memoir_classico')
      book.set('cover_custom', '')
      book.set('public_template', 'capa_central')
      book.set('archived', false)
      app.save(book)
    }

    // ---------- marketing_posts ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'marketing_posts',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'book_id',
            type: 'relation',
            required: true,
            collectionId: booksId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'platform', type: 'text', required: true, max: 50 },
          { name: 'scheduled_date', type: 'date' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ideia', 'agendado', 'publicado'],
            maxSelect: 1,
          },
          { name: 'caption', type: 'text', max: 0 },
          { name: 'notes', type: 'text', max: 0 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_marketing_posts_book ON marketing_posts (book_id)'],
      }),
    )

    // ---------- sales ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'sales',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'book_id',
            type: 'relation',
            required: true,
            collectionId: booksId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'sale_date', type: 'date', required: true },
          {
            name: 'platform',
            type: 'select',
            required: true,
            values: ['amazon_kdp', 'kobo', 'apple_books', 'ingramspark', 'outra'],
            maxSelect: 1,
          },
          { name: 'units', type: 'number', required: false, onlyInt: true, min: 0 },
          { name: 'revenue', type: 'number', required: false, min: 0 },
          { name: 'currency', type: 'text', required: true, max: 3 },
          { name: 'notes', type: 'text', max: 0 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_sales_book ON sales (book_id)',
          'CREATE INDEX idx_sales_date ON sales (sale_date)',
        ],
      }),
    )

    // ---------- user_preferences ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'user_preferences',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
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
            name: 'theme_mode',
            type: 'select',
            required: true,
            values: ['claro', 'escuro'],
            maxSelect: 1,
          },
          { name: 'accent_color', type: 'text', required: true, max: 20 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_user_prefs_user ON user_preferences (user_id)'],
      }),
    )
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('marketing_posts'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('sales'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('user_preferences'))
    } catch (_) {}

    const books = app.findCollectionByNameOrId('books')
    for (const name of [
      'author_name',
      'archived',
      'cover_template',
      'cover_custom',
      'public_template',
    ]) {
      try {
        books.fields.removeByName(name)
      } catch (_) {}
    }
    app.save(books)
  },
)

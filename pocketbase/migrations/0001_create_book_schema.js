migrate(
  (app) => {
    // 1. books collection
    const books = new Collection({
      name: 'books',
      type: 'base',
      // Public can view/list for the public book page. Auth user can create/update/delete.
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'synopsis', type: 'text' },
        { name: 'cover_url', type: 'text' },
        { name: 'isbn', type: 'text' },
        { name: 'price', type: 'number', min: 0 },
        { name: 'target_words', type: 'number', min: 1000 },
        { name: 'buy_links', type: 'json' }, // array of { label: string, url: string }
        { name: 'genre', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(books)

    // 2. chapters collection
    const chapters = new Collection({
      name: 'chapters',
      type: 'base',
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
          collectionId: books.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text' },
        { name: 'position', type: 'number', required: true },
        { name: 'narration_script', type: 'text' },
        {
          name: 'recording_status',
          type: 'select',
          required: true,
          values: ['pendente', 'gravado', 'revisado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_chapters_book_pos ON chapters (book_id, position ASC)'],
    })
    app.save(chapters)

    // 3. checklist_items collection
    const checklist = new Collection({
      name: 'checklist_items',
      type: 'base',
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
          collectionId: books.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'platform', type: 'text', required: true },
        { name: 'platform_key', type: 'text' },
        { name: 'link', type: 'text' },
        { name: 'completed', type: 'bool' },
        { name: 'notes', type: 'text' },
        { name: 'position', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_checklist_book ON checklist_items (book_id, position ASC)'],
    })
    app.save(checklist)
  },
  (app) => {
    try {
      const checklist = app.findCollectionByNameOrId('checklist_items')
      app.delete(checklist)
    } catch (_) {}
    try {
      const chapters = app.findCollectionByNameOrId('chapters')
      app.delete(chapters)
    } catch (_) {}
    try {
      const books = app.findCollectionByNameOrId('books')
      app.delete(books)
    } catch (_) {}
  },
)

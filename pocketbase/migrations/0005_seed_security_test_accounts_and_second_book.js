/// <reference path="../pb_data/types.d.ts" />
/**
 * 0005_seed_security_test_accounts_and_second_book.js
 *
 * Seed de dados fictícios para testes obrigatórios:
 * - 3 contas de teste (uma por perfil):
 *   1. Administradora: Simone Suguino (simonesuguino@gmail.com) — já existente, garantida role=administradora
 *   2. Colaboradora: Clara Colaboradora (clara.colaboradora@teste.com / Skip@Pass)
 *   3. Revisora: Renata Revisora (renata.revisora@teste.com / Skip@Pass)
 * - 2 livros com permissões distintas:
 *   - Livro 1: Cavalo de Tróia (livro principal)
 *   - Livro 2: O Guardião dos Portões (segundo livro do ERP)
 * - Matriz de acesso:
 *   - Clara tem acesso ao Livro 1 (view, comment, edit, attach, download, export) e ao Livro 2 (view, comment, edit)
 *   - Renata tem acesso APENAS ao Livro 1 com can_view=true e can_comment=true (can_edit=false, can_export=false, can_download=false)
 *   - Renata NÃO tem acesso ao Livro 2
 */

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const books = app.findCollectionByNameOrId('books')
    const bookAccess = app.findCollectionByNameOrId('book_access')

    // 1. Obter ou criar Livro 2 ("O Guardião dos Portões")
    let book2
    try {
      book2 = app.findFirstRecordByData('books', 'title', 'O Guardião dos Portões')
    } catch (_) {
      book2 = new Record(books)
      book2.set('title', 'O Guardião dos Portões')
      book2.set('subtitle', 'Ficção e reflexões sobre limites e fronteiras')
      book2.set(
        'synopsis',
        'Segundo livro editorial em desenvolvimento no ERP, usado para testar isolamento de projetos e permissões granulares por colaborador.',
      )
      book2.set('author_name', 'Simone Suguino')
      book2.set('genre', 'Ficção / Ensaio')
      book2.set('target_words', 40000)
      book2.set('price', 39.9)
      book2.set('cover_template', 'editorial_moderno')
      book2.set('cover_custom', '')
      book2.set('public_template', 'capa_lateral')
      book2.set('archived', false)
      app.save(book2)
    }

    // Obter Livro 1 (Cavalo de Tróia)
    let book1
    try {
      book1 = app.findFirstRecordByData('books', 'title', 'Cavalo de Tróia')
    } catch (_) {
      const allBooks = app.findRecordsByFilter('books', '', '-created', 1, 0)
      if (allBooks.length > 0) book1 = allBooks[0]
    }

    // 2. Criar ou atualizar Colaboradora
    let clara
    try {
      clara = app.findAuthRecordByEmail('_pb_users_auth_', 'clara.colaboradora@teste.com')
      clara.set('role', 'colaboradora')
      clara.set('is_active', true)
      clara.set('name', 'Clara Colaboradora')
      app.save(clara)
    } catch (_) {
      clara = new Record(users)
      clara.setEmail('clara.colaboradora@teste.com')
      clara.setPassword('Skip@Pass')
      clara.setVerified(true)
      clara.set('name', 'Clara Colaboradora')
      clara.set('role', 'colaboradora')
      clara.set('is_active', true)
      app.save(clara)
    }

    // 3. Criar ou atualizar Revisora
    let renata
    try {
      renata = app.findAuthRecordByEmail('_pb_users_auth_', 'renata.revisora@teste.com')
      renata.set('role', 'revisora')
      renata.set('is_active', true)
      renata.set('name', 'Renata Revisora')
      app.save(renata)
    } catch (_) {
      renata = new Record(users)
      renata.setEmail('renata.revisora@teste.com')
      renata.setPassword('Skip@Pass')
      renata.setVerified(true)
      renata.set('name', 'Renata Revisora')
      renata.set('role', 'revisora')
      renata.set('is_active', true)
      app.save(renata)
    }

    // 4. Vincular acessos de Clara (Livro 1 e Livro 2)
    if (book1) {
      try {
        const acc = app.findFirstRecordByFilter(
          'book_access',
          `user_id = '${clara.id}' && book_id = '${book1.id}'`,
        )
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', true)
        acc.set('can_attach', true)
        acc.set('can_download', true)
        acc.set('can_export', true)
        app.save(acc)
      } catch (_) {
        const acc = new Record(bookAccess)
        acc.set('user_id', clara.id)
        acc.set('book_id', book1.id)
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', true)
        acc.set('can_attach', true)
        acc.set('can_download', true)
        acc.set('can_export', true)
        app.save(acc)
      }
    }

    if (book2) {
      try {
        const acc = app.findFirstRecordByFilter(
          'book_access',
          `user_id = '${clara.id}' && book_id = '${book2.id}'`,
        )
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', true)
        acc.set('can_attach', false)
        acc.set('can_download', false)
        acc.set('can_export', false)
        app.save(acc)
      } catch (_) {
        const acc = new Record(bookAccess)
        acc.set('user_id', clara.id)
        acc.set('book_id', book2.id)
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', true)
        acc.set('can_attach', false)
        acc.set('can_download', false)
        acc.set('can_export', false)
        app.save(acc)
      }
    }

    // 5. Vincular acessos de Renata: APENAS Livro 1 (Cavalo de Tróia), somente leitura e comentário
    if (book1) {
      try {
        const acc = app.findFirstRecordByFilter(
          'book_access',
          `user_id = '${renata.id}' && book_id = '${book1.id}'`,
        )
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', false)
        acc.set('can_attach', false)
        acc.set('can_download', false)
        acc.set('can_export', false)
        app.save(acc)
      } catch (_) {
        const acc = new Record(bookAccess)
        acc.set('user_id', renata.id)
        acc.set('book_id', book1.id)
        acc.set('can_view', true)
        acc.set('can_comment', true)
        acc.set('can_edit', false)
        acc.set('can_attach', false)
        acc.set('can_download', false)
        acc.set('can_export', false)
        app.save(acc)
      }
    }
  },
  (app) => {
    try {
      const book2 = app.findFirstRecordByData('books', 'title', 'O Guardião dos Portões')
      app.delete(book2)
    } catch (_) {}
    try {
      const clara = app.findAuthRecordByEmail('_pb_users_auth_', 'clara.colaboradora@teste.com')
      app.delete(clara)
    } catch (_) {}
    try {
      const renata = app.findAuthRecordByEmail('_pb_users_auth_', 'renata.revisora@teste.com')
      app.delete(renata)
    } catch (_) {}
  },
)

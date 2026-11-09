import pb from '@/lib/pocketbase/client'
import type { BookRecord, BuyLink } from '@/types/book'

export async function getBooks(includeArchived = false): Promise<BookRecord[]> {
  try {
    const records = await pb.collection('books').getFullList<BookRecord>({
      sort: 'created',
      requestKey: null,
    })
    const parsed = records.map(parseBookLinks)
    return includeArchived ? parsed : parsed.filter((b) => !b.archived)
  } catch (err) {
    console.error('Erro ao buscar livros:', err)
    return []
  }
}

/** Mantido para compatibilidade: retorna o primeiro livro (seed original). */
export async function getFirstBook(): Promise<BookRecord | null> {
  const all = await getBooks(true)
  return all.length > 0 ? all[0] : null
}

export async function getBookById(id: string): Promise<BookRecord | null> {
  try {
    const record = await pb.collection('books').getOne<BookRecord>(id, {
      requestKey: null,
    })
    return parseBookLinks(record)
  } catch (err) {
    console.error('Erro ao buscar livro por ID:', err)
    return null
  }
}

export async function createBook(
  data: Pick<BookRecord, 'title'> & Partial<BookRecord>,
): Promise<BookRecord> {
  const payload: Record<string, unknown> = { ...data }
  if (payload.buy_links && typeof payload.buy_links !== 'string') {
    payload.buy_links = JSON.stringify(payload.buy_links)
  }
  const created = await pb.collection('books').create<BookRecord>(payload)
  return parseBookLinks(created)
}

export async function updateBook(id: string, data: Partial<BookRecord>): Promise<BookRecord> {
  const payload: Record<string, unknown> = { ...data }
  if (payload.buy_links && typeof payload.buy_links !== 'string') {
    payload.buy_links = JSON.stringify(payload.buy_links)
  }
  const updated = await pb.collection('books').update<BookRecord>(id, payload)
  return parseBookLinks(updated)
}

export async function deleteBook(id: string): Promise<boolean> {
  try {
    await pb.collection('books').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao excluir livro:', err)
    return false
  }
}

function parseBookLinks(book: BookRecord): BookRecord {
  if (typeof book.buy_links === 'string') {
    try {
      const parsed = JSON.parse(book.buy_links)
      return { ...book, buy_links: Array.isArray(parsed) ? (parsed as BuyLink[]) : [] }
    } catch {
      return { ...book, buy_links: [] }
    }
  }
  if (!book.buy_links) {
    return { ...book, buy_links: [] }
  }
  return book
}

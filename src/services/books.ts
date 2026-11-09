import pb from '@/lib/pocketbase/client'
import type { BookRecord, BuyLink } from '@/types/book'

export async function getFirstBook(): Promise<BookRecord | null> {
  try {
    const records = await pb.collection('books').getFullList<BookRecord>({
      sort: 'created',
      requestKey: null,
    })
    if (records.length === 0) return null
    const book = records[0]
    return parseBookLinks(book)
  } catch (err) {
    console.error('Erro ao buscar livro:', err)
    return null
  }
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

export async function updateBook(id: string, data: Partial<BookRecord>): Promise<BookRecord> {
  const payload: Record<string, unknown> = { ...data }
  if (payload.buy_links && typeof payload.buy_links !== 'string') {
    payload.buy_links = JSON.stringify(payload.buy_links)
  }
  const updated = await pb.collection('books').update<BookRecord>(id, payload)
  return parseBookLinks(updated)
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

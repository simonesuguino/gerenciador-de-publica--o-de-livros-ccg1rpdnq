import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getBooks, getBookById, createBook, updateBook } from '@/services/books'
import { useAuth } from '@/contexts/AuthContext'
import type { BookRecord } from '@/types/book'

interface BookContextValue {
  books: BookRecord[]
  book: BookRecord | null
  bookId: string | null
  loading: boolean
  refresh: () => Promise<void>
  setActiveBook: (id: string) => void
  addBook: (data: Pick<BookRecord, 'title'> & Partial<BookRecord>) => Promise<BookRecord | null>
  patchBook: (id: string, data: Partial<BookRecord>) => Promise<BookRecord | null>
}

const BookContext = createContext<BookContextValue | undefined>(undefined)

const STORAGE_KEY = 'livro-ativo'

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [book, setBook] = useState<BookRecord | null>(null)
  const [bookId, setBookId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { user, isAdmin, bookAccessList } = useAuth()

  const loadBooks = useCallback(async () => {
    const all = await getBooks(true)
    // Se for administradora, acessa todos os livros
    // Se for colaboradora ou revisora, filtra apenas os livros para os quais tem book_access com can_view
    if (isAdmin) {
      setBooks(all)
      return all
    }
    if (user) {
      const allowedBookIds = new Set(bookAccessList.filter((a) => a.can_view).map((a) => a.book_id))
      const filtered = all.filter((b) => allowedBookIds.has(b.id))
      setBooks(filtered)
      return filtered
    }
    setBooks(all)
    return all
  }, [isAdmin, user, bookAccessList])

  // Carrega livros e define o livro ativo (preferência salva ou o primeiro)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const all = await loadBooks()
      if (cancelled) return
      const saved = localStorage.getItem(STORAGE_KEY)
      const active =
        (saved && all.find((b) => b.id === saved && !b.archived)) ||
        all.find((b) => !b.archived) ||
        all[0] ||
        null
      setBookId(active?.id ?? null)
      setBook(active ?? null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadBooks])

  // Recarrega o livro ativo quando o id muda
  useEffect(() => {
    if (!bookId) return
    let cancelled = false
    getBookById(bookId).then((b) => {
      if (cancelled) return
      setBook(b)
      if (b) localStorage.setItem(STORAGE_KEY, b.id)
      else localStorage.removeItem(STORAGE_KEY)
    })
    return () => {
      cancelled = true
    }
  }, [bookId])

  const setActiveBook = useCallback(
    (id: string) => {
      const target = books.find((b) => b.id === id)
      if (!target) return
      setBookId(id)
      setBook(target)
    },
    [books],
  )

  const refresh = useCallback(async () => {
    const all = await loadBooks()
    if (bookId) {
      const fresh = await getBookById(bookId)
      setBook(fresh ?? all.find((b) => b.id === bookId) ?? null)
    }
  }, [bookId, loadBooks])

  const addBook = useCallback(
    async (data: Pick<BookRecord, 'title'> & Partial<BookRecord>) => {
      try {
        const created = await createBook({
          cover_template: 'memoir_classico',
          public_template: 'capa_central',
          archived: false,
          ...data,
        })
        setBooks((prev) => [...prev, created].sort((a, b) => a.created.localeCompare(b.created)))
        setActiveBook(created.id)
        return created
      } catch (err) {
        console.error('Erro ao criar livro:', err)
        return null
      }
    },
    [setActiveBook],
  )

  const patchBook = useCallback(
    async (id: string, data: Partial<BookRecord>) => {
      try {
        const updated = await updateBook(id, data)
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)))
        if (id === bookId) setBook(updated)
        return updated
      } catch (err) {
        console.error('Erro ao atualizar livro:', err)
        return null
      }
    },
    [bookId],
  )

  return (
    <BookContext.Provider
      value={{ books, book, bookId, loading, refresh, setActiveBook, addBook, patchBook }}
    >
      {children}
    </BookContext.Provider>
  )
}

export function useBook() {
  const ctx = useContext(BookContext)
  if (!ctx) throw new Error('useBook deve ser usado dentro de BookProvider')
  return ctx
}

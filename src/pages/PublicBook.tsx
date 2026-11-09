import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFirstBook } from '@/services/books'
import { getChapters } from '@/services/chapters'
import type { BookRecord, ChapterRecord, BuyLink } from '@/types/book'
import { countWords, formatNumber, formatCurrency, estimateReadingTime } from '@/lib/bookUtils'
import {
  BookOpen,
  ShoppingCart,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Heart,
  Share2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PublicBook() {
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const b = await getFirstBook()
    if (b) {
      setBook(b)
      const chaps = await getChapters(b.id)
      setChapters(chaps)
    }
    setLoading(false)
  }

  const buyLinks: BuyLink[] = (book?.buy_links as BuyLink[]) || []
  const totalWords = chapters.reduce((acc, c) => acc + countWords(c.content), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-300">
        <div className="flex flex-col items-center gap-3">
          <BookOpen className="h-8 w-8 animate-pulse text-amber-500" />
          <p className="text-sm font-serif">Carregando livro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 font-sans text-stone-100 antialiased selection:bg-amber-500 selection:text-stone-950">
      {/* Top Minimal Navigation Bar */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-serif text-sm font-bold tracking-tight text-white">
              {book?.title || 'Cavalo de Tróia'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Acesso do Autor</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: 3D Book Cover Card */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-900 opacity-30 blur-xl group-hover:opacity-50 transition duration-500" />
              <div className="relative w-64 md:w-80 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950">
                <img
                  src={
                    book?.cover_url ||
                    'https://img.usecurling.com/p/800/1200?q=book%20cover%20classic%20horse&color=orange'
                  }
                  alt={book?.title}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'https://img.usecurling.com/p/800/1200?q=book%20cover&color=orange'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Book Details & Purchase CTA */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{book?.genre || 'Memoir / Autobiografia'}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                {book?.title}
              </h1>

              {book?.subtitle && (
                <p className="font-serif text-lg md:text-xl text-stone-300 font-light italic leading-relaxed">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Synopsis */}
            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6 backdrop-blur-xs space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                Sinopse Oficial
              </h2>
              <p className="text-sm md:text-base text-stone-300 leading-relaxed font-serif">
                {book?.synopsis ||
                  'Um relato autobiográfico profundo e envolvente sobre travessias, desconstruções e os portões que precisamos abrir dentro de nós mesmos.'}
              </p>
            </div>

            {/* Quick Metadata Pill */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
              {book?.isbn && (
                <div className="rounded-md border border-stone-800 bg-stone-900 px-2.5 py-1">
                  ISBN: <span className="font-mono text-stone-300">{book.isbn}</span>
                </div>
              )}
              {book?.price && (
                <div className="rounded-md border border-stone-800 bg-stone-900 px-2.5 py-1 text-amber-400 font-semibold">
                  Preço Sugerido: {formatCurrency(book.price)}
                </div>
              )}
              <div className="rounded-md border border-stone-800 bg-stone-900 px-2.5 py-1">
                {chapters.length} capítulos • {formatNumber(totalWords)} palavras
              </div>
            </div>

            {/* Buy Links / Retailers */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Onde Adquirir o Livro:
              </h3>

              <div className="flex flex-wrap gap-3">
                {buyLinks.length > 0 ? (
                  buyLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-900/20 transition hover:scale-102"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>{link.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </a>
                  ))
                ) : (
                  <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 text-xs text-stone-400">
                    O livro está em fase final de preparação. Em breve links para Amazon Kindle,
                    Kobo e Apple Books estarão disponíveis.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Table of Contents Preview */}
        <div className="rounded-2xl border border-stone-800 bg-stone-950 p-8 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h2 className="font-serif text-2xl font-bold text-white">Sumário da Obra</h2>
            <p className="text-xs text-stone-400 mt-1">
              A jornada narrada ao longo dos capítulos deste Memoir
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((chap, idx) => (
              <div
                key={chap.id}
                className="flex items-start gap-3 rounded-lg border border-stone-800/80 bg-stone-900/40 p-3.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-800 font-mono text-xs font-bold text-amber-400">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="font-serif text-sm font-bold text-stone-200">{chap.title}</h4>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                    {chap.content ? chap.content.slice(0, 100) : 'Capítulo da obra'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About the Author / Callout */}
        <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 p-8 text-center space-y-4">
          <h3 className="font-serif text-2xl font-bold text-white">
            Uma Obra Escrita com Coragem & Verdade
          </h3>
          <p className="text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
            "Não tema os cavalos de madeira que a vida lhe apresentar; dentro deles pode estar o
            exército que libertará você de si mesmo."
          </p>
          <div className="pt-2 text-xs text-amber-500 font-mono tracking-wider">
            GERENCIADOR DE PUBLICAÇÃO DE LIVROS • ED. DO AUTOR
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-8 text-center text-xs text-stone-500">
        <p>
          © {new Date().getFullYear()} {book?.title}. Todos os direitos reservados à autora.
        </p>
      </footer>
    </div>
  )
}

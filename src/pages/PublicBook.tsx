import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFirstBook } from '@/services/books'
import { getChapters } from '@/services/chapters'
import type { BookRecord, ChapterRecord, BuyLink } from '@/types/book'
import { countWords, formatNumber, formatCurrency, estimateReadingTime } from '@/lib/bookUtils'
import { renderCoverDataUrl, resolveCoverData } from '@/lib/coverTemplates'
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

  // Capa gerada dinamicamente pelo template ativo do livro ou fallback
  const resolvedCoverUrl = book
    ? renderCoverDataUrl(resolveCoverData(book, { format: 'digital' }))
    : 'https://img.usecurling.com/p/800/1200?q=book%20cover%20classic%20horse&color=orange'

  const publicTemplate = book?.public_template || 'editorial'

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

  // ----------------------------------------------------
  // Layout 1: Editorial (Quente, papel, serifado tradicional)
  // ----------------------------------------------------
  if (publicTemplate === 'editorial') {
    return (
      <div className="min-h-screen bg-stone-100 font-serif text-stone-900 antialiased selection:bg-amber-200">
        <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800">
                Edição Editorial
              </span>
              <span className="text-stone-300">•</span>
              <span className="font-serif text-base font-bold text-stone-900">
                {book?.title || 'Cavalo de Tróia'}
              </span>
            </div>
            <Link
              to="/entrar"
              className="inline-flex items-center gap-1.5 text-xs font-sans text-stone-600 hover:text-amber-800 transition"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Painel do Autor</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 flex justify-center">
              <img
                src={resolvedCoverUrl}
                alt={book?.title}
                className="w-64 md:w-80 aspect-[2/3] rounded-lg shadow-2xl border border-stone-300 object-cover"
              />
            </div>
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="inline-block text-xs font-mono tracking-widest uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-sm">
                  {book?.genre || 'Memoir'}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-950">
                  {book?.title}
                </h1>
                {book?.subtitle && (
                  <p className="text-xl text-stone-700 italic font-light">{book.subtitle}</p>
                )}
                {book?.author_name && (
                  <p className="text-sm font-sans uppercase tracking-wider text-stone-500 pt-1">
                    Por {book.author_name}
                  </p>
                )}
              </div>

              <div className="border-l-2 border-amber-700 pl-4 py-1 italic text-stone-800 leading-relaxed text-base bg-white/50 p-4 rounded-r-lg">
                {book?.synopsis ||
                  'Um relato autobiográfico profundo sobre travessias, desconstruções e os portões que precisamos abrir dentro de nós mesmos.'}
              </div>

              <div className="flex flex-wrap gap-3 font-sans text-xs text-stone-600">
                {book?.isbn && (
                  <span className="bg-stone-200/80 px-2.5 py-1 rounded">ISBN: {book.isbn}</span>
                )}
                {book?.price && (
                  <span className="bg-amber-100 text-amber-950 font-semibold px-2.5 py-1 rounded">
                    {formatCurrency(book.price)}
                  </span>
                )}
                <span className="bg-stone-200/80 px-2.5 py-1 rounded">
                  {chapters.length} capítulos • {formatNumber(totalWords)} palavras
                </span>
              </div>

              <div className="pt-2">
                {buyLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-3 font-sans">
                    {buyLinks.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-stone-900 text-white px-5 py-2.5 text-xs font-medium hover:bg-stone-800 transition"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{l.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="font-sans text-xs text-stone-500">
                    Disponível em breve nas livrarias parceiras.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-10 space-y-6">
            <h2 className="text-2xl font-bold text-stone-900">Capítulos & Estrutura</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chapters.map((c, i) => (
                <div
                  key={c.id}
                  className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs"
                >
                  <span className="text-xs font-mono text-amber-800 font-bold">{i + 1}.</span>{' '}
                  <span className="font-bold text-stone-900">{c.title}</span>
                  <p className="text-xs text-stone-500 font-sans mt-1 line-clamp-2">
                    {c.content ? c.content.slice(0, 110) : 'Capítulo da obra'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-stone-200 py-8 text-center text-xs font-sans text-stone-500 bg-white">
          © {new Date().getFullYear()} {book?.title}. Edição do Autor.
        </footer>
      </div>
    )
  }

  // ----------------------------------------------------
  // Layout 2: Minimalista (Clean, arrojado, fundo branco, tipografia suíça)
  // ----------------------------------------------------
  if (publicTemplate === 'minimalista') {
    return (
      <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
        <header className="border-b border-neutral-100 bg-white sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
              {book?.title || 'Cavalo de Tróia'}
            </span>
            <Link
              to="/entrar"
              className="text-xs text-neutral-400 hover:text-neutral-900 transition flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              <span>Autor</span>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
              {book?.genre || 'Obra Literária'}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900">
              {book?.title}
            </h1>
            {book?.subtitle && (
              <p className="text-base text-neutral-500 font-light">{book.subtitle}</p>
            )}
            {book?.author_name && (
              <p className="text-xs font-medium text-neutral-400 tracking-wider uppercase pt-1">
                {book.author_name}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <img
              src={resolvedCoverUrl}
              alt={book?.title}
              className="w-60 sm:w-72 aspect-[2/3] rounded-md shadow-xl border border-neutral-200 object-cover"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-4 text-center">
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-serif">
              {book?.synopsis ||
                'Um relato autobiográfico profundo sobre travessias, desconstruções e os portões que precisamos abrir dentro de nós mesmos.'}
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-neutral-400 pt-2 font-mono">
              {book?.isbn && <span>ISBN {book.isbn}</span>}
              <span>{chapters.length} capítulos</span>
              <span>{formatNumber(totalWords)} palavras</span>
              {book?.price && (
                <span className="font-semibold text-neutral-900">{formatCurrency(book.price)}</span>
              )}
            </div>
          </div>

          {buyLinks.length > 0 && (
            <div className="flex justify-center gap-3">
              {buyLinks.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-neutral-900 text-white px-6 py-2.5 text-xs font-semibold hover:bg-neutral-800 transition shadow-xs"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          <div className="max-w-2xl mx-auto border-t border-neutral-100 pt-10 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
              Sumário
            </h3>
            <div className="divide-y divide-neutral-100">
              {chapters.map((c, i) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-800">
                    <span className="text-neutral-400 mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {c.title}
                  </span>
                  <span className="text-neutral-400">{countWords(c.content)} palavras</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-neutral-100 py-8 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} {book?.title}
        </footer>
      </div>
    )
  }

  // ----------------------------------------------------
  // Layout 3: Moderno (Escuro, gradientes, cinematográfico — Padrão)
  // ----------------------------------------------------
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
                  src={resolvedCoverUrl}
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

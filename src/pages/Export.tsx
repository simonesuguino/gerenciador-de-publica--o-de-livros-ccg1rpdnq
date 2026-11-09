import React, { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook } from '@/services/books'
import { getChapters } from '@/services/chapters'
import { useAuth } from '@/contexts/AuthContext'
import type { BookRecord, ChapterRecord } from '@/types/book'
import { countWords, formatNumber, estimateReadingTime } from '@/lib/bookUtils'
import { exportToPrintablePDF, exportToEPUB } from '@/lib/bookExporter'
import { renderCoverDataUrl, resolveCoverData } from '@/lib/coverTemplates'
import {
  Download,
  FileText,
  BookOpen,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export default function Export() {
  const { user, isRevisora, canExportBook } = useAuth()
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [loading, setLoading] = useState(true)

  const isExportBlocked = isRevisora || (book ? !canExportBook(book.id) : false)

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

  const handleExportPDF = () => {
    if (isExportBlocked) {
      toast({
        title: 'Exportação bloqueada',
        description: 'Seu perfil não possui permissão para exportar este manuscrito.',
        variant: 'destructive',
      })
      return
    }

    if (!book || chapters.length === 0) {
      toast({
        title: 'Livro vazio',
        description: 'Adicione capítulos antes de exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      exportToPrintablePDF(book, chapters)
      toast({
        title: 'Visualização gerada',
        description: 'A janela de impressão / PDF foi aberta com todos os capítulos.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar a visualização.',
        variant: 'destructive',
      })
    }
  }

  const handleExportEPUB = () => {
    if (isExportBlocked) {
      toast({
        title: 'Exportação bloqueada',
        description: 'Seu perfil não possui permissão para exportar este manuscrito.',
        variant: 'destructive',
      })
      return
    }

    if (!book || chapters.length === 0) {
      toast({
        title: 'Livro vazio',
        description: 'Adicione capítulos antes de exportar.',
        variant: 'destructive',
      })
      return
    }

    try {
      exportToEPUB(book, chapters)
      toast({
        title: 'EPUB gerado com sucesso',
        description: `O arquivo ${book.title}.epub foi baixado.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o EPUB.',
        variant: 'destructive',
      })
    }
  }

  const totalWords = chapters.reduce((acc, c) => acc + countWords(c.content), 0)

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200 mb-4" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-stone-200" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-stone-200 pb-5">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
              Exportação do Livro
            </h1>
            <Badge variant="outline" className="text-amber-800 border-amber-300">
              PDF & EPUB
            </Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Gere versões completas e formatadas do livro para submeter às plataformas de
            auto-publicação ou imprimir
          </p>
        </div>

        {/* Book Overview Card with dynamic cover preview */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {book ? (
              <img
                src={renderCoverDataUrl(resolveCoverData(book, { format: 'impresso' }))}
                alt={`Capa de ${book.title}`}
                className="h-20 w-14 shrink-0 rounded-md border border-stone-200 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-amber-500 font-serif font-bold shadow-md">
                CT
              </div>
            )}
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">{book?.title}</h2>
              <p className="text-xs text-stone-500 mt-0.5">{book?.subtitle}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400 mt-2">
                <span>{chapters.length} capítulos</span>
                <span>•</span>
                <span>{formatNumber(totalWords)} palavras</span>
                <span>•</span>
                <span>{estimateReadingTime(totalWords)}</span>
                <span>•</span>
                <span className="text-amber-700 font-medium">Capa vinculada automaticamente</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            <span className="font-semibold">Pronto para compilação:</span> todos os{' '}
            {chapters.length} capítulos incluídos em ordem de leitura.
          </div>
        </div>

        {/* Export Formats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: PDF */}
          <Card className="border-stone-200 shadow-xs flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <Printer className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  A5 / Impressão / Gráfica
                </Badge>
              </div>
              <CardTitle className="font-serif text-xl font-bold text-stone-900 pt-3">
                Livro Completo em PDF
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 leading-relaxed">
                Diagramação limpa no formato clássico de livro (A5, margens de encadernação, sumário
                automático, capitulares e numeração de páginas). Ideal para leitura, revisão em
                papel ou impressão sob demanda (KDP / IngramSpark).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Página de título e créditos com ISBN</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Sumário completo ordenado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Quebra de página automática por capítulo</span>
                </li>
              </ul>

              <Button
                onClick={handleExportPDF}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium"
              >
                <Printer className="mr-2 h-4 w-4" />
                Gerar e Salvar em PDF
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: EPUB */}
          <Card className="border-stone-200 shadow-xs flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  Kindle • Kobo • Apple
                </Badge>
              </div>
              <CardTitle className="font-serif text-xl font-bold text-stone-900 pt-3">
                eBook em EPUB (Padrão 3.0)
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 leading-relaxed">
                O formato padrão aceito pela Amazon KDP, Kobo Writing Life, Apple Books e Google
                Play Livros. Texto fluido que se ajusta a qualquer leitor digital, celular ou
                tablet.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Metadados de publicação embutidos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Navegação digital pelo sumário (ePub TOC)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Compatível com leitor Kindle e apps de leitura</span>
                </li>
              </ul>

              <Button
                onClick={handleExportEPUB}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Arquivo .EPUB
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chapters Included Table */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <h3 className="font-serif text-base font-bold text-stone-900 mb-3">
            Conteúdo Incluído na Compilação ({chapters.length} capítulos)
          </h3>
          <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
            {chapters.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-stone-800">
                  <span className="text-stone-400 font-mono mr-2">#{c.position}</span>
                  {c.title}
                </span>
                <span className="text-stone-400 font-mono">
                  {formatNumber(countWords(c.content))} palavras
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

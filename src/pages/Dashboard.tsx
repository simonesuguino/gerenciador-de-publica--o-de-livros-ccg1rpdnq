import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook } from '@/services/books'
import { getChapters } from '@/services/chapters'
import { getChecklistItems } from '@/services/checklist'
import type { BookRecord, ChapterRecord, ChecklistItemRecord } from '@/types/book'
import { countWords, formatNumber, estimateReadingTime } from '@/lib/bookUtils'
import {
  BookOpen,
  PenTool,
  CheckCircle2,
  ListTree,
  Mic,
  Share2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Clock,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [checklist, setChecklist] = useState<ChecklistItemRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const bookData = await getFirstBook()
    if (bookData) {
      setBook(bookData)
      const [chaps, check] = await Promise.all([
        getChapters(bookData.id),
        getChecklistItems(bookData.id),
      ])
      setChapters(chaps)
      setChecklist(check)
    }
    setLoading(false)
  }

  // Calculations
  const totalWords = chapters.reduce((acc, c) => acc + countWords(c.content), 0)
  const targetWords = book?.target_words || 55000
  const writingProgress = Math.min(100, Math.round((totalWords / targetWords) * 100))

  const completedChecklist = checklist.filter((c) => c.completed).length
  const totalChecklist = checklist.length
  const checklistProgress =
    totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0

  const recordedCount = chapters.filter(
    (c) => c.recording_status === 'gravado' || c.recording_status === 'revisado',
  ).length
  const narrationProgress =
    chapters.length > 0 ? Math.round((recordedCount / chapters.length) * 100) : 0

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200 mb-4" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-stone-200" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 md:p-8 text-white shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Memoir em Desenvolvimento</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
                {book?.title || 'Cavalo de Tróia'}
              </h1>
              <p className="text-sm md:text-base text-stone-300 leading-relaxed">
                {book?.subtitle || 'Memórias de uma jornada por dentro das fortalezas invisíveis'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/editor">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow">
                  <PenTool className="mr-2 h-4 w-4" />
                  Continuar Escrevendo
                </Button>
              </Link>
              <Link to="/livro" target="_blank">
                <Button
                  variant="outline"
                  className="border-stone-700 text-stone-200 hover:bg-stone-800"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Página Pública
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Escrita & Palavras */}
          <Card className="border-stone-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Progresso da Escrita
                </CardTitle>
                <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-stone-900 font-serif">
                    {formatNumber(totalWords)}
                  </span>
                  <span className="text-sm text-stone-500 ml-1.5 font-sans">
                    / {formatNumber(targetWords)} palavras
                  </span>
                </div>
                <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50">
                  {writingProgress}%
                </Badge>
              </div>
              <Progress value={writingProgress} className="h-2.5 bg-stone-100" />
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  {estimateReadingTime(totalWords)}
                </span>
                <span>Meta: Memoir ({formatNumber(targetWords)} p.)</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Capítulos */}
          <Card className="border-stone-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Estrutura do Livro
                </CardTitle>
                <div className="rounded-lg bg-stone-100 p-2 text-stone-700">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-stone-900 font-serif">
                    {chapters.length}
                  </span>
                  <span className="text-sm text-stone-500 ml-1.5 font-sans">capítulos criados</span>
                </div>
                <Link
                  to="/estrutura"
                  className="text-xs text-amber-800 hover:underline font-medium"
                >
                  Organizar &rarr;
                </Link>
              </div>
              <div className="flex gap-2 text-xs text-stone-600 pt-1">
                <span className="rounded bg-stone-100 px-2 py-1 font-medium">
                  Média: {chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0}{' '}
                  pal./cap.
                </span>
                <span className="rounded bg-stone-100 px-2 py-1 font-medium">
                  Prólogo ao Epílogo
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Reordene, adicione e organize suas seções a qualquer momento.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Checklist de Publicação */}
          <Card className="border-stone-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Checklist de Publicação
                </CardTitle>
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-stone-900 font-serif">
                    {completedChecklist}
                  </span>
                  <span className="text-sm text-stone-500 ml-1.5 font-sans">
                    / {totalChecklist} plataformas
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-emerald-800 border-emerald-300 bg-emerald-50"
                >
                  {checklistProgress}%
                </Badge>
              </div>
              <Progress value={checklistProgress} className="h-2.5 bg-stone-100" />
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>KDP, Kobo, Apple Books, CBL</span>
                <Link to="/publicacao" className="text-amber-800 font-medium hover:underline">
                  Ver checklist &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Grid / Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/editor"
            className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-100">
                <PenTool className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">Editor de Capítulos</h3>
              <p className="text-xs text-stone-500">
                Área de escrita limpa com salvamento automático e contagem de palavras em tempo
                real.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-800">
              <span>Escrever agora</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/estrutura"
            className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 group-hover:bg-stone-200">
                <ListTree className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Estrutura & Capítulos
              </h3>
              <p className="text-xs text-stone-500">
                Crie novos capítulos, reordene a sequência do livro e ajuste os títulos das partes.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-stone-700">
              <span>Gerenciar índice</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/narracao"
            className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-800 group-hover:bg-purple-100">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Roteiros de Narração
              </h3>
              <p className="text-xs text-stone-500">
                Prepare a versão falada para audiobook com instruções de tom e status de gravação.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-800">
              <span>
                {recordedCount}/{chapters.length} gravados
              </span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/exportacao"
            className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800 group-hover:bg-blue-100">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">Exportar PDF & EPUB</h3>
              <p className="text-xs text-stone-500">
                Gere os arquivos prontos do livro com capa, sumário e formatação para envio às
                plataformas.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-800">
              <span>Baixar livro</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Recent Chapters Preview List */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Índice de Capítulos em Andamento
              </h2>
              <p className="text-xs text-stone-500">
                Visão rápida da extensão e estado de escrita de cada capítulo
              </p>
            </div>
            <Link to="/estrutura">
              <Button variant="outline" size="sm" className="text-xs">
                Ver todos ({chapters.length})
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {chapters.slice(0, 5).map((chap) => {
              const words = countWords(chap.content)
              return (
                <div
                  key={chap.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 hover:bg-stone-50/60 rounded-lg px-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                      {chap.position}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">{chap.title}</h4>
                      <p className="text-xs text-stone-400 line-clamp-1">
                        {chap.content ? chap.content.slice(0, 90) : 'Ainda sem conteúdo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Badge variant="secondary" className="text-xs text-stone-600 bg-stone-100">
                      {formatNumber(words)} palavras
                    </Badge>
                    <Link to={`/editor?capitulo=${chap.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-800 hover:text-amber-900 text-xs"
                      >
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

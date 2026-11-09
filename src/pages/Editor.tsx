import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook } from '@/services/books'
import { getChapters, updateChapter, getChapterById } from '@/services/chapters'
import { useAuth } from '@/contexts/AuthContext'
import type { BookRecord, ChapterRecord } from '@/types/book'
import { countWords, formatNumber, estimateReadingTime } from '@/lib/bookUtils'
import {
  PenTool,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Save,
  BookOpen,
  Mic,
  ListTree,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

export default function Editor() {
  const { user, isRevisora, canEditBook } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [currentChapter, setCurrentChapter] = useState<ChapterRecord | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved')
  const [isDistractionFree, setIsDistractionFree] = useState(false)
  const [loading, setLoading] = useState(true)

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef<string>('')

  // Load book & chapters
  useEffect(() => {
    loadInitial()
  }, [])

  const loadInitial = async () => {
    setLoading(true)
    const b = await getFirstBook()
    if (b) {
      setBook(b)
      const chaps = await getChapters(b.id)
      setChapters(chaps)

      const targetId = searchParams.get('capitulo')
      const target = chaps.find((c) => c.id === targetId) || chaps[0] || null

      if (target) {
        selectChapter(target)
      }
    }
    setLoading(false)
  }

  const selectChapter = (chap: ChapterRecord) => {
    // Flush pending changes before switching
    if (currentChapter && saveStatus === 'dirty') {
      saveContent(currentChapter.id, content, title)
    }

    setCurrentChapter(chap)
    setContent(chap.content || '')
    setTitle(chap.title || '')
    lastSavedContentRef.current = chap.content || ''
    setSaveStatus('saved')
    setSearchParams({ capitulo: chap.id }, { replace: true })
  }

  const isReadOnly = isRevisora || (book ? !canEditBook(book.id) : false)

  const saveContent = useCallback(
    async (chapId: string, newContent: string, newTitle: string) => {
      if (isReadOnly) {
        setSaveStatus('saved')
        return
      }
      setSaveStatus('saving')
      try {
        const updated = await updateChapter(chapId, {
          content: newContent,
          title: newTitle,
        })
        lastSavedContentRef.current = newContent
        setSaveStatus('saved')
        // update local list
        setChapters((prev) => prev.map((c) => (c.id === chapId ? updated : c)))
      } catch (err) {
        console.error('Erro no autosave:', err)
        setSaveStatus('dirty')
      }
    },
    [isReadOnly],
  )

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setSaveStatus('dirty')

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Auto-save after 1000ms of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      if (currentChapter) {
        saveContent(currentChapter.id, val, title)
      }
    }, 1000)
  }

  const handleTitleBlur = () => {
    if (currentChapter && title !== currentChapter.title) {
      saveContent(currentChapter.id, content, title)
    }
  }

  const currentWords = countWords(content)
  const totalBookWords = chapters.reduce(
    (acc, c) => (c.id === currentChapter?.id ? acc + currentWords : acc + countWords(c.content)),
    0,
  )

  // Navigation between chapters
  const currentIndex = chapters.findIndex((c) => c.id === currentChapter?.id)
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200 mb-4" />
          <div className="h-96 w-full animate-pulse rounded-xl bg-stone-200" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div
        className={`flex flex-col min-h-[calc(100vh-4rem)] transition-all ${
          isDistractionFree ? 'bg-stone-50/90' : 'bg-stone-100/60'
        }`}
      >
        {/* Editor Top Bar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-3 backdrop-blur-xs gap-3">
          {/* Chapter Selector & Navigation */}
          <div className="flex items-center gap-2">
            <Select
              value={currentChapter?.id || ''}
              onValueChange={(val) => {
                const target = chapters.find((c) => c.id === val)
                if (target) selectChapter(target)
              }}
            >
              <SelectTrigger className="w-[240px] md:w-[320px] font-serif text-sm font-semibold text-stone-900 border-stone-200">
                <SelectValue placeholder="Selecione o capítulo" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-mono text-xs text-stone-400 mr-2">#{c.position}</span>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={!prevChapter}
                onClick={() => prevChapter && selectChapter(prevChapter)}
                className="h-8 w-8 p-0"
                title="Capítulo anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!nextChapter}
                onClick={() => nextChapter && selectChapter(nextChapter)}
                className="h-8 w-8 p-0"
                title="Próximo capítulo"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats & Save Indicator */}
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <div className="hidden sm:flex items-center gap-3">
              <span className="font-semibold text-stone-800 font-mono">
                {formatNumber(currentWords)} palavras
              </span>
              <span>•</span>
              <span>{estimateReadingTime(currentWords)}</span>
              <span>•</span>
              <span className="text-stone-400">Total do livro: {formatNumber(totalBookWords)}</span>
            </div>

            {/* Autosave badge */}
            <div className="flex items-center gap-1.5">
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Salvo
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                  <Clock className="h-3 w-3 animate-spin" />
                  Salvando...
                </span>
              )}
              {saveStatus === 'dirty' && (
                <button
                  onClick={() => currentChapter && saveContent(currentChapter.id, content, title)}
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium"
                >
                  <Save className="h-3 w-3" />
                  Salvar
                </button>
              )}
            </div>

            {/* Distraction-free toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDistractionFree(!isDistractionFree)}
              className="h-8 w-8 p-0 text-stone-400 hover:text-stone-700"
              title={isDistractionFree ? 'Sair do modo foco' : 'Modo tela cheia / foco'}
            >
              {isDistractionFree ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Writing Sheet */}
        <div className="flex-1 flex justify-center p-4 md:p-8">
          <div
            className={`w-full transition-all bg-white rounded-2xl shadow-sm border border-stone-200/80 p-8 md:p-14 flex flex-col ${
              isDistractionFree ? 'max-w-4xl min-h-[85vh]' : 'max-w-3xl min-h-[75vh]'
            }`}
          >
            {isReadOnly && (
              <div className="mb-4 rounded-lg bg-stone-100 border border-stone-200 p-2.5 text-xs text-stone-600 flex items-center gap-2">
                <span className="font-semibold text-stone-800">Modo de Leitura / Revisão:</span>
                Edição desabilitada para seu perfil de revisora.
              </div>
            )}

            {/* Chapter Title Input */}
            <input
              type="text"
              disabled={isReadOnly}
              value={title}
              onChange={(e) => {
                if (isReadOnly) return
                setTitle(e.target.value)
                setSaveStatus('dirty')
              }}
              onBlur={handleTitleBlur}
              placeholder="Título do Capítulo..."
              className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 placeholder:text-stone-300 border-none outline-none mb-6 w-full focus:ring-0 disabled:bg-transparent disabled:opacity-80"
            />

            {/* Main Textarea */}
            <textarea
              disabled={isReadOnly}
              value={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever seu capítulo aqui... Seu texto é salvo automaticamente a cada pausa."
              className="flex-1 w-full resize-none font-serif text-base md:text-lg leading-relaxed text-stone-800 placeholder:text-stone-300 border-none outline-none focus:ring-0 min-h-[500px] disabled:bg-transparent disabled:opacity-80"
            />

            {/* Sheet Footer */}
            <div className="border-t border-stone-100 pt-4 mt-8 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {formatNumber(currentWords)} palavras escritas neste capítulo
                </span>
              </div>
              <div className="flex items-center gap-3">
                {currentChapter && (
                  <Link
                    to={`/narracao?capitulo=${currentChapter.id}`}
                    className="flex items-center gap-1 text-amber-800 hover:underline font-medium"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Abrir roteiro de narração
                  </Link>
                )}
                <Link
                  to="/estrutura"
                  className="flex items-center gap-1 text-stone-500 hover:underline"
                >
                  <ListTree className="h-3.5 w-3.5" />
                  Ver estrutura completa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

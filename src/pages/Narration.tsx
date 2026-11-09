import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook } from '@/services/books'
import { getChapters, updateChapter } from '@/services/chapters'
import type { BookRecord, ChapterRecord, RecordingStatus } from '@/types/book'
import { countWords, formatNumber, estimateAudioDuration } from '@/lib/bookUtils'
import {
  Mic,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  Volume2,
  Sparkles,
  Save,
  ArrowRight,
  Headphones,
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

export default function Narration() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [currentChapter, setCurrentChapter] = useState<ChapterRecord | null>(null)
  const [script, setScript] = useState('')
  const [status, setStatus] = useState<RecordingStatus>('pendente')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      const targetId = searchParams.get('capitulo')
      const target = chaps.find((c) => c.id === targetId) || chaps[0] || null

      if (target) {
        selectChapter(target)
      }
    }
    setLoading(false)
  }

  const selectChapter = (chap: ChapterRecord) => {
    setCurrentChapter(chap)
    setScript(chap.narration_script || '')
    setStatus(chap.recording_status || 'pendente')
    setSearchParams({ capitulo: chap.id }, { replace: true })
  }

  const handleScriptChange = (val: string) => {
    setScript(val)
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      if (currentChapter) {
        persistChapterData(currentChapter.id, val, status)
      }
    }, 1200)
  }

  const handleStatusChange = async (newStatus: RecordingStatus) => {
    setStatus(newStatus)
    if (currentChapter) {
      await persistChapterData(currentChapter.id, script, newStatus)
      toast({
        title: 'Status atualizado',
        description: `Capítulo marcado como "${newStatus}".`,
      })
    }
  }

  const persistChapterData = async (
    chapId: string,
    newScript: string,
    newStatus: RecordingStatus,
  ) => {
    setIsSaving(true)
    try {
      const updated = await updateChapter(chapId, {
        narration_script: newScript,
        recording_status: newStatus,
      })
      setChapters((prev) => prev.map((c) => (c.id === chapId ? updated : c)))
    } catch (err) {
      console.error('Erro ao salvar narração:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyChapterContent = () => {
    if (!currentChapter) return
    const formatted = `[TOM DE VOZ: reflexivo e intimista]\n\n${currentChapter.content || ''}`
    setScript(formatted)
    persistChapterData(currentChapter.id, formatted, status)
    toast({
      title: 'Texto importado',
      description: 'O texto do capítulo foi inserido no roteiro para adaptação.',
    })
  }

  const scriptWords = countWords(script)
  const recordedCount = chapters.filter((c) => c.recording_status === 'gravado').length
  const reviewedCount = chapters.filter((c) => c.recording_status === 'revisado').length

  const getStatusBadge = (st: RecordingStatus) => {
    switch (st) {
      case 'revisado':
        return <Badge className="bg-emerald-600 text-white">Revisado</Badge>
      case 'gravado':
        return <Badge className="bg-purple-600 text-white">Gravado</Badge>
      default:
        return (
          <Badge variant="outline" className="text-amber-800 border-amber-300">
            Pendente
          </Badge>
        )
    }
  }

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
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
                Roteiros de Narração & Audiobook
              </h1>
              <Badge variant="outline" className="text-purple-800 border-purple-300">
                Audiobook
              </Badge>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Adapte o texto para leitura falada, insira marcações de tom e acompanhe o status de
              gravação
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              Gravação:{' '}
              <strong className="text-stone-800">
                {recordedCount + reviewedCount} de {chapters.length} prontos
              </strong>
            </span>
          </div>
        </div>

        {/* Two-column layout: Chapters Navigator (Left) + Script Editor (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Chapter list with status indicator */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Capítulos do Livro ({chapters.length})
              </h3>
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {chapters.map((chap) => {
                  const isSelected = chap.id === currentChapter?.id
                  return (
                    <button
                      key={chap.id}
                      onClick={() => selectChapter(chap)}
                      className={`w-full flex items-center justify-between text-left p-3 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-600">
                          {chap.position}
                        </span>
                        <span className="truncate">{chap.title}</span>
                      </div>
                      <div className="shrink-0 ml-2">{getStatusBadge(chap.recording_status)}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Audio Tips */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-purple-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Headphones className="h-4 w-4 text-purple-700" />
                <span>Dicas para Narração</span>
              </div>
              <p className="leading-relaxed text-purple-800">
                Use colchetes como{' '}
                <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-mono">
                  [PAUSA 2s]
                </code>{' '}
                ou{' '}
                <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-mono">
                  [TOM: intimista]
                </code>{' '}
                para guiar a voz no estúdio.
              </p>
            </div>
          </div>

          {/* Right: Script Editor for Selected Chapter */}
          <div className="lg:col-span-8 space-y-4">
            {currentChapter ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
                {/* Script Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                      Capítulo #{currentChapter.position}
                    </span>
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      {currentChapter.title}
                    </h2>
                  </div>

                  {/* Status Picker */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">
                      Status de Gravação:
                    </label>
                    <Select
                      value={status}
                      onValueChange={(val) => handleStatusChange(val as RecordingStatus)}
                    >
                      <SelectTrigger className="w-[140px] text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="gravado">Gravado</SelectItem>
                        <SelectItem value="revisado">Revisado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sub-bar with word stats & import action */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <div className="flex items-center gap-4">
                    <span>
                      Palavras no roteiro:{' '}
                      <strong className="text-stone-800 font-mono">
                        {formatNumber(scriptWords)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Volume2 className="h-3.5 w-3.5 text-purple-700" />
                      Estimativa: <strong>{estimateAudioDuration(scriptWords)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(!script || script.trim().length === 0) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyChapterContent}
                        className="text-xs text-stone-700"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Puxar texto do capítulo
                      </Button>
                    )}
                    {isSaving && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-700">
                        <Clock className="h-3 w-3 animate-spin" />
                        Salvando...
                      </span>
                    )}
                  </div>
                </div>

                {/* Script textarea */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Texto do Roteiro / Guia do Locutor
                  </label>
                  <textarea
                    value={script}
                    onChange={(e) => handleScriptChange(e.target.value)}
                    placeholder="[INÍCIO DA FAIXA - TOM INTIMISTA]&#10;&#10;Escreva ou cole aqui o texto com as anotações para a gravação da voz..."
                    className="w-full h-[400px] rounded-xl border border-stone-200 p-4 font-mono text-sm leading-relaxed text-stone-800 placeholder:text-stone-300 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    As alterações são salvas automaticamente.
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                  <Link
                    to={`/editor?capitulo=${currentChapter.id}`}
                    className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                  >
                    <span>Ver texto original no Editor</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs"
                    onClick={() => persistChapterData(currentChapter.id, script, status)}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Salvar Roteiro
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500">
                Selecione um capítulo ao lado para editar o roteiro.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

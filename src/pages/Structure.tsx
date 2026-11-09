import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook } from '@/services/books'
import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from '@/services/chapters'
import type { BookRecord, ChapterRecord } from '@/types/book'
import { countWords, formatNumber } from '@/lib/bookUtils'
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  PenTool,
  Mic,
  GripVertical,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function Structure() {
  const [book, setBook] = useState<BookRecord | null>(null)
  const [chapters, setChapters] = useState<ChapterRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog for adding chapter
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  // Rename inline state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ChapterRecord | null>(null)

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

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book || !newTitle.trim()) return

    try {
      const position = chapters.length + 1
      const created = await createChapter(book.id, newTitle.trim(), position)
      setChapters([...chapters, created])
      setNewTitle('')
      setAddDialogOpen(false)
      toast({
        title: 'Capítulo criado',
        description: `"${created.title}" foi adicionado à estrutura do livro.`,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o capítulo.',
        variant: 'destructive',
      })
    }
  }

  const handleStartRename = (chap: ChapterRecord) => {
    setEditingId(chap.id)
    setEditTitle(chap.title)
  }

  const handleSaveRename = async (id: string) => {
    if (!editTitle.trim()) return
    try {
      const updated = await updateChapter(id, { title: editTitle.trim() })
      setChapters(chapters.map((c) => (c.id === id ? updated : c)))
      setEditingId(null)
      toast({ title: 'Capítulo renomeado com sucesso' })
    } catch {
      toast({
        title: 'Erro ao renomear',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteChapter(deleteTarget.id)
      const remaining = chapters.filter((c) => c.id !== deleteTarget.id)
      // re-index positions
      const orderedIds = remaining.map((c) => c.id)
      await reorderChapters(orderedIds)
      const refreshed = remaining.map((c, i) => ({ ...c, position: i + 1 }))
      setChapters(refreshed)
      setDeleteTarget(null)
      toast({ title: 'Capítulo removido' })
    } catch {
      toast({ title: 'Erro ao remover capítulo', variant: 'destructive' })
    }
  }

  const moveChapter = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= chapters.length) return

    const reordered = [...chapters]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    // update positions locally
    const updatedWithPos = reordered.map((c, idx) => ({ ...c, position: idx + 1 }))
    setChapters(updatedWithPos)

    try {
      await reorderChapters(updatedWithPos.map((c) => c.id))
      toast({ title: 'Ordem atualizada' })
    } catch (err) {
      console.error('Falha ao reordenar:', err)
      toast({ title: 'Erro ao salvar nova ordem', variant: 'destructive' })
      load()
    }
  }

  const totalWords = chapters.reduce((acc, c) => acc + countWords(c.content), 0)

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
                Estrutura do Livro
              </h1>
              <Badge variant="outline" className="text-amber-800 border-amber-300">
                {chapters.length} partes
              </Badge>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Organize, renomeie, reordene e defina o fluxo de leitura do seu Memoir
            </p>
          </div>

          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar Capítulo
          </Button>
        </div>

        {/* Stats banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Extensão Atual</p>
              <p className="text-sm font-semibold text-stone-900">
                {formatNumber(totalWords)} palavras no total
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Dica: use as setas para reposicionar seções e manter a narrativa fluida.
          </p>
        </div>

        {/* Chapter List */}
        <div className="space-y-3">
          {chapters.map((chap, idx) => {
            const isFirst = idx === 0
            const isLast = idx === chapters.length - 1
            const words = countWords(chap.content)
            const isEditing = editingId === chap.id

            return (
              <div
                key={chap.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-stone-300 hover:shadow-sm"
              >
                {/* Left: Position + Title / Inline Editor */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-serif text-sm font-bold text-stone-700">
                    {chap.position}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-sm h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chap.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveRename(chap.id)}
                        className="h-8 w-8 p-0 text-emerald-700"
                        title="Salvar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8 p-0 text-stone-400"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-base font-bold text-stone-900 truncate">
                          {chap.title}
                        </h3>
                        <button
                          onClick={() => handleStartRename(chap)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 transition"
                          title="Renomear título"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {formatNumber(words)} palavras • status narração:{' '}
                        <span className="capitalize">{chap.recording_status}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Reorder Buttons */}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isFirst}
                    onClick={() => moveChapter(idx, 'up')}
                    className="h-8 w-8 p-0 text-stone-500 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isLast}
                    onClick={() => moveChapter(idx, 'down')}
                    className="h-8 w-8 p-0 text-stone-500 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  <div className="h-4 w-px bg-stone-200 mx-1" />

                  {/* Quick Edit Text */}
                  <Link to={`/editor?capitulo=${chap.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-medium text-amber-900 hover:bg-amber-50"
                    >
                      <PenTool className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                      Escrever
                    </Button>
                  </Link>

                  {/* Narration link */}
                  <Link to={`/narracao?capitulo=${chap.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-stone-600 hover:bg-stone-100"
                    >
                      <Mic className="mr-1 h-3.5 w-3.5 text-purple-700" />
                      Roteiro
                    </Button>
                  </Link>

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(chap)}
                    className="h-8 w-8 p-0 text-stone-400 hover:text-red-600"
                    title="Excluir capítulo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dialog: Add Chapter */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddChapter}>
              <DialogHeader>
                <DialogTitle className="font-serif">Adicionar Novo Capítulo</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <label className="text-xs font-semibold text-stone-700">Título do Capítulo</label>
                <Input
                  placeholder="Ex: Capítulo 9: O Retorno das Águas"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <p className="text-[11px] text-stone-400">
                  Você poderá alterar a ordem e o título a qualquer momento.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                  disabled={!newTitle.trim()}
                >
                  Criar Capítulo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-red-700">Excluir Capítulo?</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm text-stone-600 space-y-2">
              <p>
                Tem certeza que deseja excluir <strong>"{deleteTarget?.title}"</strong>?
              </p>
              <p className="text-xs text-stone-500">
                O texto e o roteiro deste capítulo serão removidos e as posições subsequentes serão
                reajustadas.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Manter Capítulo
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir Definitivamente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

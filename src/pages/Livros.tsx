import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBook } from '@/contexts/BookContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Plus, Archive, ArchiveRestore, Pencil, Check, X, Library } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookRecord } from '@/types/book'

export default function Livros() {
  const { books, book, setActiveBook, addBook, patchBook, refresh } = useBook()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [newTarget, setNewTarget] = useState('50000')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const [showArchived, setShowArchived] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast({ title: 'Informe o título do livro', variant: 'destructive' })
      return
    }
    setCreating(true)
    const target = parseInt(newTarget, 10)
    const created = await addBook({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      genre: newGenre.trim() || undefined,
      target_words: Number.isFinite(target) && target > 0 ? target : 50000,
    })
    setCreating(false)
    if (created) {
      toast({ title: 'Livro criado', description: `"${created.title}" já está selecionado.` })
      setCreateOpen(false)
      setNewTitle('')
      setNewSubtitle('')
      setNewGenre('')
      setNewTarget('50000')
      navigate('/')
    } else {
      toast({ title: 'Erro ao criar livro', variant: 'destructive' })
    }
  }

  const startRename = (b: BookRecord) => {
    setEditingId(b.id)
    setEditTitle(b.title)
  }

  const confirmRename = async () => {
    if (!editingId || !editTitle.trim()) return
    await patchBook(editingId, { title: editTitle.trim() })
    toast({ title: 'Livro renomeado' })
    setEditingId(null)
  }

  const toggleArchive = async (b: BookRecord) => {
    const next = !b.archived
    await patchBook(b.id, { archived: next })
    if (next && book?.id === b.id) {
      const others = books.filter((x) => x.id !== b.id && !x.archived)
      if (others.length > 0) setActiveBook(others[0].id)
    }
    toast({
      title: next ? 'Livro arquivado' : 'Livro reativado',
      description: b.title,
    })
  }

  const activeList = books.filter((b) => !b.archived)
  const archivedList = books.filter((b) => b.archived)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Meus livros</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Crie, renomeie e organize suas obras. Todas as telas operam sobre o livro selecionado.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo livro
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {activeList.map((b) => (
          <Card
            key={b.id}
            className={cn(
              'cursor-pointer transition hover:shadow-md',
              book?.id === b.id && 'ring-2 ring-amber-600',
            )}
            onClick={() => setActiveBook(b.id)}
          >
            <CardHeader className="pb-2">
              {editingId === b.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={confirmRename}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  <span className="truncate">{b.title}</span>
                  {book?.id === b.id && (
                    <Badge variant="default" className="shrink-0 bg-amber-600">
                      Ativo
                    </Badge>
                  )}
                </CardTitle>
              )}
              {b.subtitle && editingId !== b.id && (
                <CardDescription className="line-clamp-1">{b.subtitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0 text-stone-500 dark:text-stone-400">
                {b.genre && <span className="line-clamp-1">{b.genre}</span>}
                {b.target_words && (
                  <span className="block">
                    {b.target_words.toLocaleString('pt-BR')} palavras (meta)
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => startRename(b)} title="Renomear">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleArchive(b)} title="Arquivar">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {activeList.length === 0 && (
          <Card className="sm:col-span-2">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Library className="h-8 w-8 text-stone-400" />
              <p className="text-sm text-stone-500">Nenhum livro ativo. Crie seu primeiro.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {archivedList.length > 0 && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Ocultar' : 'Mostrar'} arquivados ({archivedList.length})
          </Button>
          {showArchived &&
            archivedList.map((b) => (
              <Card key={b.id} className="opacity-70">
                <CardContent className="flex items-center justify-between py-3">
                  <span className="truncate text-sm font-medium">{b.title}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleArchive(b)}
                      title="Reativar"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo livro</DialogTitle>
            <DialogDescription>
              O livro começa vazio, sem capítulos. O livro atual permanece intacto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="novo-titulo">Título *</Label>
              <Input
                id="novo-titulo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex.: Diário de uma travessia"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-subtitulo">Subtítulo</Label>
              <Input
                id="novo-subtitulo"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-genero">Gênero</Label>
              <Input
                id="novo-genero"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                placeholder="Ex.: Memoir, Romance, Autoajuda..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-meta">Meta de palavras</Label>
              <Input
                id="novo-meta"
                type="number"
                min={1000}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando…' : 'Criar livro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

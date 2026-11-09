import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { getFirstBook, updateBook } from '@/services/books'
import {
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/services/checklist'
import type { BookRecord, ChecklistItemRecord, BuyLink } from '@/types/book'
import {
  Share2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  Save,
  Globe,
  DollarSign,
  Barcode,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function Publish() {
  const [book, setBook] = useState<BookRecord | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [savingBook, setSavingBook] = useState(false)

  // Book metadata form
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isbn, setIsbn] = useState('')
  const [price, setPrice] = useState<number | string>(49.9)
  const [targetWords, setTargetWords] = useState<number | string>(55000)
  const [genre, setGenre] = useState('')
  const [buyLinks, setBuyLinks] = useState<BuyLink[]>([])

  // Checklist dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [newPlatform, setNewPlatform] = useState('')
  const [newLink, setNewLink] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Buy link add state
  const [newBuyLabel, setNewBuyLabel] = useState('')
  const [newBuyUrl, setNewBuyUrl] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const b = await getFirstBook()
    if (b) {
      setBook(b)
      setTitle(b.title || '')
      setSubtitle(b.subtitle || '')
      setSynopsis(b.synopsis || '')
      setCoverUrl(b.cover_url || '')
      setIsbn(b.isbn || '')
      setPrice(b.price !== undefined ? b.price : 49.9)
      setTargetWords(b.target_words || 55000)
      setGenre(b.genre || '')
      setBuyLinks((b.buy_links as BuyLink[]) || [])

      const items = await getChecklistItems(b.id)
      setChecklist(items)
    }
    setLoading(false)
  }

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book) return
    setSavingBook(true)
    try {
      const updated = await updateBook(book.id, {
        title,
        subtitle,
        synopsis,
        cover_url: coverUrl,
        isbn,
        price: Number(price),
        target_words: Number(targetWords),
        genre,
        buy_links: buyLinks,
      })
      setBook(updated)
      toast({
        title: 'Dados do livro salvos',
        description: 'Metadados e links de compra foram atualizados.',
      })
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingBook(false)
    }
  }

  const handleToggleChecklist = async (item: ChecklistItemRecord) => {
    const nextCompleted = !item.completed
    // optimistic
    setChecklist(checklist.map((c) => (c.id === item.id ? { ...c, completed: nextCompleted } : c)))
    try {
      await updateChecklistItem(item.id, { completed: nextCompleted })
    } catch {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' })
      load()
    }
  }

  const handleCreateChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book || !newPlatform.trim()) return
    try {
      const created = await createChecklistItem(
        book.id,
        newPlatform.trim(),
        newLink.trim(),
        newNotes.trim(),
      )
      setChecklist([...checklist, created])
      setNewPlatform('')
      setNewLink('')
      setNewNotes('')
      setItemDialogOpen(false)
      toast({ title: 'Item adicionado ao checklist' })
    } catch {
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' })
    }
  }

  const handleDeleteChecklistItem = async (id: string) => {
    try {
      await deleteChecklistItem(id)
      setChecklist(checklist.filter((c) => c.id !== id))
      toast({ title: 'Item removido' })
    } catch {
      toast({ title: 'Erro ao remover item', variant: 'destructive' })
    }
  }

  const handleAddBuyLink = () => {
    if (!newBuyLabel.trim() || !newBuyUrl.trim()) return
    const next = [...buyLinks, { label: newBuyLabel.trim(), url: newBuyUrl.trim() }]
    setBuyLinks(next)
    setNewBuyLabel('')
    setNewBuyUrl('')
  }

  const handleRemoveBuyLink = (idx: number) => {
    setBuyLinks(buyLinks.filter((_, i) => i !== idx))
  }

  const completedCount = checklist.filter((c) => c.completed).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

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
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
                Publicação & Plataformas
              </h1>
              <Badge variant="outline" className="text-emerald-800 border-emerald-300">
                Lançamento
              </Badge>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Cadastre os metadados do livro, ISBN, preço, capa e gerencie o checklist em cada
              plataforma
            </p>
          </div>

          <Link to="/livro" target="_blank">
            <Button variant="outline" className="text-xs text-stone-700">
              <Globe className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
              Ver Página Pública do Livro
            </Button>
          </Link>
        </div>

        {/* Top Progress Bar for Checklist */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Progresso Geral de Publicação
              </p>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {completedCount} de {totalCount} plataformas concluídas ({progress}%)
              </h3>
            </div>
            <Button
              size="sm"
              onClick={() => setItemDialogOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar Plataforma
            </Button>
          </div>
          <Progress value={progress} className="h-2.5 bg-stone-100" />
        </div>

        {/* Two-Column Grid: Metadata Form (Left) & Platform Checklist (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Metadata Form */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border-stone-200 shadow-xs">
              <CardHeader>
                <CardTitle className="font-serif text-lg font-bold text-stone-900">
                  Ficha do Livro & Metadados
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Estas informações aparecem na capa, na exportação do PDF/EPUB e na página pública
                  de venda.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSaveMetadata} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Título da Obra
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="text-sm font-serif font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Subtítulo
                    </label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex: Memórias de uma jornada..."
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Gênero / Categoria
                      </label>
                      <Input
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="Ex: Memoir / Autobiografia"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Meta de Palavras
                      </label>
                      <Input
                        type="number"
                        value={targetWords}
                        onChange={(e) => setTargetWords(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ISBN (CBL / Agência)
                      </label>
                      <Input
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        placeholder="978-65-..."
                        className="text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Preço Sugerido (R$)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      URL da Imagem da Capa
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="https://..."
                        className="text-sm font-mono text-xs"
                      />
                    </div>
                    {coverUrl && (
                      <div className="mt-2 flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50 p-2">
                        <img
                          src={coverUrl}
                          alt="Prévia da Capa"
                          className="h-16 w-11 rounded object-cover shadow-xs"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://img.usecurling.com/p/300/450?q=book%20cover&color=orange'
                          }}
                        />
                        <span className="text-[11px] text-stone-500">
                          Prévia da capa carregada com sucesso
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Sinopse da Obra
                    </label>
                    <Textarea
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      rows={5}
                      placeholder="Apresentação do livro para leitores e contra-capa..."
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  {/* Buy Links Management */}
                  <div className="border-t border-stone-100 pt-4">
                    <label className="block text-xs font-semibold text-stone-700 mb-2">
                      Links de Compra (Página Pública)
                    </label>
                    <div className="space-y-2 mb-3">
                      {buyLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-1.5 text-xs border border-stone-200"
                        >
                          <div>
                            <span className="font-semibold text-stone-800">{link.label}:</span>{' '}
                            <span className="text-stone-500 truncate max-w-[200px] inline-block align-bottom font-mono">
                              {link.url}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuyLink(idx)}
                            className="text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome (ex: Amazon)"
                        value={newBuyLabel}
                        onChange={(e) => setNewBuyLabel(e.target.value)}
                        className="text-xs w-1/3"
                      />
                      <Input
                        placeholder="https://amazon.com.br/..."
                        value={newBuyUrl}
                        onChange={(e) => setNewBuyUrl(e.target.value)}
                        className="text-xs flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddBuyLink}
                        className="text-xs"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingBook}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingBook ? 'Salvando...' : 'Salvar Dados do Livro'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Platforms Checklist */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Checklist de Plataformas
                  </h3>
                  <p className="text-xs text-stone-400">
                    Acompanhe o status e acesse o painel direto de cada distribuidor
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition ${
                      item.completed
                        ? 'border-emerald-200 bg-emerald-50/40 text-stone-700'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Checkmark toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item)}
                      className="mt-0.5 shrink-0 text-emerald-700 hover:scale-110 transition"
                      title={item.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 fill-emerald-600 text-white" />
                      ) : (
                        <Circle className="h-5 w-5 text-stone-300" />
                      )}
                    </button>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            item.completed ? 'line-through text-stone-500' : 'text-stone-900'
                          }`}
                        >
                          {item.platform}
                        </h4>
                      </div>

                      {item.notes && <p className="text-xs text-stone-500 mt-1">{item.notes}</p>}

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-amber-800 hover:underline font-medium mt-1.5"
                        >
                          <span>Acessar portal da plataforma</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="text-stone-300 hover:text-red-600 p-1 shrink-0"
                      title="Remover plataforma do checklist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog: Add Checklist Item */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateChecklistItem}>
              <DialogHeader>
                <DialogTitle className="font-serif">Adicionar Plataforma ao Checklist</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">
                    Nome da Plataforma / Órgão
                  </label>
                  <Input
                    placeholder="Ex: Barnes & Noble Press"
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700">
                    Link de Acesso (URL do painel)
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700">
                    Anotações / Instruções
                  </label>
                  <Input
                    placeholder="Ex: Enviar capa em alta resolução e conferir preço"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  disabled={!newPlatform.trim()}
                >
                  Adicionar ao Checklist
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

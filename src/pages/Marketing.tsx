import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { useBook } from '@/contexts/BookContext'
import {
  getMarketingPosts,
  createMarketingPost,
  updateMarketingPost,
  deleteMarketingPost,
} from '@/services/marketing'
import type { MarketingPostRecord, MarketingStatus } from '@/types/book'
import { MARKETING_PLATFORMS } from '@/types/book'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Megaphone,
  Hand,
  ExternalLink,
  CircleDot,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: MarketingStatus; label: string }[] = [
  { value: 'ideia', label: 'Ideia' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'publicado', label: 'Publicado' },
]

const STATUS_STYLES: Record<MarketingStatus, string> = {
  ideia:
    'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
  agendado:
    'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  publicado:
    'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
}

interface PostFormState {
  platform: string
  status: MarketingStatus
  scheduled_date: string
  caption: string
  notes: string
}

const EMPTY_FORM: PostFormState = {
  platform: 'instagram',
  status: 'ideia',
  scheduled_date: '',
  caption: '',
  notes: '',
}

export default function Marketing() {
  const { book } = useBook()
  const [posts, setPosts] = useState<MarketingPostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({})
  const [manualSaving, setManualSaving] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!book) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)
    getMarketingPosts(book.id)
      .then((rows) => {
        if (!cancelled) {
          setPosts(rows)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false)
          toast({ title: 'Erro ao carregar posts', variant: 'destructive' })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (p: MarketingPostRecord) => {
    setEditingId(p.id)
    setForm({
      platform: p.platform,
      status: p.status,
      scheduled_date: p.scheduled_date ? p.scheduled_date.slice(0, 10) : '',
      caption: p.caption || '',
      notes: p.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!book) return
    setSaving(true)
    try {
      const data = {
        platform: form.platform,
        status: form.status,
        scheduled_date: form.scheduled_date || undefined,
        caption: form.caption.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      if (editingId) {
        const updated = await updateMarketingPost(editingId, data)
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast({ title: 'Post atualizado' })
      } else {
        const created = await createMarketingPost(book.id, data)
        setPosts((prev) => [created, ...prev])
        toast({ title: 'Post criado', description: 'Acompanhe o status na lista abaixo.' })
      }
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar post', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteMarketingPost(id)
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast({ title: 'Post excluído' })
    } else {
      toast({ title: 'Erro ao excluir post', variant: 'destructive' })
    }
  }

  const cycleStatus = async (p: MarketingPostRecord) => {
    const order: MarketingStatus[] = ['ideia', 'agendado', 'publicado']
    const next = order[(order.indexOf(p.status) + 1) % order.length]
    try {
      const updated = await updateMarketingPost(p.id, { status: next })
      setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      toast({ title: 'Erro ao mudar status', variant: 'destructive' })
    }
  }

  const saveManualTikTok = async (p: MarketingPostRecord) => {
    setManualSaving(p.id)
    try {
      const updated = await updateMarketingPost(p.id, {
        notes: manualNotes[p.id] ?? p.notes ?? '',
      })
      setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      toast({ title: 'Anotação do TikTok salva' })
    } catch {
      toast({ title: 'Erro ao salvar anotação', variant: 'destructive' })
    } finally {
      setManualSaving(null)
    }
  }

  const grouped = new Map<string, MarketingPostRecord[]>()
  for (const p of posts) {
    const list = grouped.get(p.platform) ?? []
    list.push(p)
    grouped.set(p.platform, list)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <div className="border-b border-stone-200 pb-5 dark:border-stone-800">
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Marketing</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Planeje e acompanhe as publicações de <strong>{book?.title ?? '—'}</strong> nas redes.
            Conecte suas próprias contas para publicar direto.
          </p>
        </div>

        {/* Conexões de contas (modo usuários próprios) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suas contas conectadas</CardTitle>
            <CardDescription>
              Cada conta é sua: ninguém mais vê ou usa estas conexões. O TikTok não tem integração —
              o acompanhamento é manual, nos posts abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <ConnectorButton toolkit="facebook" name="Facebook" className="flex items-center" />
              <ConnectorButton toolkit="instagram" name="Instagram" className="flex items-center" />
              <ConnectorButton toolkit="linkedin" name="LinkedIn" className="flex items-center" />
              <ConnectorButton toolkit="whatsapp" name="WhatsApp" className="flex items-center" />
              <ConnectorButton toolkit="mailchimp" name="Mailchimp" className="flex items-center" />
              <ConnectorButton toolkit="canva" name="Canva" className="flex items-center" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">Posts por plataforma</h2>
          <Button onClick={openCreate} disabled={!book}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo post
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Megaphone className="h-8 w-8 text-stone-400" />
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Nenhum post ainda. Crie o primeiro para organizar a divulgação do livro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([platform, list]) => {
              const meta = MARKETING_PLATFORMS.find((p) => p.key === platform)
              const label = meta?.label ?? platform
              return (
                <Card key={platform}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CircleDot className="h-4 w-4 text-amber-600" />
                      {label}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {list.length} {list.length === 1 ? 'post' : 'posts'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {list.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-stone-200 p-3 dark:border-stone-800"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => cycleStatus(p)}
                            title="Clique para mudar o status"
                          >
                            <Badge
                              variant="outline"
                              className={cn('cursor-pointer', STATUS_STYLES[p.status])}
                            >
                              {STATUS_OPTIONS.find((s) => s.value === p.status)?.label ?? p.status}
                            </Badge>
                          </button>
                          {p.scheduled_date && (
                            <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(p.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          <div className="ml-auto flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(p.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        {p.caption && (
                          <p className="mt-2 line-clamp-2 text-sm text-stone-700 dark:text-stone-300">
                            {p.caption}
                          </p>
                        )}
                        {p.notes && (
                          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                            {p.notes}
                          </p>
                        )}
                        {p.platform === 'tiktok_manual' && (
                          <div className="mt-3 space-y-2 rounded-md bg-stone-50 p-3 dark:bg-stone-900">
                            <Label className="flex items-center gap-1.5 text-xs">
                              <Hand className="h-3.5 w-3.5" />
                              Acompanhamento manual (TikTok não tem integração)
                            </Label>
                            <Textarea
                              rows={2}
                              placeholder="Ex.: vídeo publicado hoje, 1.2k views, refazer hook..."
                              value={manualNotes[p.id] ?? p.notes ?? ''}
                              onChange={(e) =>
                                setManualNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveManualTikTok(p)}
                              disabled={manualSaving === p.id}
                            >
                              {manualSaving === p.id && (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              )}
                              Salvar anotação
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar post' : 'Novo post'}</DialogTitle>
            <DialogDescription>
              Registre a publicação e acompanhe o status. Para publicar direto na rede, conecte a
              conta acima.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plataforma</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETING_PLATFORMS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as MarketingStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-date">Data agendada</Label>
              <Input
                id="mk-date"
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-caption">Legenda / texto</Label>
              <Textarea
                id="mk-caption"
                rows={4}
                placeholder="O texto que será publicado..."
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-notes">Notas</Label>
              <Input
                id="mk-notes"
                placeholder="Ex.: usar foto da capa, best time 19h..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {form.platform === 'tiktok_manual' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <ExternalLink className="h-3.5 w-3.5" />
                  TikTok
                </span>
                <p className="mt-1">
                  O TikTok não tem integração nesta versão: publique manualmente no app e use o
                  campo de anotações para acompanhar resultados.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

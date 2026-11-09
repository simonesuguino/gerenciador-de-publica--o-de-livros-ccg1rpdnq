import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useBook } from '@/contexts/BookContext'
import { createSale, deleteSale, getSales, updateSale } from '@/services/sales'
import { SALES_PLATFORMS, type SaleRecord } from '@/types/book'
import { formatCurrency, formatNumber } from '@/lib/bookUtils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BookOpen, Loader2, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'

export const Vendas: React.FC = () => {
  const { book } = useBook()
  const { toast } = useToast()
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SaleRecord | null>(null)
  const [deleting, setDeleting] = useState<SaleRecord | null>(null)
  const [form, setForm] = useState({
    sale_date: '',
    platform: 'amazon_kdp',
    units: '1',
    revenue: '',
    notes: '',
  })

  const loadSales = useCallback(async () => {
    if (!book) {
      setSales([])
      return
    }
    setLoading(true)
    try {
      setSales(await getSales(book.id))
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as vendas deste livro.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [book, toast])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const openNew = () => {
    setEditing(null)
    setForm({
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      platform: 'amazon_kdp',
      units: '1',
      revenue: '',
      notes: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (sale: SaleRecord) => {
    setEditing(sale)
    setForm({
      sale_date: sale.sale_date ? sale.sale_date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      platform: sale.platform,
      units: String(sale.units ?? 1),
      revenue: sale.revenue != null ? String(sale.revenue) : '',
      notes: sale.notes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!book) return
    const units = Math.max(0, parseInt(form.units, 10) || 0)
    const revenue =
      form.revenue === '' ? null : Math.max(0, parseFloat(form.revenue.replace(',', '.')) || 0)
    try {
      setSaving(true)
      if (editing) {
        await updateSale(editing.id, {
          sale_date: form.sale_date,
          platform: form.platform,
          units,
          revenue,
          notes: form.notes,
        })
        toast({ title: 'Venda atualizada' })
      } else {
        await createSale(book.id, {
          sale_date: form.sale_date,
          platform: form.platform,
          units,
          revenue,
          notes: form.notes,
        })
        toast({ title: 'Venda registrada' })
      }
      setDialogOpen(false)
      await loadSales()
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a venda. Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteSale(deleting.id)
      toast({ title: 'Venda excluída' })
      setDeleting(null)
      await loadSales()
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a venda.',
        variant: 'destructive',
      })
    }
  }

  const totals = useMemo(() => {
    const totalUnits = sales.reduce((acc, s) => acc + (s.units || 0), 0)
    const totalRevenue = sales.reduce((acc, s) => acc + (s.revenue || 0), 0)
    const byPlatform = SALES_PLATFORMS.map((p) => ({
      platform: p.value,
      label: p.label,
      units: sales
        .filter((s) => s.platform === p.value)
        .reduce((acc, s) => acc + (s.units || 0), 0),
      revenue: sales
        .filter((s) => s.platform === p.value)
        .reduce((acc, s) => acc + (s.revenue || 0), 0),
    })).filter((p) => p.units > 0 || p.revenue > 0)
    return { totalUnits, totalRevenue, byPlatform }
  }, [sales])

  // Evolução por mês (últimos 6 meses com dados)
  const monthly = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>()
    for (const s of sales) {
      if (!s.sale_date) continue
      const key = s.sale_date.slice(0, 7) // yyyy-MM
      const cur = map.get(key) ?? { units: 0, revenue: 0 }
      cur.units += s.units || 0
      cur.revenue += s.revenue || 0
      map.set(key, cur)
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    return sorted.slice(-6)
  }, [sales])

  const maxMonthly = Math.max(1, ...monthly.map(([, v]) => v.revenue || v.units))

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Vendas</h1>
            <p className="text-sm text-stone-500">
              Lançamentos manuais de vendas de{' '}
              <span className="font-medium text-stone-700">{book ? book.title : '—'}</span>
            </p>
          </div>
          <Button onClick={openNew} disabled={!book}>
            <Plus className="mr-2 h-4 w-4" /> Nova venda
          </Button>
        </div>

        {!book ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <BookOpen className="h-8 w-8 text-stone-300" />
              <p className="text-sm text-stone-500">
                Crie ou selecione um livro para registrar vendas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Totais */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Unidades vendidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-stone-900">
                    {formatNumber(totals.totalUnits)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Receita total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-stone-900">
                    {formatCurrency(totals.totalRevenue)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-500">Lançamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-stone-900">{formatNumber(sales.length)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Evolução mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-amber-700" /> Evolução mensal (receita)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthly.length === 0 ? (
                  <p className="py-6 text-center text-sm text-stone-500">
                    Sem dados ainda — registre sua primeira venda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {monthly.map(([month, v]) => (
                      <div key={month} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-medium text-stone-500">
                          {format(new Date(`${month}-15`), 'MMM/yy', { locale: ptBR })}
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-amber-700"
                            style={{
                              width: `${Math.max(4, ((v.revenue || 0) / maxMonthly) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-24 text-right text-xs font-medium text-stone-700">
                          {formatCurrency(v.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Por loja */}
            {totals.byPlatform.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {totals.byPlatform.map((p) => (
                      <div key={p.platform} className="rounded-lg border border-stone-200 p-3">
                        <p className="text-sm font-medium text-stone-700">{p.label}</p>
                        <p className="text-xs text-stone-500">{formatNumber(p.units)} unidades</p>
                        <p className="mt-1 text-lg font-bold text-stone-900">
                          {formatCurrency(p.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de lançamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lançamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                  </div>
                ) : sales.length === 0 ? (
                  <p className="py-6 text-center text-sm text-stone-500">
                    Nenhuma venda registrada para este livro.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {sales.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {SALES_PLATFORMS.find((p) => p.value === s.platform)?.label ??
                              s.platform}
                            <span className="ml-2 text-xs font-normal text-stone-500">
                              {s.sale_date ? format(new Date(s.sale_date), 'dd/MM/yyyy') : '—'}
                            </span>
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatNumber(s.units || 0)} unidades
                            {s.notes ? ` · ${s.notes}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-stone-900">
                            {formatCurrency(s.revenue ?? 0)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4 text-stone-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(s)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar venda' : 'Nova venda'}</DialogTitle>
            <DialogDescription>
              Registre a venda manualmente — loja, data, unidades e receita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale_date">Data</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={form.sale_date}
                  onChange={(e) => setForm((f) => ({ ...f, sale_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Loja</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="units">Unidades</Label>
                <Input
                  id="units"
                  type="number"
                  min="0"
                  value={form.units}
                  onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Receita (R$)</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.revenue}
                  onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex.: promoção, cupom..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !form.sale_date}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir venda</DialogTitle>
            <DialogDescription>
              Excluir o lançamento de{' '}
              {deleting?.sale_date ? format(new Date(deleting.sale_date), 'dd/MM/yyyy') : '—'}? Essa
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

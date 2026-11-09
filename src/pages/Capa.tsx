import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { useBook } from '@/contexts/BookContext'
import { updateBook } from '@/services/books'
import {
  COVER_TEMPLATES,
  CUSTOM_COVER_ID,
  coverDataFromBook,
  renderCoverDataUrl,
  type CoverRenderData,
} from '@/lib/coverTemplates'
import { Check, Image as ImageIcon, Loader2, Palette, Wand2 } from 'lucide-react'

const DEFAULT_CUSTOM: CoverRenderData = {
  title: '',
  subtitle: '',
  author: '',
  backgroundColor: '#1c1917',
  textColor: '#fafaf9',
  accentColor: '#d97706',
  fontFamily: "Georgia, 'Times New Roman', serif",
  alignment: 'center',
}

export default function Capa() {
  const { book, refresh } = useBook()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formatView, setFormatView] = useState<'digital' | 'impresso'>('digital')
  const [custom, setCustom] = useState<CoverRenderData>(DEFAULT_CUSTOM)

  // Sincroniza o editor com o livro ativo
  useEffect(() => {
    if (!book) return
    const cd = coverDataFromBook(book)
    if (book.cover_template === CUSTOM_COVER_ID && book.cover_custom) {
      try {
        const parsed = JSON.parse(book.cover_custom) as Partial<CoverRenderData>
        setCustom({
          ...DEFAULT_CUSTOM,
          ...parsed,
          title: parsed.title ?? cd.title,
          subtitle: parsed.subtitle ?? cd.subtitle ?? '',
          author: parsed.author ?? cd.author ?? '',
        })
        return
      } catch {
        // cai para o default abaixo
      }
    }
    setCustom({
      ...DEFAULT_CUSTOM,
      title: cd.title,
      subtitle: cd.subtitle ?? '',
      author: cd.author ?? '',
    })
  }, [book])

  // Pré-visualização da capa personalizada
  const previewUrl = useMemo(() => {
    if (custom.title === '') return null
    return renderCoverDataUrl({ ...custom, format: formatView })
  }, [custom, formatView])

  // Pré-visualizações da galeria com dados do livro ativo
  const templatePreviews = useMemo(() => {
    if (!book) return [] as { id: string; name: string; url: string }[]
    const data = coverDataFromBook(book)
    return COVER_TEMPLATES.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      url: renderCoverDataUrl({ ...data, ...tpl.defaults, format: formatView }),
    }))
  }, [book, formatView])

  const applyTemplate = useCallback(
    async (tplId: string, customData?: object) => {
      if (!book) return
      try {
        setSaving(true)
        await updateBook(book.id, {
          cover_template: tplId,
          cover_custom: customData ? JSON.stringify(customData) : '',
        })
        await refresh()
        toast({
          title: 'Capa aplicada',
          description: 'A nova capa vale para exportação e página pública.',
        })
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível aplicar a capa. Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setSaving(false)
      }
    },
    [book, refresh, toast],
  )

  const handleApplyCustom = async () => {
    if (!book) return
    if (!custom.title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe ao menos o título da capa personalizada.',
        variant: 'destructive',
      })
      return
    }
    await applyTemplate(CUSTOM_COVER_ID, custom)
  }

  const currentData = book ? coverDataFromBook(book) : null
  const currentUrl = currentData ? renderCoverDataUrl({ ...currentData, format: formatView }) : null
  const usingCustom = book?.cover_template === CUSTOM_COVER_ID

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        <div className="border-b border-stone-200 pb-5 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">Capa do livro</h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Escolha um template da galeria ou personalize — a capa aparece na exportação e na
                página pública de <strong>{book ? book.title : '—'}</strong>
              </p>
            </div>
            {/* Seletor de formato: Digital x Impresso */}
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-stone-900">
              <button
                type="button"
                onClick={() => setFormatView('digital')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  formatView === 'digital'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                📱 Digital / e-Book
              </button>
              <button
                type="button"
                onClick={() => setFormatView('impresso')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  formatView === 'impresso'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                📖 Impresso (com lombada/corte)
              </button>
            </div>
          </div>
        </div>

        {!book ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <ImageIcon className="h-8 w-8 text-stone-300" />
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Crie ou selecione um livro para definir a capa.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Capa atual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4 text-amber-600" /> Capa atual
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-start gap-6">
                {currentUrl && (
                  <img
                    src={currentUrl}
                    alt={`Capa de ${book.title}`}
                    className="w-40 rounded-lg border border-stone-200 shadow-sm dark:border-stone-800"
                  />
                )}
                <div className="space-y-1">
                  <p className="text-sm text-stone-500 dark:text-stone-400">Template em uso:</p>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {usingCustom
                      ? 'Personalizado'
                      : (COVER_TEMPLATES.find((t) => t.id === book.cover_template)?.name ??
                        'Memoir Clássico')}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Usada na exportação PDF/EPUB e na página pública do livro.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Galeria de templates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Galeria de templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {templatePreviews.map(({ id, name, url }) => {
                    const active = book.cover_template === id
                    return (
                      <div key={id} className="space-y-2">
                        <button
                          type="button"
                          className={`relative block w-full overflow-hidden rounded-lg border-2 transition ${
                            active
                              ? 'border-amber-700 ring-2 ring-amber-700/30'
                              : 'border-transparent hover:border-stone-300'
                          }`}
                          onClick={() => applyTemplate(id)}
                          disabled={saving}
                        >
                          <img
                            src={url}
                            alt={name}
                            className="aspect-[2/3] w-full bg-stone-100 object-cover"
                          />
                          {active && (
                            <span className="absolute right-2 top-2 rounded-full bg-amber-700 p-1">
                              <Check className="h-3 w-3 text-white" />
                            </span>
                          )}
                        </button>
                        <p className="text-center text-xs font-medium text-stone-600 dark:text-stone-400">
                          {name}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Editor personalizado */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="h-4 w-4 text-amber-600" /> Capa personalizada
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cover-title">Título</Label>
                    <Input
                      id="cover-title"
                      value={custom.title}
                      onChange={(e) => setCustom((c) => ({ ...c, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cover-subtitle">Subtítulo</Label>
                    <Input
                      id="cover-subtitle"
                      value={custom.subtitle ?? ''}
                      onChange={(e) => setCustom((c) => ({ ...c, subtitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cover-author">Autor</Label>
                    <Input
                      id="cover-author"
                      value={custom.author ?? ''}
                      onChange={(e) => setCustom((c) => ({ ...c, author: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cover-bg">Fundo</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="cover-bg"
                          type="color"
                          value={custom.backgroundColor}
                          onChange={(e) =>
                            setCustom((c) => ({ ...c, backgroundColor: e.target.value }))
                          }
                          className="h-9 w-12 cursor-pointer rounded border border-stone-200 dark:border-stone-700"
                        />
                        <span className="text-xs text-stone-500">{custom.backgroundColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cover-fg">Texto</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="cover-fg"
                          type="color"
                          value={custom.textColor}
                          onChange={(e) => setCustom((c) => ({ ...c, textColor: e.target.value }))}
                          className="h-9 w-12 cursor-pointer rounded border border-stone-200 dark:border-stone-700"
                        />
                        <span className="text-xs text-stone-500">{custom.textColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cover-accent">Destaque</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="cover-accent"
                          type="color"
                          value={custom.accentColor}
                          onChange={(e) =>
                            setCustom((c) => ({ ...c, accentColor: e.target.value }))
                          }
                          className="h-9 w-12 cursor-pointer rounded border border-stone-200 dark:border-stone-700"
                        />
                        <span className="text-xs text-stone-500">{custom.accentColor}</span>
                        <Palette className="h-3 w-3 text-stone-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Posição do texto</Label>
                    <div className="flex gap-2">
                      {(['top', 'center', 'bottom'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setCustom((c) => ({ ...c, alignment: pos }))}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition ${
                            custom.alignment === pos
                              ? 'border-amber-700 bg-amber-50 text-amber-900'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Base'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleApplyCustom} disabled={saving || !custom.title.trim()}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Aplicar capa personalizada
                  </Button>
                </div>
                <div>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Pré-visualização da capa personalizada"
                      className="w-full max-w-[280px] rounded-lg border border-stone-200 shadow-sm dark:border-stone-800"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}

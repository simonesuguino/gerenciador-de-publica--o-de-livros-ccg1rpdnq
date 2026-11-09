import { AppLayout } from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePreferences, ACCENT_OPTIONS } from '@/contexts/PreferencesContext'
import { useBook } from '@/contexts/BookContext'
import { updateBook } from '@/services/books'
import { useToast } from '@/hooks/use-toast'
import { renderCoverDataUrl, resolveCoverData } from '@/lib/coverTemplates'
import { Check, Loader2, Moon, Palette, Sun } from 'lucide-react'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import type { BookRecord, PublicTemplateId } from '@/types/book'
import { PUBLIC_TEMPLATES } from '@/types/book'

export default function Aparencia() {
  const { themeMode, setThemeMode, accentColor, setAccentColor } = usePreferences()
  const { book, refresh } = useBook()
  const { toast } = useToast()
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null)

  const currentPublicTemplate = (book?.public_template as PublicTemplateId) ?? 'capa_central'

  const handlePublicTemplate = async (tpl: string) => {
    if (!book) return
    try {
      setSavingTemplate(tpl)
      await updateBook(book.id, { public_template: tpl })
      await refresh()
      toast({ title: 'Template da página pública atualizado' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o template. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingTemplate(null)
    }
  }

  // Pré-visualização com dados do livro atual (ou falsos, para quando não há livro)
  const previewBook = (book ?? {
    id: 'preview',
    title: 'Cavalo de Tróia',
    subtitle: 'Um memoir',
    author_name: 'Autor',
    synopsis: 'Breve sinopse do livro aparece aqui.',
  }) as BookRecord

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Aparência</h1>
          <p className="text-sm text-stone-500">
            Personalize o tema do app e o template da página pública do seu livro.
          </p>
        </div>

        {/* Tema claro/escuro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4 text-amber-700" /> Tema do app
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <button
                type="button"
                onClick={() => setThemeMode('claro')}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  themeMode === 'claro'
                    ? 'border-amber-700 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm font-medium text-stone-900">Claro</span>
                </div>
                <div className="h-8 rounded bg-stone-100" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('escuro')}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  themeMode === 'escuro'
                    ? 'border-amber-700 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span className="text-sm font-medium text-stone-900">Escuro</span>
                </div>
                <div className="h-8 rounded bg-stone-800" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Cor de destaque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-amber-700" /> Cor de destaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccentColor(opt.value)}
                  className={`flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 transition ${
                    accentColor === opt.value
                      ? 'border-amber-700'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                  aria-label={`Cor ${opt.label}`}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: opt.value }}
                  >
                    {accentColor === opt.value && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="text-xs font-medium text-stone-700">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template da página pública */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template da página pública (/livro)</CardTitle>
          </CardHeader>
          <CardContent>
            {!book && (
              <Label className="mb-3 block text-xs text-stone-500">
                Selecione um livro para definir o template da página pública dele.
              </Label>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              {PUBLIC_TEMPLATES.map((tpl) => {
                const active = currentPublicTemplate === tpl.id
                return (
                  <div key={tpl.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handlePublicTemplate(tpl.id)}
                      disabled={savingTemplate !== null}
                      className={`block w-full overflow-hidden rounded-lg border-2 text-left transition ${
                        active
                          ? 'border-amber-700 ring-2 ring-amber-700/30'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <TemplateMockup tpl={tpl.id} book={previewBook} />
                    </button>
                    <div className="px-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">{tpl.name}</span>
                        {active && <Check className="h-3.5 w-3.5 text-amber-700" />}
                        {savingTemplate === tpl.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{tpl.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

// Miniatura ilustrativa de cada layout público
function TemplateMockup({ tpl, book }: { tpl: string; book: BookRecord }) {
  const coverData = resolveCoverData(book)
  const cover = renderCoverDataUrl(coverData)
  const isDark = tpl === 'moderno'
  const isMinimal = tpl === 'minimalista'
  const bg = isDark
    ? 'bg-stone-900 text-stone-100'
    : isMinimal
      ? 'bg-white text-neutral-900'
      : 'bg-stone-100 text-stone-900'

  return (
    <div className={`${bg} space-y-2 p-3 transition-colors`}>
      <div className="flex gap-3">
        {cover ? (
          <img src={cover} alt="" className="aspect-[2/3] w-12 rounded shadow object-cover" />
        ) : (
          <div className="aspect-[2/3] w-12 rounded bg-stone-300" />
        )}
        <div className="min-w-0 flex-1 space-y-1.5 py-1">
          <div
            className={`h-2 w-3/4 rounded ${isDark ? 'bg-amber-500' : isMinimal ? 'bg-neutral-800' : 'bg-amber-800'}`}
          />
          <div
            className={`h-2 w-1/2 rounded ${isDark ? 'bg-stone-600' : isMinimal ? 'bg-neutral-300' : 'bg-stone-300'}`}
          />
          <div
            className={`h-2 w-2/3 rounded ${isDark ? 'bg-amber-800' : isMinimal ? 'bg-neutral-400' : 'bg-amber-200'}`}
          />
        </div>
      </div>
      <div className="space-y-1 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded ${isDark ? 'bg-stone-800' : isMinimal ? 'bg-neutral-100' : 'bg-stone-200'}`}
            style={{ width: `${95 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  )
}

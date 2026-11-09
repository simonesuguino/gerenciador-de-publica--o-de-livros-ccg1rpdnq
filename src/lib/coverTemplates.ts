import type { BookRecord } from '@/types/book'

/**
 * Templates de capa renderizados no app (SVG → PNG) — sem serviços externos.
 * Cada template desenha 800×1200 com título, subtítulo e autor do livro.
 */

export interface TemplateDefaults {
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
}

export interface CoverTemplate {
  id: string
  name: string
  description: string
  defaults: TemplateDefaults
}

export interface CoverRenderData {
  title: string
  subtitle?: string
  author?: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  /** Layout custom: onde o bloco de texto fica */
  alignment?: 'top' | 'center' | 'bottom'
}

/** Dados do livro + preferências do template ativo ou custom. */
export function coverDataFromBook(book: BookRecord | null): CoverRenderData {
  const template = COVER_TEMPLATES.find((t) => t.id === book?.cover_template)
  return {
    title: book?.title || 'Título do Livro',
    subtitle: book?.subtitle || '',
    author: book?.author_name || '',
    backgroundColor: template?.defaults.backgroundColor || '#1c1917',
    textColor: template?.defaults.textColor || '#fafaf9',
    accentColor: template?.defaults.accentColor || '#d97706',
    fontFamily: template?.defaults.fontFamily || "Georgia, 'Times New Roman', serif",
  }
}

export function renderCoverSVG(data: CoverRenderData): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const title = esc(data.title || 'Título do Livro')
  const subtitle = esc(data.subtitle || '')
  const author = esc(data.author || '')

  // Quebra o título em linhas de até 14 caracteres (aprox.)
  const wrap = (text: string, max: number) => {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).trim().length > max && line) {
        lines.push(line.trim())
        line = w
      } else {
        line = (line + ' ' + w).trim()
      }
    }
    if (line) lines.push(line.trim())
    return lines
  }

  const titleLines = wrap(data.title || 'Título', 14)
  const subtitleLines = data.subtitle ? wrap(data.subtitle, 30) : []
  const titleSize = titleLines.length > 2 ? 68 : titleLines.length > 1 ? 80 : 92

  let body = ''
  const isCustom = data.alignment !== undefined
  const startY = isCustom
    ? data.alignment === 'top'
      ? 240
      : data.alignment === 'center'
        ? 560
        : 880
    : 560

  const titleY = isCustom ? startY : startY
  const subtitleY = titleY + titleLines.length * (titleSize + 8) + 20
  const authorY =
    subtitleLines.length > 0 ? subtitleY + subtitleLines.length * 34 + 30 : subtitleY + 40

  body += titleLines
    .map(
      (line, i) =>
        `<text x="400" y="${titleY + i * (titleSize + 8)}" font-family="${data.fontFamily}" font-size="${titleSize}" font-weight="bold" fill="${data.textColor}" text-anchor="middle">${line}</text>`,
    )
    .join('')

  if (subtitleLines.length > 0) {
    body += subtitleLines
      .map(
        (line, i) =>
          `<text x="400" y="${subtitleY + i * 34}" font-family="${data.fontFamily}" font-size="24" font-style="italic" fill="${data.textColor}" opacity="0.85" text-anchor="middle">${line}</text>`,
      )
      .join('')
  }

  if (author) {
    body += `<text x="400" y="${authorY}" font-family="${data.fontFamily}" font-size="20" font-weight="600" fill="${data.accentColor}" letter-spacing="4" text-anchor="middle" transform="uppercase">${author.toUpperCase()}</text>`
  }

  // Ornamento decorativo acima do título
  body += `<line x1="300" y1="${titleY - 60}" x2="500" y2="${titleY - 60}" stroke="${data.accentColor}" stroke-width="2"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <rect width="800" height="1200" fill="${data.backgroundColor}"/>
  <rect x="40" y="40" width="720" height="1120" fill="none" stroke="${data.accentColor}" stroke-width="1" opacity="0.35"/>
  ${body}
</svg>`
}

/** Renderiza a capa como data-URL PNG (para uso em <img> e exportação). */
export function renderCoverDataUrl(data: CoverRenderData): string {
  const svg = renderCoverSVG(data)
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

const serif = "Georgia, 'Times New Roman', serif"
const sans = "'Helvetica Neue', Arial, sans-serif"
const mono = "'Courier New', monospace"

const make = (
  id: string,
  name: string,
  description: string,
  defaults: TemplateDefaults,
): CoverTemplate => ({
  id,
  name,
  description,
  defaults,
})

/** Galeria de 8 templates prontos. */
export const COVER_TEMPLATES: CoverTemplate[] = [
  make('memoir_classico', 'Memoir Clássico', 'Tipografia serifada elegante em fundo escuro.', {
    backgroundColor: '#1c1917',
    textColor: '#fafaf9',
    accentColor: '#d97706',
    fontFamily: serif,
  }),
  make('faixa_quente', 'Faixa Quente', 'Banda de cor quente com tipografia serifada.', {
    backgroundColor: '#7c2d12',
    textColor: '#fff7ed',
    accentColor: '#fbbf24',
    fontFamily: serif,
  }),
  make('minimal_claro', 'Minimal Claro', 'Minimalista em tom claro, discreto e limpo.', {
    backgroundColor: '#fafaf9',
    textColor: '#1c1917',
    accentColor: '#a8a29e',
    fontFamily: sans,
  }),
  make('noturno', 'Noturno', 'Fundo azul-noite com acento suave.', {
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    fontFamily: sans,
  }),
  make('verde_sage', 'Verde Sage', 'Verde suave, ar de memória e natureza.', {
    backgroundColor: '#1a2e1a',
    textColor: '#ecfdf5',
    accentColor: '#6ee7b7',
    fontFamily: serif,
  }),
  make('terroso', 'Terroso', 'Tons terrosos com tipografia forte.', {
    backgroundColor: '#44403c',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    fontFamily: serif,
  }),
  make('romance_rosa', 'Rosa Suave', 'Rosa pálido, ideal para histórias pessoais.', {
    backgroundColor: '#fff1f2',
    textColor: '#881337',
    accentColor: '#e11d48',
    fontFamily: serif,
  }),
  make('moderno_mono', 'Moderno Mono', 'Forte, contemporâneo, tipografia monoespaçada.', {
    backgroundColor: '#111827',
    textColor: '#f9fafb',
    accentColor: '#a3e635',
    fontFamily: mono,
  }),
]

export const CUSTOM_COVER_ID = 'custom'

/** Resolve os dados de render: template ativo ou custom. */
export function resolveCoverData(
  book: BookRecord | null,
  overrides?: Partial<CoverRenderData>,
): CoverRenderData {
  const base = coverDataFromBook(book)
  if (book?.cover_template === CUSTOM_COVER_ID && book.cover_custom) {
    try {
      const custom = JSON.parse(book.cover_custom) as Partial<CoverRenderData>
      return {
        ...base,
        ...custom,
        title: book.title,
        subtitle: book.subtitle || '',
        author: book.author_name || '',
      }
    } catch {
      /* cai no template base */
    }
  }
  return { ...base, ...overrides }
}

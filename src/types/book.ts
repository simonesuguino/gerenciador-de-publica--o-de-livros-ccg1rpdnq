export interface BuyLink {
  label: string
  url: string
}

export interface BookRecord {
  id: string
  title: string
  subtitle?: string
  synopsis?: string
  cover_url?: string
  cover_template?: string
  cover_custom?: string
  public_template?: string
  author_name?: string
  archived?: boolean
  isbn?: string
  price?: number
  target_words?: number
  buy_links?: BuyLink[] | string
  genre?: string
  created: string
  updated: string
}

export type RecordingStatus = 'pendente' | 'gravado' | 'revisado'

export interface ChapterRecord {
  id: string
  book_id: string
  title: string
  content?: string
  position: number
  narration_script?: string
  recording_status: RecordingStatus
  created: string
  updated: string
}

export interface ChecklistItemRecord {
  id: string
  book_id: string
  platform: string
  platform_key?: string
  link?: string
  completed?: boolean
  notes?: string
  position?: number
  created: string
  updated: string
}

// ---------- Marketing ----------

export type MarketingStatus = 'ideia' | 'agendado' | 'publicado'

export interface MarketingPostRecord {
  id: string
  book_id: string
  platform: string
  scheduled_date?: string
  status: MarketingStatus
  caption?: string
  notes?: string
  created: string
  updated: string
}

/** Plataformas de marketing. TikTok é acompanhamento manual (sem integração). */
export const MARKETING_PLATFORMS: { key: string; label: string; toolkit: string | null }[] = [
  { key: 'instagram', label: 'Instagram', toolkit: 'instagram' },
  { key: 'facebook', label: 'Facebook', toolkit: 'facebook' },
  { key: 'linkedin', label: 'LinkedIn', toolkit: 'linkedin' },
  { key: 'whatsapp', label: 'WhatsApp', toolkit: 'whatsapp' },
  { key: 'mailchimp', label: 'Mailchimp', toolkit: 'mailchimp' },
  { key: 'canva', label: 'Canva', toolkit: 'canva' },
  { key: 'googleanalytics', label: 'Google Analytics', toolkit: 'googleanalytics' },
  { key: 'tiktok_manual', label: 'TikTok (manual)', toolkit: null },
]

// ---------- Vendas ----------

export type SalesPlatform = 'amazon_kdp' | 'kobo' | 'apple_books' | 'ingramspark' | 'outra'

export const SALES_PLATFORMS: { value: SalesPlatform; label: string }[] = [
  { value: 'amazon_kdp', label: 'Amazon KDP' },
  { value: 'kobo', label: 'Kobo' },
  { value: 'apple_books', label: 'Apple Books' },
  { value: 'ingramspark', label: 'IngramSpark' },
  { value: 'outra', label: 'Outra' },
]

export interface SaleRecord {
  id: string
  book_id: string
  sale_date: string
  platform: SalesPlatform
  units: number
  revenue: number
  currency: string
  notes?: string
  created: string
  updated: string
}

// ---------- Preferências ----------

export type ThemeMode = 'claro' | 'escuro'
export type AccentColor = 'amber' | 'emerald' | 'violet' | 'blue' | 'rose'

export interface UserPreferencesRecord {
  id: string
  user_id: string
  theme_mode: ThemeMode
  accent_color: AccentColor
  created: string
  updated: string
}

// ---------- Templates de página pública ----------

export type PublicTemplateId = 'capa_central' | 'capa_lateral' | 'minimalista'

export const PUBLIC_TEMPLATES: { id: PublicTemplateId; name: string; description: string }[] = [
  {
    id: 'capa_central',
    name: 'Capa Central',
    description: 'Capa em destaque no centro, sinopse e detalhes abaixo.',
  },
  {
    id: 'capa_lateral',
    name: 'Capa Lateral',
    description: 'Capa à esquerda, texto e botões de compra ao lado.',
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Sem capa, só tipografia — título grande, sinopse e links.',
  },
]

export type UserRole = 'administradora' | 'colaboradora' | 'revisora'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  is_active?: boolean
}

export interface BookAccessRecord {
  id: string
  user_id: string
  book_id: string
  can_view: boolean
  can_comment: boolean
  can_edit: boolean
  can_attach: boolean
  can_download: boolean
  can_export: boolean
  created: string
  updated: string
  expand?: {
    user_id?: UserRecord
    book_id?: BookRecord
  }
}

export interface InvitationRecord {
  id: string
  email: string
  token: string
  role: UserRole
  book_ids?: string[]
  permissions?: {
    can_view?: boolean
    can_comment?: boolean
    can_edit?: boolean
    can_attach?: boolean
    can_download?: boolean
    can_export?: boolean
  }
  expires_at: string
  used: boolean
  used_at?: string
  created_by?: string
  created: string
  updated: string
}

export interface AuditLogRecord {
  id: string
  action: string
  author_id?: string
  author_email?: string
  target_id?: string
  target_type?: string
  details?: Record<string, unknown> | string
  ip?: string
  created: string
  updated: string
}

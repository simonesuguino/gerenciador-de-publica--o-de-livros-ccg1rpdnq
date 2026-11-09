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

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
}

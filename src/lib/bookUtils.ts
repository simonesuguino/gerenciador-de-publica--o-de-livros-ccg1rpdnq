export function countWords(text?: string | null): number {
  if (!text) return 0
  // Remove markdown tags/headings/extra spaces
  const clean = text.replace(/[#*_~`>[\]()]/g, ' ').trim()
  if (!clean) return 0
  const words = clean.split(/\s+/)
  return words.filter((w) => w.length > 0).length
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function estimateReadingTime(words: number): string {
  const wordsPerMinute = 200
  const minutes = Math.ceil(words / wordsPerMinute)
  if (minutes < 60) {
    return `${minutes} min de leitura`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return `${hours}h ${remMinutes > 0 ? `${remMinutes}m` : ''} de leitura`
}

export function estimateAudioDuration(words: number): string {
  // Average speaking pace for audiobooks is ~130-150 words per minute
  const wordsPerMinute = 140
  const minutes = Math.ceil(words / wordsPerMinute)
  if (minutes < 60) {
    return `${minutes} min de áudio`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return `${hours}h ${remMinutes > 0 ? `${remMinutes}m` : ''} de narração`
}

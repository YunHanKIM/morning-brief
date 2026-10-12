import type { QuoteRaw } from './fetch'

export interface QuoteData {
  quote: string
  author: string
  translation: string | null
}

export function normalizeQuote(raw: QuoteRaw): QuoteData {
  return { quote: raw.quote.trim(), author: raw.author.trim(), translation: raw.translation }
}

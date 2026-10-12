import type { Widget } from '../types'
import { fetchQuote, type QuoteRaw } from './fetch'
import { normalizeQuote, type QuoteData } from './normalize'

export const quoteWidget: Widget<QuoteData, QuoteRaw> = {
  name: 'quote',
  fetch: fetchQuote,
  normalize: normalizeQuote,
}

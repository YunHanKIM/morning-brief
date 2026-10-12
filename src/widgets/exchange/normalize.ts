import type { Currency } from './currencies'
import type { ExchangeRaw } from './fetch'

export interface ExchangeData {
  base: 'USD'
  date: string
  rates: Record<Currency, number>
}

export function normalizeExchange(raw: ExchangeRaw): ExchangeData {
  return { base: raw.base, date: raw.date, rates: raw.rates }
}

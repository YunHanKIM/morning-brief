import type { Currency } from './currencies'
import type { ExchangeRaw } from './fetch'

export interface ExchangeData {
  base: 'USD'
  quote: Currency
  rate: number
  date: string
}

export function normalizeExchange(raw: ExchangeRaw, to: Currency): ExchangeData {
  return { base: raw.base, quote: to, rate: raw.rates[to], date: raw.date }
}

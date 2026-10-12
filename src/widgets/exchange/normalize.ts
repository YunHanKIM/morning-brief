import type { ExchangeRaw } from './fetch'

export interface ExchangeData {
  rate: number
  date: string
}

export function normalizeExchange(raw: ExchangeRaw): ExchangeData {
  return { rate: raw.rates.KRW, date: raw.date }
}

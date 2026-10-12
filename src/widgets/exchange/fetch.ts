import { z } from 'zod'
import { DEFAULT_CURRENCY, type Currency } from './currencies'

const EXCHANGE_URL = 'https://api.frankfurter.dev/v1/latest'
const TIMEOUT_MS = 5000

const exchangeRawSchema = z.object({
  amount: z.literal(1),
  base: z.literal('USD'),
  date: z.iso.date(),
  rates: z.record(z.string(), z.number().positive()),
})

export type ExchangeRaw = z.infer<typeof exchangeRawSchema>

export async function fetchExchange(to: Currency = DEFAULT_CURRENCY): Promise<ExchangeRaw> {
  const response = await fetch(`${EXCHANGE_URL}?base=USD&symbols=${to}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Frankfurter 응답 오류: ${response.status}`)
  }
  const raw = exchangeRawSchema.parse(await response.json())
  if (raw.rates[to] === undefined) {
    throw new Error(`Frankfurter 응답에 ${to} 환율이 없습니다`)
  }
  return raw
}

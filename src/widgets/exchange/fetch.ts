import { z } from 'zod'

const EXCHANGE_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW'
const TIMEOUT_MS = 5000

const exchangeRawSchema = z.object({
  amount: z.literal(1),
  base: z.literal('USD'),
  date: z.iso.date(),
  rates: z.object({
    KRW: z.number().positive(),
  }),
})

export type ExchangeRaw = z.infer<typeof exchangeRawSchema>

export async function fetchExchange(): Promise<ExchangeRaw> {
  const response = await fetch(EXCHANGE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`Frankfurter 응답 오류: ${response.status}`)
  }
  return exchangeRawSchema.parse(await response.json())
}

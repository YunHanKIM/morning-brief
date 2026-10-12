import { z } from 'zod'

const ZENQUOTES_URL = 'https://zenquotes.io/api/today'
const TIMEOUT_MS = 5000
// 한도를 넘으면 저자 자리에 이 이름으로 안내문이 담겨 온다
const NOTICE_AUTHOR = 'zenquotes.io'

const zenquotesSchema = z
  .array(z.object({ q: z.string().trim().min(1), a: z.string().trim().min(1) }))
  .min(1)

export interface TodayQuote {
  quote: string
  author: string
}

export async function fetchTodayQuote(): Promise<TodayQuote> {
  const response = await fetch(ZENQUOTES_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`ZenQuotes 응답 오류: ${response.status}`)
  }
  const [first] = zenquotesSchema.parse(await response.json())
  if (first.a === NOTICE_AUTHOR) {
    throw new Error('ZenQuotes 요청 한도를 넘었습니다')
  }
  return { quote: first.q, author: first.a }
}

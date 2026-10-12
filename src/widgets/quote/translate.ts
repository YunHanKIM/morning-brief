import { z } from 'zod'

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'
const TIMEOUT_MS = 5000
// MyMemory가 한 번에 받는 글자 수 제한
const MAX_LENGTH = 500

const myMemorySchema = z.object({
  responseStatus: z.union([z.number(), z.string()]),
  responseData: z.object({ translatedText: z.string() }),
})

// 번역은 있으면 좋은 덤이라, 어떤 이유로든 못 쓰면 던지지 않고 null을 돌려준다
export async function translateToKorean(text: string): Promise<string | null> {
  const original = text.trim()
  if (!original || original.length > MAX_LENGTH) return null

  try {
    const params = new URLSearchParams({ q: original, langpair: 'en|ko' })
    const response = await fetch(`${MYMEMORY_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return null

    const body = myMemorySchema.parse(await response.json())
    // 하루 한도를 넘으면 상태 코드(429)나 번역문 자리에 경고문이 온다
    if (Number(body.responseStatus) !== 200) return null
    const translated = body.responseData.translatedText.trim()
    if (!translated || translated.startsWith('MYMEMORY WARNING') || translated === original) {
      return null
    }
    return translated
  } catch {
    return null
  }
}

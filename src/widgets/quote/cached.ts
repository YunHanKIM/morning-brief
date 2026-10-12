import { cacheLife } from 'next/cache'
import { fetchTodayQuote, type TodayQuote } from './zenquotes'
import { translateToKorean } from './translate'

// 외부 API 호출 횟수를 줄이려고 결과를 저장한다(ZenQuotes 무료 한도, MyMemory 하루 5,000자).
// 서버리스에서는 저장이 유지되지 않을 수 있어, 실패해도 영어만 보여주는 대체 동작이 전제다.
// 실패는 던지지 않고 null로 돌려주고 아주 짧게만 저장해 한도 초과 중에 계속 두드리지 않게 한다.

export async function getTodayQuote(): Promise<TodayQuote | null> {
  'use cache'
  try {
    const quote = await fetchTodayQuote()
    cacheLife('hours')
    return quote
  } catch {
    cacheLife('minutes')
    return null
  }
}

export async function getKoreanTranslation(text: string): Promise<string | null> {
  'use cache'
  const translated = await translateToKorean(text)
  // 번역은 같은 문장이면 항상 같으므로 하루. 실패는 일시적일 수 있어 짧게
  if (translated) cacheLife('days')
  else cacheLife('minutes')
  return translated
}

import { getKoreanTranslation, getTodayQuote } from './cached'

export interface QuoteRaw {
  quote: string
  author: string
  translation: string | null
}

export async function fetchQuote(): Promise<QuoteRaw> {
  const today = await getTodayQuote()
  if (!today) {
    throw new Error('오늘의 명언을 가져오지 못했습니다')
  }
  return { ...today, translation: await getKoreanTranslation(today.quote) }
}

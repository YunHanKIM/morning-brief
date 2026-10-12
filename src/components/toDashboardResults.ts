import { CURRENCIES } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import type { NewsData } from '../widgets/news/normalize'
import type { QuoteData } from '../widgets/quote/normalize'
import type { WidgetResult } from '../widgets/types'
import type { WeatherData } from '../widgets/weather/normalize'

export interface DashboardResults {
  weather?: WidgetResult<WeatherData>
  exchange?: WidgetResult<ExchangeData>
  news?: WidgetResult<NewsData>
  quote?: WidgetResult<QuoteData>
}

function isWeatherData(value: unknown): value is WeatherData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.temperature === 'number' &&
    typeof v.condition === 'string' &&
    typeof v.high === 'number' &&
    typeof v.low === 'number'
  )
}

function isExchangeData(value: unknown): value is ExchangeData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (v.base !== 'USD' || typeof v.date !== 'string') return false
  const rates = v.rates
  if (typeof rates !== 'object' || rates === null) return false
  const r = rates as Record<string, unknown>
  return CURRENCIES.every((code) => typeof r[code] === 'number')
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function isNewsData(value: unknown): value is NewsData {
  if (typeof value !== 'object' || value === null) return false
  const items = (value as Record<string, unknown>).items
  if (!Array.isArray(items)) return false
  return items.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const v = item as Record<string, unknown>
    return (
      typeof v.id === 'number' &&
      typeof v.title === 'string' &&
      typeof v.score === 'number' &&
      isHttpUrl(v.url) &&
      isHttpUrl(v.discussionUrl)
    )
  })
}

function isQuoteData(value: unknown): value is QuoteData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.quote === 'string' &&
    v.quote.trim().length > 0 &&
    typeof v.author === 'string' &&
    v.author.trim().length > 0 &&
    (v.translation === null || typeof v.translation === 'string')
  )
}

// 모양이 틀린 ok 결과는 error로 바꾼다
function narrow<T>(
  result: WidgetResult<unknown> | undefined,
  isValid: (value: unknown) => value is T,
  message: string,
): WidgetResult<T> | undefined {
  if (!result) return undefined
  if (result.status === 'error') return result
  return isValid(result.data) ? { status: 'ok', data: result.data } : { status: 'error', message }
}

// runWidgets의 이름 키 결과를 카드가 쓰는 타입으로 좁힌다
export function toDashboardResults(raw: Record<string, WidgetResult<unknown>>): DashboardResults {
  return {
    weather: narrow(raw.weather, isWeatherData, '날씨 데이터 형식이 올바르지 않습니다'),
    exchange: narrow(raw.exchange, isExchangeData, '환율 데이터 형식이 올바르지 않습니다'),
    news: narrow(raw.news, isNewsData, '뉴스 데이터 형식이 올바르지 않습니다'),
    quote: narrow(raw.quote, isQuoteData, '명언 데이터 형식이 올바르지 않습니다'),
  }
}

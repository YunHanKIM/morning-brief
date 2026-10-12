import { CURRENCIES } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import type { WidgetResult } from '../widgets/types'
import type { WeatherData } from '../widgets/weather/normalize'

export interface DashboardResults {
  weather?: WidgetResult<WeatherData>
  exchange?: WidgetResult<ExchangeData>
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
  }
}

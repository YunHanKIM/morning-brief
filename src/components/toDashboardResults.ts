import type { WidgetResult } from '../widgets/types'
import type { WeatherData } from '../widgets/weather/normalize'

export interface DashboardResults {
  weather?: WidgetResult<WeatherData>
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

// runWidgets의 이름 키 결과를 카드가 쓰는 타입으로 좁힌다. 모양이 틀린 ok 결과는 error로 바꾼다
export function toDashboardResults(raw: Record<string, WidgetResult<unknown>>): DashboardResults {
  const results: DashboardResults = {}
  const weather = raw.weather
  if (weather?.status === 'error') {
    results.weather = weather
  } else if (weather?.status === 'ok') {
    results.weather = isWeatherData(weather.data)
      ? { status: 'ok', data: weather.data }
      : { status: 'error', message: '날씨 데이터 형식이 올바르지 않습니다' }
  }
  return results
}

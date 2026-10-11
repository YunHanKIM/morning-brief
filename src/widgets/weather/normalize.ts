import type { WeatherRaw } from './fetch'

export interface WeatherData {
  temperature: number
  condition: string
  high: number
  low: number
}

function describeWeatherCode(code: number): string {
  if (code === 0) return '맑음'
  if (code === 1) return '대체로 맑음'
  if (code === 2) return '구름 많음'
  if (code === 3) return '흐림'
  if (code === 45 || code === 48) return '안개'
  if (code >= 51 && code <= 57) return '이슬비'
  if (code >= 61 && code <= 67) return '비'
  if (code >= 71 && code <= 77) return '눈'
  if (code >= 80 && code <= 82) return '소나기'
  if (code === 85 || code === 86) return '눈 소나기'
  if (code >= 95 && code <= 99) return '뇌우'
  return '알 수 없음'
}

export function normalizeWeather(raw: WeatherRaw): WeatherData {
  return {
    temperature: raw.current.temperature_2m,
    condition: describeWeatherCode(raw.current.weather_code),
    high: raw.daily.temperature_2m_max[0],
    low: raw.daily.temperature_2m_min[0],
  }
}

'use server'

import { runWidget } from '../widgets/runWidget'
import type { WidgetResult } from '../widgets/types'
import { parseCity, searchCities, type City } from '../widgets/weather/city'
import { createWeatherWidget } from '../widgets/weather'
import type { WeatherData } from '../widgets/weather/normalize'

export type SearchCitiesResult =
  | { status: 'ok'; cities: City[] }
  | { status: 'error'; message: string }

// Server Action은 직접 POST로도 호출될 수 있으므로 입력을 믿지 않는다
export async function searchCitiesAction(query: unknown): Promise<SearchCitiesResult> {
  if (typeof query !== 'string') return { status: 'ok', cities: [] }
  try {
    return { status: 'ok', cities: await searchCities(query) }
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

export async function loadWeatherAction(city: unknown): Promise<WidgetResult<WeatherData>> {
  const parsed = parseCity(city)
  if (!parsed) return { status: 'error', message: '올바르지 않은 도시입니다' }
  return runWidget(createWeatherWidget(parsed))
}

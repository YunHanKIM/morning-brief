import { exchangeWidget } from '../widgets/exchange'
import { runWidgets } from '../widgets/runWidgets'
import type { City } from '../widgets/weather/city'
import { createWeatherWidget } from '../widgets/weather'
import { toDashboardResults } from './toDashboardResults'

export async function loadDashboardResults(city: City) {
  const results = await runWidgets([createWeatherWidget(city), exchangeWidget])
  return toDashboardResults(results)
}

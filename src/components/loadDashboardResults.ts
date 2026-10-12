import { exchangeWidget } from '../widgets/exchange'
import { runWidgets } from '../widgets/runWidgets'
import { weatherWidget } from '../widgets/weather'
import { toDashboardResults } from './toDashboardResults'

export async function loadDashboardResults() {
  const results = await runWidgets([weatherWidget, exchangeWidget])
  return toDashboardResults(results)
}

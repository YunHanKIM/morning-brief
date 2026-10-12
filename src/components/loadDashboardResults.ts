import { exchangeWidget } from '../widgets/exchange'
import { newsWidget } from '../widgets/news'
import { quoteWidget } from '../widgets/quote'
import { runWidgets } from '../widgets/runWidgets'
import type { City } from '../widgets/weather/city'
import { createWeatherWidget } from '../widgets/weather'
import { toDashboardResults } from './toDashboardResults'

// 저장된 도시가 없으면 날씨는 조회하지 않는다(사용자가 먼저 도시를 고른다)
export async function loadDashboardResults(city: City | null) {
  const widgets = city
    ? [createWeatherWidget(city), exchangeWidget, newsWidget, quoteWidget]
    : [exchangeWidget, newsWidget, quoteWidget]
  return toDashboardResults(await runWidgets(widgets))
}

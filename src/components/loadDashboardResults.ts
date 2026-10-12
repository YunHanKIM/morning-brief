import { createExchangeWidget } from '../widgets/exchange'
import { parseCurrency } from '../widgets/exchange/currencies'
import { runWidgets } from '../widgets/runWidgets'
import { weatherWidget } from '../widgets/weather'
import { toDashboardResults } from './toDashboardResults'

// 주소의 쿼리(?to=)를 받아 위젯을 실행한다. to는 믿을 수 없는 입력이라 목록으로 좁힌다
export async function loadDashboardResults(query: { to?: unknown }) {
  const results = await runWidgets([weatherWidget, createExchangeWidget(parseCurrency(query.to))])
  return toDashboardResults(results)
}

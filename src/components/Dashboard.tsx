import type { ReactNode } from 'react'
import { DEFAULT_CURRENCY, type Currency } from '../widgets/exchange/currencies'
import type { City } from '../widgets/weather/city'
import { ExchangeCard } from './ExchangeCard'
import { NewsCard } from './NewsCard'
import { PageShell } from './PageShell'
import { QuoteCard } from './QuoteCard'
import type { DashboardResults } from './toDashboardResults'
import { WeatherCard } from './WeatherCard'

export function Dashboard({
  results,
  loading = false,
  currency = DEFAULT_CURRENCY,
  city = null,
  readOnly = false,
  banner,
  children,
}: {
  results: DashboardResults
  loading?: boolean
  currency?: Currency
  city?: City | null
  // 저장된 지난 브리핑을 볼 때: 도시 바꾸기 같은 변경 기능을 숨긴다
  readOnly?: boolean
  // 제목 아래(카드들 위)와 카드들 아래에 끼워 넣는 영역
  banner?: ReactNode
  children?: ReactNode
}) {
  return (
    <PageShell>
      {banner}
      <WeatherCard result={results.weather} loading={loading} city={city} readOnly={readOnly} />
      <ExchangeCard result={results.exchange} loading={loading} selected={currency} />
      <NewsCard result={results.news} loading={loading} />
      <QuoteCard result={results.quote} loading={loading} />
      {children}
    </PageShell>
  )
}

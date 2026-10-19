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
      <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        <WeatherCard result={results.weather} loading={loading} city={city} readOnly={readOnly} />
        <ExchangeCard result={results.exchange} loading={loading} selected={currency} />
        <div className="md:col-span-2">
          <NewsCard result={results.news} loading={loading} />
        </div>
        <div className="md:col-span-2">
          <QuoteCard result={results.quote} loading={loading} />
        </div>
      </div>
      {children}
    </PageShell>
  )
}

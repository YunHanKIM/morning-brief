import { DEFAULT_CURRENCY, type Currency } from '../widgets/exchange/currencies'
import type { City } from '../widgets/weather/city'
import { ExchangeCard } from './ExchangeCard'
import type { DashboardResults } from './toDashboardResults'
import { WeatherCard } from './WeatherCard'

export function Dashboard({
  results,
  loading = false,
  currency = DEFAULT_CURRENCY,
  city = null,
}: {
  results: DashboardResults
  loading?: boolean
  currency?: Currency
  city?: City | null
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Morning Brief</h1>
      <WeatherCard result={results.weather} loading={loading} city={city} />
      <ExchangeCard result={results.exchange} loading={loading} selected={currency} />
    </main>
  )
}

import { WeatherCard } from './WeatherCard'
import type { DashboardResults } from './toDashboardResults'

export function Dashboard({
  results,
  loading = false,
}: {
  results: DashboardResults
  loading?: boolean
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Morning Brief</h1>
      <WeatherCard result={results.weather} loading={loading} />
    </main>
  )
}

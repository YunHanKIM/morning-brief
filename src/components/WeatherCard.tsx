import type { WidgetResult } from '../widgets/types'
import type { WeatherData } from '../widgets/weather/normalize'

export function WeatherCard({
  result,
  loading = false,
}: {
  result?: WidgetResult<WeatherData>
  loading?: boolean
}) {
  return (
    <section aria-labelledby="weather-title" className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="weather-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">날씨</h2>
      {loading && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          날씨 정보가 없습니다
        </p>
      )}
      {result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          날씨를 가져오지 못했습니다: {result.message}
        </p>
      )}
      {result?.status === 'ok' && (
        <div className="mt-2">
          <p className="text-4xl font-semibold">{result.data.temperature}°</p>
          <p>{result.data.condition}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {`최고 ${result.data.high}° / 최저 ${result.data.low}°`}
          </p>
        </div>
      )}
    </section>
  )
}

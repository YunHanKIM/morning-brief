'use client'

import { useState } from 'react'
import type { WidgetResult } from '../widgets/types'
import type { City } from '../widgets/weather/city'
import type { WeatherData } from '../widgets/weather/normalize'
import { loadWeatherAction } from './cityActions'
import { CityPicker } from './CityPicker'
import { saveCityCookie } from './cityCookie'

export function WeatherCard({
  result: initialResult,
  loading = false,
  city: initialCity = null,
  readOnly = false,
}: {
  result?: WidgetResult<WeatherData>
  loading?: boolean
  city?: City | null
  // 저장된 지난 브리핑을 볼 때: 도시를 바꿀 수 없다
  readOnly?: boolean
}) {
  const [city, setCity] = useState(initialCity)
  const [result, setResult] = useState(initialResult)
  const [choosing, setChoosing] = useState(initialCity === null && !loading && !readOnly)
  const [pending, setPending] = useState(false)

  function select(next: City) {
    setPending(true)
    setCity(next)
    saveCityCookie(next)
    loadWeatherAction(next)
      .catch((): WidgetResult<WeatherData> => ({
        status: 'error',
        message: '서버와 통신하지 못했습니다',
      }))
      .then((nextResult) => {
        setResult(nextResult)
        setPending(false)
        setChoosing(false)
      })
  }

  const busy = loading || pending
  const place = city && [city.name, city.region].filter(Boolean).join(' · ')

  return (
    <section
      aria-labelledby="weather-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="weather-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        날씨
      </h2>
      {place && <p className="mt-1 text-sm">{place}</p>}
      {busy && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!busy && !city && !readOnly && <p className="mt-2 text-zinc-500">도시를 선택하세요</p>}
      {!busy && (city || readOnly) && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          날씨 정보가 없습니다
        </p>
      )}
      {!busy && result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          날씨를 가져오지 못했습니다: {result.message}
        </p>
      )}
      {!busy && result?.status === 'ok' && (
        <div className="mt-2">
          <p className="text-4xl font-semibold">{result.data.temperature}°</p>
          <p>{result.data.condition}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {`최고 ${result.data.high}° / 최저 ${result.data.low}°`}
          </p>
        </div>
      )}
      {city && !loading && !readOnly && (
        <button
          type="button"
          disabled={pending}
          aria-expanded={choosing}
          aria-controls="city-picker"
          onClick={() => setChoosing((open) => !open)}
          className="mt-3 text-sm underline disabled:opacity-50"
        >
          {choosing ? '닫기' : '도시 바꾸기'}
        </button>
      )}
      {choosing && (
        <div id="city-picker">
          <CityPicker onSelect={select} disabled={pending} />
        </div>
      )}
    </section>
  )
}

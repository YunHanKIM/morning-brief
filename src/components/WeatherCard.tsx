'use client'

import { useState } from 'react'
import type { WidgetResult } from '../widgets/types'
import type { City } from '../widgets/weather/city'
import type { WeatherData } from '../widgets/weather/normalize'
import { loadWeatherAction } from './cityActions'
import { CityPicker } from './CityPicker'
import { saveCityCookie } from './cityCookie'
import { errorText, link, note, section, sectionTitle, status } from './styles'

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
    <section aria-labelledby="weather-title" className={section}>
      <h2 id="weather-title" className={sectionTitle}>
        날씨
      </h2>
      {place && <p className="mt-1 text-sm text-muted">{place}</p>}
      {busy && (
        <p role="status" className={status}>
          불러오는 중…
        </p>
      )}
      {!busy && !city && !readOnly && <p className={status}>도시를 선택하세요</p>}
      {!busy && (city || readOnly) && !result && (
        <p role="status" className={status}>
          날씨 정보가 없습니다
        </p>
      )}
      {!busy && result?.status === 'error' && (
        <p role="alert" className={errorText}>
          날씨를 가져오지 못했습니다: {result.message}
        </p>
      )}
      {!busy && result?.status === 'ok' && (
        <div className="mt-3">
          <p className="font-serif text-6xl font-bold tabular-nums leading-none">{result.data.temperature}°</p>
          <p className="mt-2">{result.data.condition}</p>
          <p className="text-sm text-muted tabular-nums">
            {`최고 ${result.data.high}° / 최저 ${result.data.low}°`}
          </p>
        </div>
      )}
      <p className={`mt-3 ${note}`}>
        출처:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className={link}>
          Open-Meteo
        </a>{' '}
        (CC BY 4.0)
      </p>
      {city && !loading && !readOnly && (
        <button
          type="button"
          disabled={pending}
          aria-expanded={choosing}
          aria-controls="city-picker"
          onClick={() => setChoosing((open) => !open)}
          className={`mt-4 ${link} text-sm disabled:opacity-50`}
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

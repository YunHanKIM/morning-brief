'use client'

import { useRef, useState, type FormEvent } from 'react'
import { POPULAR_CITIES, type City } from '../widgets/weather/city'
import { searchCitiesAction } from './cityActions'
import { button, field, note } from './styles'

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'done'; cities: City[] }
  | { kind: 'error'; message: string }

const label = (city: City) => {
  const place = [city.region, city.country].filter(Boolean).join(', ')
  return place ? `${city.name} · ${place}` : city.name
}

export function CityPicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (city: City) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>({ kind: 'idle' })
  const latest = useRef(0)

  function search(event: FormEvent) {
    event.preventDefault()
    const text = query.trim()
    if (!text) return
    const id = ++latest.current
    setState({ kind: 'searching' })
    searchCitiesAction(text)
      .catch((): { status: 'error'; message: string } => ({
        status: 'error',
        message: '서버와 통신하지 못했습니다',
      }))
      .then((result) => {
        // 그 사이 다시 검색했다면 이 응답은 버린다
        if (id !== latest.current) return
        setState(
          result.status === 'ok'
            ? { kind: 'done', cities: result.cities }
            : { kind: 'error', message: result.message },
        )
      })
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div role="group" aria-label="자주 쓰는 도시" className="flex flex-wrap gap-2">
        {POPULAR_CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(city)}
            className={button}
          >
            {city.name}
          </button>
        ))}
      </div>
      <form onSubmit={search} className="flex flex-wrap items-center gap-2">
        <label htmlFor="city-search" className="text-sm text-muted">
          도시 검색
        </label>
        <input
          id="city-search"
          type="search"
          maxLength={50}
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          className={field}
        />
        <button type="submit" disabled={disabled} className={button}>
          검색
        </button>
      </form>
      <p className={note}>한국 도시는 위 버튼이 가장 정확합니다. 그 밖의 도시는 영문 이름으로 검색하세요.</p>
      {state.kind === 'searching' && (
        <p role="status" className="text-sm text-muted">
          검색 중…
        </p>
      )}
      {state.kind === 'done' && state.cities.length === 0 && (
        <p role="status" className="text-sm text-muted">
          검색 결과가 없습니다
        </p>
      )}
      {state.kind === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {`검색하지 못했습니다: ${state.message}`}
        </p>
      )}
      {state.kind === 'done' && state.cities.length > 0 && (
        <ul aria-label="검색 결과" className="flex flex-col divide-y divide-rule border-y border-rule">
          {state.cities.map((city) => (
            <li key={`${city.latitude},${city.longitude}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(city)}
                className="w-full px-1 py-2 text-left text-sm hover:text-accent disabled:opacity-50"
              >
                {label(city)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

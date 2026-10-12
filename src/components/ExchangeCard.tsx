'use client'

import { useRef, useState } from 'react'
import { CURRENCIES, CURRENCY_NAMES, type Currency } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import type { WidgetResult } from '../widgets/types'
import { loadExchange } from './exchangeAction'

export function ExchangeCard({
  result: initialResult,
  loading = false,
  selected: initialSelected,
}: {
  result?: WidgetResult<ExchangeData>
  loading?: boolean
  selected: Currency
}) {
  const [result, setResult] = useState(initialResult)
  const [selected, setSelected] = useState(initialSelected)
  const [pending, setPending] = useState(false)
  const latest = useRef(initialSelected)

  function choose(code: Currency) {
    latest.current = code
    setSelected(code)
    setPending(true)
    window.history.replaceState(null, '', `?to=${code}`)
    loadExchange(code)
      .catch((): WidgetResult<ExchangeData> => ({
        status: 'error',
        message: '서버와 통신하지 못했습니다',
      }))
      .then((next) => {
        // 그 사이 다른 통화를 골랐다면 이 응답은 버린다. 최신 요청이 끝나면 먼저 보낸 요청을 기다리지 않는다
        if (latest.current !== code) return
        setResult(next)
        setPending(false)
      })
  }

  const busy = loading || pending

  return (
    <section
      aria-labelledby="exchange-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="exchange-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        환율
      </h2>
      {busy && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!busy && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          환율 정보가 없습니다
        </p>
      )}
      {!busy && result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          {`환율을 가져오지 못했습니다: ${result.message}`}
        </p>
      )}
      {!busy && result?.status === 'ok' && (
        <div className="mt-2">
          <p className="text-3xl font-semibold">
            {`1 ${result.data.base} = ${result.data.rate} ${result.data.quote}`}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {`기준 일자 ${result.data.date} (마지막 영업일)`}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="exchange-to" className="text-sm text-zinc-500 dark:text-zinc-400">
          받는 통화
        </label>
        <select
          id="exchange-to"
          value={selected}
          disabled={loading}
          onChange={(event) => choose(event.target.value as Currency)}
          className="rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {`${code} · ${CURRENCY_NAMES[code]}`}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}

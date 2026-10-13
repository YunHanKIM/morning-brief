'use client'

import { useState } from 'react'
import { CURRENCIES, CURRENCY_NAMES, type Currency } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import type { WidgetResult } from '../widgets/types'

export function ExchangeCard({
  result,
  loading = false,
  selected: initialSelected,
}: {
  result?: WidgetResult<ExchangeData>
  loading?: boolean
  selected: Currency
}) {
  const [selected, setSelected] = useState(initialSelected)

  // 모든 통화의 환율을 이미 받아 두었으므로 서버에 다시 묻지 않고 화면에서 고른다
  function choose(code: Currency) {
    setSelected(code)
    // 주소의 다른 쿼리(예: ?date=)는 그대로 두고 to만 바꾼다
    const url = new URL(window.location.href)
    url.searchParams.set('to', code)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <section
      aria-labelledby="exchange-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="exchange-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        환율
      </h2>
      {loading && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          환율 정보가 없습니다
        </p>
      )}
      {result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          환율을 가져오지 못했습니다: {result.message}
        </p>
      )}
      {result?.status === 'ok' && (
        <div className="mt-2">
          <p className="text-3xl font-semibold">
            {`1 ${result.data.base} = ${result.data.rates[selected]} ${selected}`}
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

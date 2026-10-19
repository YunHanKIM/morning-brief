'use client'

import { useState } from 'react'
import { CURRENCIES, CURRENCY_NAMES, type Currency } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import type { WidgetResult } from '../widgets/types'
import { errorText, field, section, sectionTitle, status } from './styles'

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
    <section aria-labelledby="exchange-title" className={section}>
      <h2 id="exchange-title" className={sectionTitle}>
        환율
      </h2>
      {loading && (
        <p role="status" className={status}>
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className={status}>
          환율 정보가 없습니다
        </p>
      )}
      {result?.status === 'error' && (
        <p role="alert" className={errorText}>
          환율을 가져오지 못했습니다: {result.message}
        </p>
      )}
      {result?.status === 'ok' && (
        <div className="mt-3">
          <p className="font-serif text-3xl font-bold tabular-nums">
            {`1 ${result.data.base} = ${result.data.rates[selected]} ${selected}`}
          </p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {`기준 일자 ${result.data.date} (마지막 영업일)`}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="exchange-to" className="text-sm text-muted">
          받는 통화
        </label>
        <select
          id="exchange-to"
          value={selected}
          disabled={loading}
          onChange={(event) => choose(event.target.value as Currency)}
          className={`${field} bg-paper`}
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

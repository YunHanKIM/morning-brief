import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { CITY_COOKIE, readCity } from '../components/cityCookie'
import { Dashboard } from '../components/Dashboard'
import { HistoryCard } from '../components/HistoryCard'
import { loadPageData, pageKey } from '../components/loadPageData'
import { PageShell } from '../components/PageShell'
import { SnapshotBanner } from '../components/SnapshotBanner'
import { parseCurrency } from '../widgets/exchange/currencies'
import { openStore } from '../storage/respond'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// searchParams·쿠키·fetch는 요청 때 실행된다. 기다리는 동안은 로딩 상태 대시보드를 먼저 보낸다
async function LiveDashboard({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const city = readCity((await cookies()).get(CITY_COOKIE)?.value)
  const data = await loadPageData({ date: params.date, city, store: openStore() })
  const currency = parseCurrency(params.to)
  const key = pageKey(data)

  if (data.mode === 'missing') {
    return (
      <PageShell key={key}>
        <SnapshotBanner state={data.reason} date={data.date} />
        <HistoryCard history={data.history} />
      </PageShell>
    )
  }

  if (data.mode === 'snapshot') {
    return (
      <Dashboard
        key={key}
        results={data.results}
        city={data.city}
        currency={currency}
        readOnly
        banner={<SnapshotBanner state="viewing" date={data.date} />}
      >
        <HistoryCard history={data.history} current={data.date} />
      </Dashboard>
    )
  }

  return (
    <Dashboard key={key} results={data.results} city={data.city} currency={currency}>
      <HistoryCard history={data.history} />
    </Dashboard>
  )
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Dashboard results={{}} loading />}>
      <LiveDashboard searchParams={searchParams} />
    </Suspense>
  )
}

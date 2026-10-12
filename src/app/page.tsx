import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { CITY_COOKIE, readCity } from '../components/cityCookie'
import { Dashboard } from '../components/Dashboard'
import { loadDashboardResults } from '../components/loadDashboardResults'
import { parseCurrency } from '../widgets/exchange/currencies'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// searchParams·쿠키·fetch는 요청 때 실행된다. 기다리는 동안은 로딩 상태 대시보드를 먼저 보낸다
async function LiveDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { to } = await searchParams
  const city = readCity((await cookies()).get(CITY_COOKIE)?.value)
  const results = await loadDashboardResults(city)
  return <Dashboard results={results} currency={parseCurrency(to)} city={city} />
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Dashboard results={{}} loading />}>
      <LiveDashboard searchParams={searchParams} />
    </Suspense>
  )
}

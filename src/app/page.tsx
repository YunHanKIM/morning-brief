import { Suspense } from 'react'
import { Dashboard } from '../components/Dashboard'
import { loadDashboardResults } from '../components/loadDashboardResults'
import { parseCurrency } from '../widgets/exchange/currencies'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// searchParams와 fetch는 요청 때 실행된다. 기다리는 동안은 로딩 상태 대시보드를 먼저 보낸다
async function LiveDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { to } = await searchParams
  const results = await loadDashboardResults()
  return <Dashboard results={results} currency={parseCurrency(to)} />
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Dashboard results={{}} loading />}>
      <LiveDashboard searchParams={searchParams} />
    </Suspense>
  )
}

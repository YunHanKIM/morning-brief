import { Suspense } from 'react'
import { Dashboard } from '../components/Dashboard'
import { toDashboardResults } from '../components/toDashboardResults'
import { runWidgets } from '../widgets/runWidgets'
import { weatherWidget } from '../widgets/weather'

// fetch는 기본이 비캐시라 요청 때 실행된다. 기다리는 동안은 로딩 상태 대시보드를 먼저 보낸다
async function LiveDashboard() {
  const results = await runWidgets([weatherWidget])
  return <Dashboard results={toDashboardResults(results)} />
}

export default function Home() {
  return (
    <Suspense fallback={<Dashboard results={{}} loading />}>
      <LiveDashboard />
    </Suspense>
  )
}

import type { SnapshotStore } from '../storage/snapshotStore'
import { isValidDate } from '../storage/snapshotStore'
import type { City } from '../widgets/weather/city'
import { loadDashboardResults } from './loadDashboardResults'
import type { DashboardResults } from './toDashboardResults'

const HISTORY_LIMIT = 14

// unavailable: 저장소가 없는 환경 / error: 읽다가 실패
export type HistoryState =
  | { status: 'ok'; dates: string[] }
  | { status: 'error' }
  | { status: 'unavailable' }

export type PageData =
  | { mode: 'live'; results: DashboardResults; city: City | null; history: HistoryState }
  | { mode: 'snapshot'; date: string; results: DashboardResults; city: City | null; history: HistoryState }
  | {
      mode: 'missing'
      date?: string
      reason: 'invalid' | 'not-found' | 'unavailable'
      history: HistoryState
    }

async function loadHistory(store: SnapshotStore | null): Promise<HistoryState> {
  if (!store) return { status: 'unavailable' }
  try {
    return { status: 'ok', dates: await store.listDates(HISTORY_LIMIT) }
  } catch {
    return { status: 'error' }
  }
}

// 화면 하나에 필요한 데이터를 모은다. 어떤 경우에도 던지지 않는다.
// date가 없으면 오늘의 실시간(live), 있으면 그날 저장된 브리핑(snapshot)이며 보여줄 수 없으면 이유와 함께 missing.
// date는 주소에서 온 믿을 수 없는 값이라 저장소에 닿기 전에 검증한다
export async function loadPageData({
  date,
  city,
  store,
}: {
  date: unknown
  city: City | null
  store: SnapshotStore | null
}): Promise<PageData> {
  if (date === undefined) {
    const [results, history] = await Promise.all([loadDashboardResults(city), loadHistory(store)])
    return { mode: 'live', results, city, history }
  }

  if (!isValidDate(date)) {
    return { mode: 'missing', reason: 'invalid', history: await loadHistory(store) }
  }

  if (!store) {
    return { mode: 'missing', date, reason: 'unavailable', history: { status: 'unavailable' } }
  }

  const [brief, history] = await Promise.all([
    store.get(date).then(
      (found) => ({ ok: true as const, found }),
      () => ({ ok: false as const }),
    ),
    loadHistory(store),
  ])
  if (!brief.ok) return { mode: 'missing', date, reason: 'unavailable', history }
  if (!brief.found) return { mode: 'missing', date, reason: 'not-found', history }
  return { mode: 'snapshot', date, results: brief.found.results, city: brief.found.city, history }
}

// 화면이 바뀔 때 카드(클라이언트 컴포넌트)를 새로 만들게 하는 key.
// Link로 이동하면 같은 자리의 카드가 재사용되어 이전 날짜의 도시·날씨 상태가 남기 때문이다
export function pageKey(data: PageData): string {
  switch (data.mode) {
    case 'live':
      return 'live'
    case 'snapshot':
      return `snapshot:${data.date}`
    case 'missing':
      return `missing:${data.reason}`
  }
}

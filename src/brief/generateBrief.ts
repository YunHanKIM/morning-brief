import { loadDashboardResults } from '../components/loadDashboardResults'
import type { DashboardResults } from '../components/toDashboardResults'
import type { City } from '../widgets/weather/city'
import { resolveBriefCity } from './briefCity'
import { kstDate } from './kstDate'

type WidgetName = keyof DashboardResults

export interface Brief {
  date: string
  city: City | null
  // 위젯별 상태 요약. 저장·전송 단계가 이 요약을 쓴다
  widgets: Record<WidgetName, 'ok' | 'error'>
  results: DashboardResults
}

const WIDGET_NAMES: WidgetName[] = ['weather', 'exchange', 'news', 'quote']

export async function generateBrief({
  cityValue,
  now,
}: {
  cityValue: string | undefined
  now: Date
}): Promise<Brief> {
  const city = resolveBriefCity(cityValue)
  const results = await loadDashboardResults(city)
  // 잘못된 BRIEF_CITY는 날씨만 설정 오류로 표시한다 (다른 도시로 몰래 바꾸지 않는다)
  if (!city) {
    results.weather = { status: 'error', message: 'BRIEF_CITY 설정이 올바르지 않습니다' }
  }

  const widgets = Object.fromEntries(
    WIDGET_NAMES.map((name) => [name, results[name]?.status === 'ok' ? 'ok' : 'error']),
  ) as Brief['widgets']

  return { date: kstDate(now), city, widgets, results }
}

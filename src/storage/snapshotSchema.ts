import { z } from 'zod'
import { summarizeWidgets, type Brief } from '../brief/generateBrief'
import { toDashboardResults } from '../components/toDashboardResults'
import type { WidgetResult } from '../widgets/types'
import { parseCity } from '../widgets/weather/city'

const resultSchema = z.union([
  z.object({ status: z.literal('ok'), data: z.unknown() }),
  z.object({ status: z.literal('error'), message: z.string() }),
])

const snapshotSchema = z.object({
  date: z.iso.date(),
  city: z.unknown(),
  results: z.record(z.string(), resultSchema),
})

// 저장소에서 읽은 값은 믿지 않는다. 모양이 틀리면 null.
// 위젯 데이터는 화면에 쓰는 것과 같은 검증(toDashboardResults)을 다시 거치고,
// 상태 요약(widgets)은 저장된 값 대신 검증된 결과에서 새로 계산한다
export function parseSnapshot(value: unknown): Brief | null {
  const parsed = snapshotSchema.safeParse(value)
  if (!parsed.success) return null

  const { date, city: rawCity, results: rawResults } = parsed.data
  const city = rawCity === null ? null : parseCity(rawCity)
  if (rawCity !== null && city === null) return null

  const results = toDashboardResults(rawResults as Record<string, WidgetResult<unknown>>)
  return { date, city, widgets: summarizeWidgets(results), results }
}

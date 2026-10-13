import { kstDate } from '../../../brief/kstDate'
import { jsonError, jsonOk, openStore } from '../../../storage/respond'
import { isValidDate } from '../../../storage/snapshotStore'

// 공개 읽기 전용: 오늘(한국 시간) 또는 ?date=YYYY-MM-DD의 브리핑
export async function GET(request: Request): Promise<Response> {
  const requested = new URL(request.url).searchParams.get('date')
  const date = requested ?? kstDate(new Date())
  if (!isValidDate(date)) return jsonError('invalid date', 400)

  const store = openStore()
  if (!store) return jsonError('storage not configured', 503)

  try {
    const brief = await store.get(date)
    return brief ? jsonOk(brief) : jsonError('not found', 404)
  } catch {
    return jsonError('storage error', 502)
  }
}

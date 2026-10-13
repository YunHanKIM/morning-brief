import { jsonError, jsonOk, openStore } from '../../../../storage/respond'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 90

// 공개 읽기 전용: 최근 브리핑 날짜 목록(최신순). ?limit=1~90 (기본 30)
export async function GET(request: Request): Promise<Response> {
  const requested = new URL(request.url).searchParams.get('limit')
  let limit = DEFAULT_LIMIT
  if (requested !== null) {
    limit = /^[1-9]\d*$/.test(requested) ? Number(requested) : 0
    if (limit < 1 || limit > MAX_LIMIT) return jsonError('invalid limit', 400)
  }

  const store = openStore()
  if (!store) return jsonError('storage not configured', 503)

  try {
    return jsonOk({ dates: await store.listDates(limit) })
  } catch {
    return jsonError('storage error', 502)
  }
}

import { assertDate, assertLimit, isValidDate, type SnapshotStore } from './snapshotStore'
import { parseSnapshot } from './snapshotSchema'

const TIMEOUT_MS = 5000
const HISTORY_KEY = 'briefs'
const snapshotKey = (date: string) => `brief:${date}`

// Upstash Redis REST API: POST에 [명령, 인자...] JSON 배열을 보내고 Authorization: Bearer 토큰을 쓴다.
// 오류 메시지에는 토큰·주소·응답 본문을 담지 않는다
export function createUpstashStore({ url, token }: { url: string; token: string }): SnapshotStore {
  let valid = /^\S+$/.test(token)
  try {
    valid = valid && new URL(url).protocol === 'https:'
  } catch {
    valid = false
  }
  if (!valid) throw new Error('Upstash 설정이 올바르지 않습니다')

  async function command(args: string[]): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new Error(`Upstash 응답 오류: ${response.status}`)
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      // 기본 JSON 오류 메시지에는 응답 본문 일부가 들어가므로 그대로 올리지 않는다
      throw new Error('Upstash 응답 형식이 올바르지 않습니다')
    }
    if (typeof body !== 'object' || body === null || 'error' in body || !('result' in body)) {
      throw new Error('Upstash 응답 형식이 올바르지 않습니다')
    }
    return body.result
  }

  return {
    async save(brief) {
      assertDate(brief.date)
      await command(['SET', snapshotKey(brief.date), JSON.stringify(brief)])
      // 저장이 성공한 뒤에만 이력에 더한다. 다시 저장해도 같은 결과(멱등)라 실패 시 재시도하면 된다
      await command(['ZADD', HISTORY_KEY, brief.date.replaceAll('-', ''), brief.date])
    },

    async get(date) {
      assertDate(date)
      const result = await command(['GET', snapshotKey(date)])
      if (result === null) return null
      if (typeof result !== 'string') throw new Error('저장된 브리핑을 읽을 수 없습니다')

      let value: unknown
      try {
        value = JSON.parse(result)
      } catch {
        throw new Error('저장된 브리핑을 읽을 수 없습니다')
      }
      const brief = parseSnapshot(value)
      if (!brief) throw new Error('저장된 브리핑을 읽을 수 없습니다')
      return brief
    },

    async listDates(limit) {
      assertLimit(limit)
      const result = await command(['ZRANGE', HISTORY_KEY, '0', String(limit - 1), 'REV'])
      if (!Array.isArray(result)) throw new Error('Upstash 응답 형식이 올바르지 않습니다')
      return result.filter(isValidDate)
    },
  }
}

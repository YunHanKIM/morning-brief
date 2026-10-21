import { assertDate, assertLimit, type SnapshotStore } from './snapshotStore'
import { parseCity, type City } from '../widgets/weather/city'
import { parseSnapshot } from './snapshotSchema'

export type MemoryStore = SnapshotStore & { clear(): void }

// 개발·테스트용. 서버가 다시 시작하면 사라진다. JSON 문자열로 보관해 꺼낸 값을 바꿔도 원본이 안 바뀐다
export function createMemoryStore(): MemoryStore {
  const snapshots = new Map<string, string>()
  let city: string | null = null

  return {
    async save(brief) {
      assertDate(brief.date)
      snapshots.set(brief.date, JSON.stringify(brief))
    },

    async get(date) {
      assertDate(date)
      const raw = snapshots.get(date)
      if (raw === undefined) return null
      const brief = parseSnapshot(JSON.parse(raw))
      if (!brief) throw new Error('저장된 브리핑을 읽을 수 없습니다')
      return brief
    },

    async listDates(limit) {
      assertLimit(limit)
      return [...snapshots.keys()].sort().reverse().slice(0, limit)
    },

    async saveCity(next: City) {
      city = JSON.stringify(next)
    },

    async getCity() {
      return city === null ? null : parseCity(JSON.parse(city))
    },

    clear() {
      snapshots.clear()
      city = null
    },
  }
}

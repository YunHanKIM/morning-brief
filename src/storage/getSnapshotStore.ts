import { createMemoryStore, type MemoryStore } from './memoryStore'
import type { SnapshotStore } from './snapshotStore'
import { createUpstashStore } from './upstashStore'

// SNAPSHOT_STORE=memory로 명시했을 때만 쓰는 개발용 저장소(서버를 다시 켜면 사라진다).
// Next는 경로(API·페이지)마다 모듈을 따로 번들해서 모듈 변수만으로는 서로 다른 저장소가 생긴다.
// 그러면 API가 저장한 브리핑을 화면이 못 보므로 프로세스 전역(globalThis)에 하나만 둔다
const globalForStore = globalThis as typeof globalThis & { __morningBriefMemoryStore?: MemoryStore }
export const sharedMemoryStore = (globalForStore.__morningBriefMemoryStore ??= createMemoryStore())

const clean = (value: string | undefined) => value?.trim() || undefined

// 설정이 없으면 null — 조용히 메모리에 저장해 데이터를 잃는 일이 없도록 호출하는 쪽이 503으로 알린다.
// 이름은 Upstash 기본(UPSTASH_REDIS_REST_*)과 Vercel 연동이 넣어 주는 이름(KV_REST_API_*)을 둘 다 받는다
export function getSnapshotStore(env: NodeJS.ProcessEnv = process.env): SnapshotStore | null {
  if (env.SNAPSHOT_STORE === 'memory') return sharedMemoryStore

  const pairs = [
    [clean(env.UPSTASH_REDIS_REST_URL), clean(env.UPSTASH_REDIS_REST_TOKEN)],
    [clean(env.KV_REST_API_URL), clean(env.KV_REST_API_TOKEN)],
  ]
  for (const [url, token] of pairs) {
    if (url && token) return createUpstashStore({ url, token })
  }
  return null
}

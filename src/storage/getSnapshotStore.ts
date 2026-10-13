import { createMemoryStore } from './memoryStore'
import type { SnapshotStore } from './snapshotStore'
import { createUpstashStore } from './upstashStore'

// SNAPSHOT_STORE=memory로 명시했을 때만 쓰는 개발용 저장소(서버를 다시 켜면 사라진다)
export const sharedMemoryStore = createMemoryStore()

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

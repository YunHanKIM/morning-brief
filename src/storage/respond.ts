import { getSnapshotStore } from './getSnapshotStore'
import type { SnapshotStore } from './snapshotStore'

const NO_STORE = { 'Cache-Control': 'no-store' }

export const jsonOk = (body: unknown) => Response.json(body, { headers: NO_STORE })

export const jsonError = (error: string, status: number) =>
  Response.json({ error }, { status, headers: NO_STORE })

// 설정이 없거나 설정 값이 잘못됐으면 null (둘 다 "저장소가 준비되지 않음")
export function openStore(): SnapshotStore | null {
  try {
    return getSnapshotStore()
  } catch {
    return null
  }
}

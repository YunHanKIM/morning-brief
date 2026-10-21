import { sendBriefToTelegram } from '../notify/sendBrief'
import type { SnapshotStore } from '../storage/snapshotStore'
import { generateBrief, type Brief } from './generateBrief'

export interface BriefRunResult {
  date: string
  widgets: Brief['widgets']
  snapshot: 'saved' | 'failed'
  telegram: 'sent' | 'failed'
}

async function saveSnapshot(brief: Brief, store: SnapshotStore | null): Promise<'saved' | 'failed'> {
  if (!store) {
    console.error('[brief] 저장 실패: 저장소가 설정되지 않았습니다')
    return 'failed'
  }
  try {
    await store.save(brief)
    return 'saved'
  } catch (error) {
    // 저장소 오류 메시지는 토큰·주소를 담지 않도록 만들어져 있어 로그에 남겨도 안전하다
    console.error('[brief] 저장 실패:', error instanceof Error ? error.message : String(error))
    return 'failed'
  }
}

// 대시보드에서 고른 도시(저장소)가 BRIEF_CITY보다 우선한다. 읽지 못하면 BRIEF_CITY로 계속 보낸다
async function pickCityValue(store: SnapshotStore | null, fallback: string | undefined): Promise<string | undefined> {
  if (!store) return fallback
  try {
    const city = await store.getCity()
    return city ? JSON.stringify(city) : fallback
  } catch (error) {
    console.error('[brief] 도시 읽기 실패:', error instanceof Error ? error.message : String(error))
    return fallback
  }
}

// 브리핑을 만들고(① 저장 ② 전송) 상태만 돌려준다.
// 저장과 전송은 서로 막지 않는다: 저장이 실패해도 아침 메시지는 보내고, 전송이 실패해도 저장은 유지된다.
// 위젯 데이터와 실패 이유는 응답이 아니라 서버 로그에만 남긴다(공개될 수 있는 Actions 로그 보호)
export async function runBrief({
  cityValue,
  now,
  store,
  env,
}: {
  cityValue: string | undefined
  now: Date
  store: SnapshotStore | null
  env: Record<string, string | undefined>
}): Promise<BriefRunResult> {
  const brief = await generateBrief({ cityValue: await pickCityValue(store, cityValue), now })
  // 서로 독립이라 동시에 시작한다 (순서대로 기다리면 최악의 대기 시간이 합쳐져 서버리스 제한에 걸린다).
  // 둘 다 던지지 않으므로 Promise.all이 한쪽 실패로 다른 쪽을 버리지 않는다
  const [snapshot, sent] = await Promise.all([
    saveSnapshot(brief, store),
    sendBriefToTelegram(brief, env),
  ])
  if (sent.status === 'failed') console.error(`[brief] Telegram 전송 실패: ${sent.reason}`)

  return { date: brief.date, widgets: brief.widgets, snapshot, telegram: sent.status }
}

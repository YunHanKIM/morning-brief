import Link from 'next/link'

export type SnapshotBannerState = 'viewing' | 'not-found' | 'invalid' | 'unavailable'

// 저장된 지난 브리핑을 보고 있거나, 보여줄 수 없을 때 위쪽에 알리는 안내.
// date는 검증을 통과한 날짜만 받는다. 잘못된 요청 값은 화면에 되풀이하지 않는다
export function SnapshotBanner({ state, date }: { state: SnapshotBannerState; date?: string }) {
  const message = {
    viewing: `${date}에 저장된 브리핑입니다 (읽기 전용)`,
    'not-found': `${date}에 저장된 브리핑이 없습니다`,
    invalid: '올바르지 않은 날짜입니다',
    unavailable: '저장소를 사용할 수 없어 브리핑을 불러오지 못했습니다',
  }[state]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
      <p role={state === 'viewing' ? 'status' : 'alert'}>{message}</p>
      <Link href="/" prefetch={false} className="underline underline-offset-2">
        오늘 브리핑으로
      </Link>
    </div>
  )
}

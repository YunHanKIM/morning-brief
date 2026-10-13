import type { HistoryState } from './loadPageData'

// 저장된 지난 브리핑 날짜 목록. 날짜는 저장소가 실제 존재하는 YYYY-MM-DD만 돌려주므로 링크에 그대로 써도 안전하다
export function HistoryCard({ history, current }: { history: HistoryState; current?: string }) {
  // 저장소를 쓸 수 없는 환경(개발 등)에서는 카드 자체를 그리지 않는다
  if (history.status === 'unavailable') return null

  return (
    <section
      aria-labelledby="history-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="history-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        지난 브리핑
      </h2>
      {history.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          지난 브리핑을 불러오지 못했습니다
        </p>
      )}
      {history.status === 'ok' && history.dates.length === 0 && (
        <p role="status" className="mt-2 text-zinc-500">
          저장된 브리핑이 없습니다
        </p>
      )}
      {history.status === 'ok' && history.dates.length > 0 && (
        <ul aria-label="지난 브리핑 목록" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {history.dates.map((date) => (
            <li key={date}>
              <a
                href={`/?date=${date}`}
                aria-current={date === current ? 'page' : undefined}
                className="underline-offset-2 hover:underline aria-[current=page]:font-semibold"
              >
                {date}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

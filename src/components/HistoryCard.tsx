import type { HistoryState } from './loadPageData'
import { errorText, link, section, sectionTitle, status } from './styles'

// 저장된 지난 브리핑 날짜 목록. 날짜는 저장소가 실제 존재하는 YYYY-MM-DD만 돌려주므로 링크에 그대로 써도 안전하다
export function HistoryCard({ history, current }: { history: HistoryState; current?: string }) {
  // 저장소를 쓸 수 없는 환경(개발 등)에서는 카드 자체를 그리지 않는다
  if (history.status === 'unavailable') return null

  return (
    <section aria-labelledby="history-title" className={section}>
      <h2 id="history-title" className={sectionTitle}>
        지난 브리핑
      </h2>
      {history.status === 'error' && (
        <p role="alert" className={errorText}>
          지난 브리핑을 불러오지 못했습니다
        </p>
      )}
      {history.status === 'ok' && history.dates.length === 0 && (
        <p role="status" className={status}>
          저장된 브리핑이 없습니다
        </p>
      )}
      {history.status === 'ok' && history.dates.length > 0 && (
        <ul aria-label="지난 브리핑 목록" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
          {history.dates.map((date) => (
            <li key={date}>
              <a
                href={`/?date=${date}`}
                aria-current={date === current ? 'page' : undefined}
                className={`${link} aria-[current=page]:font-bold aria-[current=page]:text-accent`}
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

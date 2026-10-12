import type { NewsData } from '../widgets/news/normalize'
import type { WidgetResult } from '../widgets/types'

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const

// 외부에서 온 제목은 React가 텍스트로만 그린다 (HTML로 해석하지 않는다)
export function NewsCard({
  result,
  loading = false,
}: {
  result?: WidgetResult<NewsData>
  loading?: boolean
}) {
  return (
    <section
      aria-labelledby="news-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="news-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        개발 뉴스
      </h2>
      {loading && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          뉴스 정보가 없습니다
        </p>
      )}
      {!loading && result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          뉴스를 가져오지 못했습니다: {result.message}
        </p>
      )}
      {!loading && result?.status === 'ok' && result.data.items.length === 0 && (
        <p role="status" className="mt-2 text-zinc-500">
          표시할 뉴스가 없습니다
        </p>
      )}
      {!loading && result?.status === 'ok' && result.data.items.length > 0 && (
        <ol aria-label="개발 뉴스 목록" className="mt-2 flex flex-col gap-3">
          {result.data.items.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5">
              <a href={item.url} {...linkProps} className="font-medium underline-offset-2 hover:underline">
                {item.title}
              </a>
              <span className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{`${item.score}점`}</span>
                <a
                  href={item.discussionUrl}
                  {...linkProps}
                  aria-label={`${item.title} 토론`}
                  className="underline-offset-2 hover:underline"
                >
                  토론
                </a>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">출처: Hacker News</p>
    </section>
  )
}

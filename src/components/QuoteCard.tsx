import type { QuoteData } from '../widgets/quote/normalize'
import type { WidgetResult } from '../widgets/types'

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const

// 명언·번역은 외부에서 온 문자열이라 React가 텍스트로만 그린다 (HTML로 해석하지 않는다)
export function QuoteCard({
  result,
  loading = false,
}: {
  result?: WidgetResult<QuoteData>
  loading?: boolean
}) {
  return (
    <section
      aria-labelledby="quote-title"
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="quote-title" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        오늘의 한마디
      </h2>
      {loading && (
        <p role="status" className="mt-2 text-zinc-500">
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className="mt-2 text-zinc-500">
          명언 정보가 없습니다
        </p>
      )}
      {!loading && result?.status === 'error' && (
        <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
          명언을 가져오지 못했습니다: {result.message}
        </p>
      )}
      {!loading && result?.status === 'ok' && (
        <>
          <blockquote lang="en" className="mt-2">
            <p lang="en" className="text-lg font-medium">
              {result.data.quote}
            </p>
            <footer className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              <cite>{`— ${result.data.author}`}</cite>
            </footer>
          </blockquote>
          {result.data.translation ? (
            <div className="mt-3">
              <p lang="ko">{result.data.translation}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">자동 번역</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              번역을 불러오지 못해 영어 원문만 보여드립니다
            </p>
          )}
        </>
      )}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        출처:{' '}
        <a href="https://zenquotes.io/" {...linkProps} className="underline">
          ZenQuotes
        </a>
        {!loading && result?.status === 'ok' && result.data.translation && (
          <>
            {' · 번역: '}
            <a href="https://mymemory.translated.net/" {...linkProps} className="underline">
              MyMemory
            </a>
          </>
        )}
      </p>
    </section>
  )
}

import type { QuoteData } from '../widgets/quote/normalize'
import type { WidgetResult } from '../widgets/types'
import { errorText, link, note, section, sectionTitle, status } from './styles'

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
    <section aria-labelledby="quote-title" className={section}>
      <h2 id="quote-title" className={sectionTitle}>
        오늘의 한마디
      </h2>
      {loading && (
        <p role="status" className={status}>
          불러오는 중…
        </p>
      )}
      {!loading && !result && (
        <p role="status" className={status}>
          명언 정보가 없습니다
        </p>
      )}
      {!loading && result?.status === 'error' && (
        <p role="alert" className={errorText}>
          명언을 가져오지 못했습니다: {result.message}
        </p>
      )}
      {!loading && result?.status === 'ok' && (
        <>
          <blockquote lang="en" className="mt-3 border-l-4 border-accent pl-4">
            <p lang="en" className="font-serif text-xl leading-snug">
              {result.data.quote}
            </p>
            <footer className="mt-1 text-sm text-muted">
              <cite>{`— ${result.data.author}`}</cite>
            </footer>
          </blockquote>
          {result.data.translation ? (
            <div className="mt-3 pl-5">
              <p lang="ko">{result.data.translation}</p>
              <p className={note}>자동 번역</p>
            </div>
          ) : (
            <p className={`mt-3 pl-5 ${note}`}>번역을 불러오지 못해 영어 원문만 보여드립니다</p>
          )}
        </>
      )}
      <p className={`mt-3 ${note}`}>
        출처:{' '}
        <a href="https://zenquotes.io/" {...linkProps} className={link}>
          ZenQuotes
        </a>
        {!loading && result?.status === 'ok' && result.data.translation && (
          <>
            {' · 번역: '}
            <a href="https://mymemory.translated.net/" {...linkProps} className={link}>
              MyMemory
            </a>
          </>
        )}
      </p>
    </section>
  )
}

import type { Brief } from '../brief/generateBrief'

// Telegram 글자 수 제한
const MAX_LENGTH = 4096

type Results = Brief['results']

// 서식(HTML·Markdown)으로 해석되지 않는 평문만 만든다. 뉴스 제목 같은 외부 문자열을 그대로 두어도 안전하다
function weatherSection({ results, city }: Brief): string {
  const result = results.weather
  if (!result) return '[날씨] 정보 없음'
  if (result.status === 'error') return `[날씨] 가져오지 못했습니다: ${result.message}`
  const { temperature, condition, high, low } = result.data
  const place = city ? ` ${[city.name, city.region].filter(Boolean).join(' · ')}` : ''
  return `[날씨]${place}\n${condition} ${temperature}° (최고 ${high}° / 최저 ${low}°)`
}

function exchangeSection(results: Results): string {
  const result = results.exchange
  if (!result) return '[환율] 정보 없음'
  if (result.status === 'error') return `[환율] 가져오지 못했습니다: ${result.message}`
  const { base, date, rates } = result.data
  return `[환율] 1 ${base} = ${rates.KRW} KRW (기준 ${date})`
}

function newsSection(results: Results): string {
  const result = results.news
  if (!result) return '[개발 뉴스] 정보 없음'
  if (result.status === 'error') return `[개발 뉴스] 가져오지 못했습니다: ${result.message}`
  if (result.data.items.length === 0) return '[개발 뉴스] 표시할 뉴스가 없습니다'
  const lines = result.data.items.flatMap((item, index) => [
    `${index + 1}. ${item.title} (${item.score}점)`,
    item.url,
  ])
  return ['[개발 뉴스]', ...lines].join('\n')
}

function quoteSection(results: Results): string {
  const result = results.quote
  if (!result) return '[오늘의 한마디] 정보 없음'
  if (result.status === 'error') return `[오늘의 한마디] 가져오지 못했습니다: ${result.message}`
  const { quote, author, translation } = result.data
  const lines = ['[오늘의 한마디]', `${quote} - ${author}`]
  if (translation) lines.push(`${translation} (자동 번역)`)
  return lines.join('\n')
}

// 제한을 넘으면 줄 단위로 자르고 생략 표시를 붙인다
function fit(text: string): string {
  if (text.length <= MAX_LENGTH) return text
  const head = text.slice(0, MAX_LENGTH - 1)
  const cut = head.lastIndexOf('\n')
  return `${(cut > 0 ? head.slice(0, cut) : head).trimEnd()}…`
}

export function formatBrief(brief: Brief): string {
  const sections = [
    `아침 브리핑 ${brief.date}`,
    weatherSection(brief),
    exchangeSection(brief.results),
    newsSection(brief.results),
    quoteSection(brief.results),
  ]
  return fit(sections.join('\n\n'))
}

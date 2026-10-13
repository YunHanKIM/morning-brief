import { formatBrief } from '../../src/notify/formatBrief'
import type { Brief } from '../../src/brief/generateBrief'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

const rates = { KRW: 1341.49, JPY: 158.25, EUR: 0.89238, CNY: 6.6921, GBP: 0.75641, AUD: 1.4324, CAD: 1.4226, CHF: 0.83107 }

const full = (): Brief => ({
  date: '2026-10-13',
  city: POPULAR_CITIES[1],
  widgets: { weather: 'ok', exchange: 'ok', news: 'ok', quote: 'ok' },
  results: {
    weather: { status: 'ok', data: { temperature: 22.1, condition: '대체로 맑음', high: 24.1, low: 20.5 } },
    exchange: { status: 'ok', data: { base: 'USD', date: '2026-10-09', rates } },
    news: {
      status: 'ok',
      data: {
        items: [
          { id: 1, title: 'Zig 템플릿', score: 134, url: 'https://example.com/zig', discussionUrl: 'https://news.ycombinator.com/item?id=1' },
          { id: 2, title: 'Ask HN: 조언', score: 7, url: 'https://news.ycombinator.com/item?id=2', discussionUrl: 'https://news.ycombinator.com/item?id=2' },
        ],
      },
    },
    quote: { status: 'ok', data: { quote: 'Stay hungry.', author: 'Steve', translation: '계속 갈망하라.' } },
  },
})

describe('formatBrief', () => {
  it('날짜, 날씨, 환율, 뉴스, 한마디를 순서대로 담은 한글 평문을 만든다', () => {
    expect(formatBrief(full())).toBe(
      [
        '아침 브리핑 2026-10-13',
        '',
        '[날씨] 부산 · 부산광역시',
        '대체로 맑음 22.1° (최고 24.1° / 최저 20.5°)',
        '',
        '[환율] 1 USD = 1341.49 KRW (기준 2026-10-09)',
        '',
        '[개발 뉴스]',
        '1. Zig 템플릿 (134점)',
        'https://example.com/zig',
        '2. Ask HN: 조언 (7점)',
        'https://news.ycombinator.com/item?id=2',
        '',
        '[오늘의 한마디]',
        'Stay hungry. - Steve',
        '계속 갈망하라. (자동 번역)',
      ].join('\n'),
    )
  })

  it('번역이 없으면 번역 줄을 뺀다', () => {
    const brief = full()
    brief.results.quote = { status: 'ok', data: { quote: 'Stay hungry.', author: 'Steve', translation: null } }

    const text = formatBrief(brief)

    expect(text).toContain('Stay hungry. - Steve')
    expect(text).not.toContain('자동 번역')
  })

  describe('실패한 위젯은 그 항목만 알린다', () => {
    it.each([
      ['weather', '[날씨] 가져오지 못했습니다: boom'],
      ['exchange', '[환율] 가져오지 못했습니다: boom'],
      ['news', '[개발 뉴스] 가져오지 못했습니다: boom'],
      ['quote', '[오늘의 한마디] 가져오지 못했습니다: boom'],
    ] as const)('%s', (name, line) => {
      const brief = full()
      brief.results[name] = { status: 'error', message: 'boom' }

      const text = formatBrief(brief)

      expect(text).toContain(line)
      for (const other of ['[날씨]', '[환율]', '[개발 뉴스]', '[오늘의 한마디]']) {
        expect(text).toContain(other)
      }
    })
  })

  it('결과가 없는 위젯은 정보 없음으로 표시한다', () => {
    const brief = full()
    brief.results = {}

    const text = formatBrief(brief)

    expect(text).toContain('[날씨] 정보 없음')
    expect(text).toContain('[환율] 정보 없음')
    expect(text).toContain('[개발 뉴스] 정보 없음')
    expect(text).toContain('[오늘의 한마디] 정보 없음')
  })

  it('뉴스가 0건이면 표시할 뉴스가 없다고 알린다', () => {
    const brief = full()
    brief.results.news = { status: 'ok', data: { items: [] } }

    expect(formatBrief(brief)).toContain('[개발 뉴스] 표시할 뉴스가 없습니다')
  })

  it('도시 정보가 없어도 날씨는 도시 이름 없이 표시한다', () => {
    const brief = { ...full(), city: null }

    expect(formatBrief(brief)).toContain('[날씨]\n대체로 맑음')
  })

  it('외부 문자열은 서식으로 바꾸지 않고 그대로 둔다', () => {
    const brief = full()
    brief.results.quote = {
      status: 'ok',
      data: { quote: '<b>bold</b> *star* _under_ [link](x)', author: '<i>a</i>', translation: null },
    }

    expect(formatBrief(brief)).toContain('<b>bold</b> *star* _under_ [link](x) - <i>a</i>')
  })

  it('4096자를 넘지 않는다 (넘으면 줄 단위로 자르고 생략 표시를 붙인다)', () => {
    const brief = full()
    brief.results.quote = {
      status: 'ok',
      data: { quote: 'x'.repeat(5000), author: 'Steve', translation: null },
    }

    const text = formatBrief(brief)

    expect(text.length).toBeLessThanOrEqual(4096)
    expect(text.endsWith('…')).toBe(true)
    expect(text.startsWith('아침 브리핑 2026-10-13')).toBe(true)
  })

  it('길이가 충분하면 자르지 않는다', () => {
    expect(formatBrief(full()).endsWith('…')).toBe(false)
  })
})

import { parseSnapshot } from '../../src/storage/snapshotSchema'
import { makeBrief } from '../../__fixtures__/brief'

describe('parseSnapshot', () => {
  it('올바른 브리핑은 그대로 읽는다', () => {
    const brief = makeBrief()
    expect(parseSnapshot(JSON.parse(JSON.stringify(brief)))).toEqual(brief)
  })

  it('도시가 null이어도 올바른 브리핑이다', () => {
    const brief = { ...makeBrief(), city: null }
    expect(parseSnapshot(JSON.parse(JSON.stringify(brief)))).toEqual(brief)
  })

  it('위젯 상태 요약은 저장된 값이 아니라 결과에서 다시 계산한다', () => {
    const stored = { ...makeBrief(), widgets: { weather: 'error', exchange: 'ok', news: 'ok', quote: 'ok' } }
    const parsed = parseSnapshot(JSON.parse(JSON.stringify(stored)))
    expect(parsed?.widgets).toEqual({ weather: 'ok', exchange: 'error', news: 'error', quote: 'error' })
  })

  it('저장된 결과의 데이터 모양이 틀리면 그 위젯만 error로 바꾼다', () => {
    const stored = makeBrief()
    const broken = JSON.parse(JSON.stringify(stored))
    broken.results.weather.data.temperature = 'hot'

    const parsed = parseSnapshot(broken)

    expect(parsed?.results.weather?.status).toBe('error')
    expect(parsed?.widgets.weather).toBe('error')
  })

  it('저장된 뉴스 링크가 javascript:이면 그 위젯을 error로 바꾼다', () => {
    const broken = JSON.parse(JSON.stringify(makeBrief()))
    broken.results.news = {
      status: 'ok',
      data: {
        items: [
          { id: 1, title: 'x', score: 1, url: 'javascript:alert(1)', discussionUrl: 'https://news.ycombinator.com/item?id=1' },
        ],
      },
    }

    expect(parseSnapshot(broken)?.results.news?.status).toBe('error')
  })

  it.each([
    ['null', null],
    ['문자열', 'x'],
    ['배열', []],
    ['날짜 누락', (() => { const b = JSON.parse(JSON.stringify(makeBrief())); delete b.date; return b })()],
    ['날짜 형식이 다름', { ...JSON.parse(JSON.stringify(makeBrief())), date: '10/13/2026' }],
    ['존재하지 않는 날짜', { ...JSON.parse(JSON.stringify(makeBrief())), date: '2026-02-31' }],
    ['도시가 잘못됨', { ...JSON.parse(JSON.stringify(makeBrief())), city: { name: 'x', latitude: 999 } }],
    ['results 누락', (() => { const b = JSON.parse(JSON.stringify(makeBrief())); delete b.results; return b })()],
    ['results가 배열', { ...JSON.parse(JSON.stringify(makeBrief())), results: [] }],
    ['위젯 결과 status가 이상함', { ...JSON.parse(JSON.stringify(makeBrief())), results: { weather: { status: 'maybe' } } }],
  ])('읽을 수 없는 값은 null을 반환한다: %s', (_name, value) => {
    expect(parseSnapshot(value)).toBeNull()
  })
})

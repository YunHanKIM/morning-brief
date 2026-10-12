import { toDashboardResults } from '../../src/components/toDashboardResults'

const data = { temperature: 18.4, condition: '맑음', high: 22, low: 11 }

describe('toDashboardResults', () => {
  it('올바른 날씨 ok 결과는 그대로 통과시킨다', () => {
    expect(toDashboardResults({ weather: { status: 'ok', data } })).toEqual({
      weather: { status: 'ok', data },
    })
  })

  it('error 결과는 그대로 통과시킨다', () => {
    expect(toDashboardResults({ weather: { status: 'error', message: 'boom' } })).toEqual({
      weather: { status: 'error', message: 'boom' },
    })
  })

  it('날씨 키가 없으면 weather를 비워 둔다', () => {
    expect(toDashboardResults({})).toEqual({})
  })

  it('ok인데 데이터 모양이 틀리면 error로 바꾼다', () => {
    const result = toDashboardResults({ weather: { status: 'ok', data: { temperature: '18' } } })
    expect(result.weather?.status).toBe('error')
  })

  describe('exchange', () => {
    const exchange = {
      base: 'USD',
      date: '2026-10-09',
      rates: { KRW: 1341.49, JPY: 158.25, EUR: 0.89238, CNY: 6.6921, GBP: 0.75641, AUD: 1.4324, CAD: 1.4226, CHF: 0.83107 },
    }

    it('올바른 환율 ok 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ exchange: { status: 'ok', data: exchange } })).toEqual({
        exchange: { status: 'ok', data: exchange },
      })
    })

    it('error 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ exchange: { status: 'error', message: 'boom' } })).toEqual({
        exchange: { status: 'error', message: 'boom' },
      })
    })

    it.each([
      ['rates 누락', { base: 'USD', date: '2026-10-09' }],
      ['통화 하나 누락', { ...exchange, rates: { ...exchange.rates, JPY: undefined } }],
      ['환율이 문자열', { ...exchange, rates: { ...exchange.rates, JPY: '158.25' } }],
      ['date 누락', { base: 'USD', rates: exchange.rates }],
      ['기준 통화가 USD가 아님', { ...exchange, base: 'EUR' }],
    ])('ok인데 데이터 모양이 틀리면 error로 바꾼다: %s', (_name, bad) => {
      const result = toDashboardResults({ exchange: { status: 'ok', data: bad } })
      expect(result.exchange?.status).toBe('error')
    })
  })

  describe('news', () => {
    const item = {
      id: 1,
      title: 'T',
      score: 3,
      url: 'https://example.com/a',
      discussionUrl: 'https://news.ycombinator.com/item?id=1',
    }
    const news = { items: [item] }

    it('올바른 뉴스 ok 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ news: { status: 'ok', data: news } })).toEqual({
        news: { status: 'ok', data: news },
      })
    })

    it('error 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ news: { status: 'error', message: 'boom' } }).news).toEqual({
        status: 'error',
        message: 'boom',
      })
    })

    it('글이 0건이어도 올바른 결과다', () => {
      expect(toDashboardResults({ news: { status: 'ok', data: { items: [] } } }).news?.status).toBe('ok')
    })

    it.each([
      ['items 누락', {}],
      ['items가 배열이 아님', { items: 'x' }],
      ['제목이 숫자', { items: [{ ...item, title: 1 }] }],
      ['점수가 문자열', { items: [{ ...item, score: '3' }] }],
      ['javascript: 링크', { items: [{ ...item, url: 'javascript:alert(1)' }] }],
      ['http가 아닌 토론 주소', { items: [{ ...item, discussionUrl: 'data:text/html,x' }] }],
      ['항목이 null', { items: [null] }],
    ])('ok인데 데이터 모양이 틀리면 error로 바꾼다: %s', (_name, bad) => {
      expect(toDashboardResults({ news: { status: 'ok', data: bad } }).news?.status).toBe('error')
    })
  })

  describe('quote', () => {
    const quote = { quote: 'Hi', author: 'Me', translation: '안녕' }

    it('올바른 명언 ok 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ quote: { status: 'ok', data: quote } }).quote).toEqual({
        status: 'ok',
        data: quote,
      })
    })

    it('번역이 null이어도 올바른 결과다', () => {
      const data = { ...quote, translation: null }
      expect(toDashboardResults({ quote: { status: 'ok', data } }).quote).toEqual({ status: 'ok', data })
    })

    it('error 결과는 그대로 통과시킨다', () => {
      expect(toDashboardResults({ quote: { status: 'error', message: 'boom' } }).quote).toEqual({
        status: 'error',
        message: 'boom',
      })
    })

    it.each([
      ['명언 누락', { author: 'Me', translation: null }],
      ['명언이 빈 문자열', { ...quote, quote: '' }],
      ['명언이 공백뿐', { ...quote, quote: '   ' }],
      ['저자가 빈 문자열', { ...quote, author: '' }],
      ['저자가 공백뿐', { ...quote, author: '   ' }],
      ['저자가 숫자', { ...quote, author: 1 }],
      ['번역이 숫자', { ...quote, translation: 1 }],
      ['번역 필드 없음(undefined)', { quote: 'Hi', author: 'Me' }],
      ['null', null],
    ])('ok인데 데이터 모양이 틀리면 error로 바꾼다: %s', (_name, bad) => {
      expect(toDashboardResults({ quote: { status: 'ok', data: bad } }).quote?.status).toBe('error')
    })
  })
})

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
})

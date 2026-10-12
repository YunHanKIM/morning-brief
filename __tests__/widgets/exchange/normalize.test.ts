import { normalizeExchange } from '../../../src/widgets/exchange/normalize'

const raw = { amount: 1 as const, base: 'USD' as const, date: '2026-10-09', rates: { KRW: 1341.49, JPY: 158.25 } }

describe('normalizeExchange', () => {
  it('USD 기준 환율, 대상 통화, 기준 일자를 반환한다', () => {
    expect(normalizeExchange(raw, 'KRW')).toEqual({
      base: 'USD',
      quote: 'KRW',
      rate: 1341.49,
      date: '2026-10-09',
    })
  })

  it('요청한 통화의 환율을 고른다', () => {
    expect(normalizeExchange(raw, 'JPY').rate).toBe(158.25)
  })
})

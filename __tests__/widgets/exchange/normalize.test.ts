import { normalizeExchange } from '../../../src/widgets/exchange/normalize'

const rates = {
  KRW: 1341.49,
  JPY: 158.25,
  EUR: 0.89238,
  CNY: 6.6921,
  GBP: 0.75641,
  AUD: 1.4324,
  CAD: 1.4226,
  CHF: 0.83107,
}

describe('normalizeExchange', () => {
  it('USD 기준 통화별 환율과 기준 일자를 반환한다', () => {
    const raw = { amount: 1 as const, base: 'USD' as const, date: '2026-10-09', rates }
    expect(normalizeExchange(raw)).toEqual({ base: 'USD', date: '2026-10-09', rates })
  })
})

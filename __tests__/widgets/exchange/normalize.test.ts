import { normalizeExchange } from '../../../src/widgets/exchange/normalize'

describe('normalizeExchange', () => {
  it('USD/KRW 환율과 기준 일자를 반환한다', () => {
    const raw = { amount: 1 as const, base: 'USD' as const, date: '2026-10-09', rates: { KRW: 1341.49 } }
    expect(normalizeExchange(raw)).toEqual({ rate: 1341.49, date: '2026-10-09' })
  })
})

import {
  CURRENCIES,
  CURRENCY_NAMES,
  DEFAULT_CURRENCY,
  parseCurrency,
} from '../../../src/widgets/exchange/currencies'

describe('currencies', () => {
  it('기본 통화는 KRW이고 목록의 첫 번째다', () => {
    expect(DEFAULT_CURRENCY).toBe('KRW')
    expect(CURRENCIES[0]).toBe('KRW')
  })

  it('목록의 모든 통화에 한글 이름이 있다', () => {
    for (const code of CURRENCIES) {
      expect(CURRENCY_NAMES[code].length).toBeGreaterThan(0)
    }
  })

  it.each(CURRENCIES.map((code) => [code]))('목록에 있는 %s는 그대로 반환한다', (code) => {
    expect(parseCurrency(code)).toBe(code)
  })

  it.each([
    ['목록에 없는 통화', 'XYZ'],
    ['소문자', 'jpy'],
    ['빈 문자열', ''],
    ['undefined', undefined],
    ['배열(?to=JPY&to=EUR)', ['JPY', 'EUR']],
    ['주입 시도', 'KRW&base=EUR'],
  ])('잘못된 값은 기본 통화로 되돌린다: %s', (_name, value) => {
    expect(parseCurrency(value)).toBe('KRW')
  })
})

import { fetchExchange } from '../../../src/widgets/exchange/fetch'
import { CURRENCIES } from '../../../src/widgets/exchange/currencies'

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
const validBody = { amount: 1, base: 'USD', date: '2026-10-09', rates }

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 })

const without = (code: string) =>
  Object.fromEntries(Object.entries(rates).filter(([key]) => key !== code))

describe('fetchExchange', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Frankfurter에 USD 기준 8개 통화를 한 번에 요청하고 검증된 응답을 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(validBody))

    const raw = await fetchExchange()

    expect(spy).toHaveBeenCalledTimes(1)
    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://api.frankfurter.dev/v1/latest')
    expect(url.searchParams.get('base')).toBe('USD')
    expect(url.searchParams.get('symbols')?.split(',').sort()).toEqual([...CURRENCIES].sort())
    expect(raw.rates.KRW).toBe(1341.49)
    expect(raw.rates.JPY).toBe(158.25)
    expect(raw.date).toBe('2026-10-09')
  })

  it('5초 타임아웃 신호(AbortSignal)를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(validBody))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await fetchExchange()

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('HTTP 오류 응답이면 예외를 던진다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))

    await expect(fetchExchange()).rejects.toThrow('503')
  })

  it.each([
    ['rates 누락', { base: 'USD', date: '2026-10-09' }],
    ['통화 하나(JPY) 누락', { ...validBody, rates: without('JPY') }],
    ['통화 하나(KRW) 누락', { ...validBody, rates: without('KRW') }],
    ['환율이 문자열', { ...validBody, rates: { ...rates, JPY: '158.25' } }],
    ['환율이 0 이하', { ...validBody, rates: { ...rates, EUR: 0 } }],
    ['date 누락', { base: 'USD', rates }],
    ['date 형식이 다름', { ...validBody, date: '10/09/2026' }],
    ['기준 통화가 USD가 아님', { ...validBody, base: 'EUR' }],
    ['amount가 1이 아님', { ...validBody, amount: 100 }],
    ['존재하지 않는 날짜(2월 31일)', { ...validBody, date: '2026-02-31' }],
    ['존재하지 않는 날짜(13월)', { ...validBody, date: '2026-13-09' }],
  ])('응답 모양이 다르면 예외를 던진다: %s', async (_name, body) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(body))

    await expect(fetchExchange()).rejects.toThrow()
  })
})

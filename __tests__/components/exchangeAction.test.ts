import { loadExchange } from '../../src/components/exchangeAction'

const exchangeResponse = (to: string) =>
  new Response(
    JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates: { [to]: 100 } }),
    { status: 200 },
  )

const symbolOf = (spy: jest.SpyInstance) =>
  new URL(String(spy.mock.calls[0][0])).searchParams.get('symbols')

describe('loadExchange', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('선택한 통화의 환율 결과를 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(exchangeResponse('JPY'))

    const result = await loadExchange('JPY')

    expect(symbolOf(spy)).toBe('JPY')
    expect(result).toEqual({
      status: 'ok',
      data: { base: 'USD', quote: 'JPY', rate: 100, date: '2026-10-09' },
    })
  })

  it.each([
    ['목록에 없는 통화', 'XYZ'],
    ['배열', ['JPY', 'EUR']],
    ['주입 시도', 'KRW&base=EUR'],
    ['undefined', undefined],
  ])('잘못된 입력은 KRW로 조회한다: %s', async (_name, to) => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(exchangeResponse('KRW'))

    await loadExchange(to)

    expect(symbolOf(spy)).toBe('KRW')
  })

  it('조회가 실패하면 던지지 않고 error 결과를 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))

    const result = await loadExchange('JPY')

    expect(result.status).toBe('error')
  })
})

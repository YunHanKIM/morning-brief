import { loadDashboardResults } from '../../src/components/loadDashboardResults'

const weatherBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}

function mockFetch(exchangeStatus = 200) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    if (url.hostname === 'api.frankfurter.dev') {
      if (exchangeStatus !== 200) return new Response('fail', { status: exchangeStatus })
      const to = url.searchParams.get('symbols') ?? ''
      return new Response(
        JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates: { [to]: 100 } }),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify(weatherBody), { status: 200 })
  })
}

const symbolsRequested = (spy: jest.SpyInstance) =>
  spy.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.hostname === 'api.frankfurter.dev')
    .map((url) => url.searchParams.get('symbols'))

describe('loadDashboardResults', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('?to=JPY면 JPY 환율을 조회해 날씨와 함께 반환한다', async () => {
    const spy = mockFetch()

    const results = await loadDashboardResults({ to: 'JPY' })

    expect(symbolsRequested(spy)).toEqual(['JPY'])
    expect(results.exchange).toEqual({
      status: 'ok',
      data: { base: 'USD', quote: 'JPY', rate: 100, date: '2026-10-09' },
    })
    expect(results.weather?.status).toBe('ok')
  })

  it.each([
    ['to 없음', undefined],
    ['목록에 없는 통화', 'XYZ'],
    ['배열', ['JPY', 'EUR']],
    ['주입 시도', 'KRW&base=EUR'],
  ])('잘못된 to는 KRW로 조회한다: %s', async (_name, to) => {
    const spy = mockFetch()

    await loadDashboardResults({ to })

    expect(symbolsRequested(spy)).toEqual(['KRW'])
  })

  it('환율이 실패해도 날씨는 정상으로 반환한다', async () => {
    mockFetch(503)

    const results = await loadDashboardResults({ to: 'JPY' })

    expect(results.exchange?.status).toBe('error')
    expect(results.weather?.status).toBe('ok')
  })
})

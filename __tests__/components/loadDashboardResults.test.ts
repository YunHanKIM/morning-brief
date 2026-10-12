import { loadDashboardResults } from '../../src/components/loadDashboardResults'
import { CURRENCIES } from '../../src/widgets/exchange/currencies'

const weatherBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}
const rates = Object.fromEntries(CURRENCIES.map((code, i) => [code, i + 1]))

function mockFetch(exchangeStatus = 200) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    if (url.hostname === 'api.frankfurter.dev') {
      if (exchangeStatus !== 200) return new Response('fail', { status: exchangeStatus })
      return new Response(
        JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates }),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify(weatherBody), { status: 200 })
  })
}

describe('loadDashboardResults', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('날씨와 모든 통화의 환율을 각각 한 번씩만 조회해 반환한다', async () => {
    const spy = mockFetch()

    const results = await loadDashboardResults()

    const hosts = spy.mock.calls.map(([input]) => new URL(String(input)).hostname)
    expect(hosts.sort()).toEqual(['api.frankfurter.dev', 'api.open-meteo.com'])
    expect(results.exchange).toEqual({
      status: 'ok',
      data: { base: 'USD', date: '2026-10-09', rates },
    })
    expect(results.weather?.status).toBe('ok')
  })

  it('환율이 실패해도 날씨는 정상으로 반환한다', async () => {
    mockFetch(503)

    const results = await loadDashboardResults()

    expect(results.exchange?.status).toBe('error')
    expect(results.weather?.status).toBe('ok')
  })
})

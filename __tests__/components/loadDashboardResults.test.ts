import { loadDashboardResults } from '../../src/components/loadDashboardResults'
import { CURRENCIES } from '../../src/widgets/exchange/currencies'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const busan = POPULAR_CITIES[1]
const weatherBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}
const rates = Object.fromEntries(CURRENCIES.map((code, i) => [code, i + 1]))

type Service = 'weather' | 'exchange' | 'news' | 'quote'

// 실패시킬 서비스를 지정할 수 있는 가짜 fetch
function mockFetch(failing: Service[] = []) {
  const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 })
  const fail = () => new Response('fail', { status: 500 })
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    switch (url.hostname) {
      case 'hacker-news.firebaseio.com': {
        if (failing.includes('news')) return fail()
        if (url.pathname.endsWith('/topstories.json')) return json([11, 12])
        const id = Number(url.pathname.match(/item\/(\d+)\.json/)?.[1])
        return json({ id, type: 'story', title: `글 ${id}`, score: 5, url: `https://example.com/${id}` })
      }
      case 'api.frankfurter.dev':
        return failing.includes('exchange')
          ? fail()
          : json({ amount: 1, base: 'USD', date: '2026-10-09', rates })
      case 'zenquotes.io':
        return failing.includes('quote') ? fail() : json([{ q: 'Stay hungry.', a: 'Steve' }])
      case 'api.mymemory.translated.net':
        return json({ responseData: { translatedText: '계속 갈망하라.' }, responseStatus: 200 })
      default:
        return failing.includes('weather') ? fail() : json(weatherBody)
    }
  })
}

const hostsOf = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([input]) => new URL(String(input)).hostname)

describe('loadDashboardResults', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('날씨·환율·뉴스·명언을 각각 조회해 모두 반환한다', async () => {
    const spy = mockFetch()

    const results = await loadDashboardResults(busan)

    expect(hostsOf(spy).sort()).toEqual([
      'api.frankfurter.dev',
      'api.mymemory.translated.net',
      'api.open-meteo.com',
      'hacker-news.firebaseio.com',
      'hacker-news.firebaseio.com',
      'hacker-news.firebaseio.com',
      'zenquotes.io',
    ])
    expect(results.exchange).toEqual({
      status: 'ok',
      data: { base: 'USD', date: '2026-10-09', rates },
    })
    expect(results.weather?.status).toBe('ok')
    expect(results.news?.status).toBe('ok')
    expect(results.quote).toEqual({
      status: 'ok',
      data: { quote: 'Stay hungry.', author: 'Steve', translation: '계속 갈망하라.' },
    })
  })

  it('날씨는 받은 도시의 좌표로 조회한다', async () => {
    const spy = mockFetch()

    await loadDashboardResults(busan)

    const weatherUrl = spy.mock.calls
      .map(([input]) => new URL(String(input)))
      .find((url) => url.hostname === 'api.open-meteo.com')
    expect(weatherUrl?.searchParams.get('latitude')).toBe(String(busan.latitude))
    expect(weatherUrl?.searchParams.get('longitude')).toBe(String(busan.longitude))
  })

  it('도시가 없으면 날씨는 조회하지 않고 나머지만 반환한다', async () => {
    const spy = mockFetch()

    const results = await loadDashboardResults(null)

    expect(hostsOf(spy)).not.toContain('api.open-meteo.com')
    expect(results.weather).toBeUndefined()
    expect(results.exchange?.status).toBe('ok')
    expect(results.news?.status).toBe('ok')
    expect(results.quote?.status).toBe('ok')
  })

  it.each<[Service, Service[]]>([
    ['weather', ['exchange', 'news', 'quote']],
    ['exchange', ['weather', 'news', 'quote']],
    ['news', ['weather', 'exchange', 'quote']],
    ['quote', ['weather', 'exchange', 'news']],
  ])('%s가 실패해도 나머지는 정상으로 반환한다', async (failed, others) => {
    mockFetch([failed])

    const results = await loadDashboardResults(busan)

    expect(results[failed]?.status).toBe('error')
    for (const other of others) {
      expect(results[other]?.status).toBe('ok')
    }
  })
})

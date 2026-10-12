import { generateBrief } from '../../src/brief/generateBrief'
import { CURRENCIES } from '../../src/widgets/exchange/currencies'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const NOW = new Date('2026-10-12T22:00:00Z') // 한국 시간 2026-10-13 07:00
const weatherBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}
const rates = Object.fromEntries(CURRENCIES.map((code, i) => [code, i + 1]))

type Service = 'weather' | 'exchange' | 'news' | 'quote'

function mockFetch(failing: Service[] = []) {
  const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 })
  const fail = () => new Response('fail', { status: 500 })
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    switch (url.hostname) {
      case 'hacker-news.firebaseio.com': {
        if (failing.includes('news')) return fail()
        if (url.pathname.endsWith('/topstories.json')) return json([11])
        return json({ id: 11, type: 'story', title: '글', score: 5, url: 'https://example.com/11' })
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

const weatherUrl = (spy: jest.SpyInstance) =>
  spy.mock.calls
    .map(([input]) => new URL(String(input)))
    .find((url) => url.hostname === 'api.open-meteo.com')

describe('generateBrief', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('한국 시간 날짜, 도시, 위젯별 상태 요약, 위젯 결과를 반환한다', async () => {
    mockFetch()

    const brief = await generateBrief({ cityValue: '부산', now: NOW })

    expect(brief.date).toBe('2026-10-13')
    expect(brief.city).toEqual(POPULAR_CITIES[1])
    expect(brief.widgets).toEqual({ weather: 'ok', exchange: 'ok', news: 'ok', quote: 'ok' })
    expect(brief.results.weather?.status).toBe('ok')
    expect(brief.results.quote).toEqual({
      status: 'ok',
      data: { quote: 'Stay hungry.', author: 'Steve', translation: '계속 갈망하라.' },
    })
  })

  it('BRIEF_CITY가 없으면 서울 날씨를 조회한다', async () => {
    const spy = mockFetch()

    const brief = await generateBrief({ cityValue: undefined, now: NOW })

    expect(brief.city).toEqual(POPULAR_CITIES[0])
    expect(weatherUrl(spy)?.searchParams.get('latitude')).toBe(String(POPULAR_CITIES[0].latitude))
  })

  it('설정한 도시의 좌표로 날씨를 조회한다', async () => {
    const spy = mockFetch()

    await generateBrief({ cityValue: '제주', now: NOW })

    expect(weatherUrl(spy)?.searchParams.get('latitude')).toBe(String(POPULAR_CITIES[7].latitude))
    expect(weatherUrl(spy)?.searchParams.get('longitude')).toBe(String(POPULAR_CITIES[7].longitude))
  })

  it('BRIEF_CITY가 잘못되면 날씨만 설정 오류로 표시하고 나머지는 정상이다 (조용히 서울로 바꾸지 않는다)', async () => {
    const spy = mockFetch()

    const brief = await generateBrief({ cityValue: '아무개시', now: NOW })

    expect(brief.city).toBeNull()
    expect(brief.widgets).toEqual({ weather: 'error', exchange: 'ok', news: 'ok', quote: 'ok' })
    expect(brief.results.weather).toEqual({
      status: 'error',
      message: 'BRIEF_CITY 설정이 올바르지 않습니다',
    })
    expect(weatherUrl(spy)).toBeUndefined()
  })

  it.each<[Service]>([['weather'], ['exchange'], ['news'], ['quote']])(
    '%s가 실패하면 그것만 error로 요약하고 나머지는 ok다',
    async (failed) => {
      mockFetch([failed])

      const brief = await generateBrief({ cityValue: '서울', now: NOW })

      for (const name of ['weather', 'exchange', 'news', 'quote'] as const) {
        expect(brief.widgets[name]).toBe(name === failed ? 'error' : 'ok')
      }
    },
  )
})

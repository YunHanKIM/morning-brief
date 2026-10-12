import * as route from '../../src/app/api/cron/brief/route'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const SECRET = 'test-cron-secret'
const URL_ = 'http://localhost/api/cron/brief'

const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 })

function mockFetch() {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    switch (url.hostname) {
      case 'hacker-news.firebaseio.com':
        return url.pathname.endsWith('/topstories.json')
          ? json([11])
          : json({ id: 11, type: 'story', title: '글', score: 5 })
      case 'api.frankfurter.dev':
        return json({
          amount: 1,
          base: 'USD',
          date: '2026-10-09',
          rates: { KRW: 1, JPY: 2, EUR: 3, CNY: 4, GBP: 5, AUD: 6, CAD: 7, CHF: 8 },
        })
      case 'zenquotes.io':
        return json([{ q: 'Stay hungry.', a: 'Steve' }])
      case 'api.mymemory.translated.net':
        return json({ responseData: { translatedText: '계속 갈망하라.' }, responseStatus: 200 })
      default:
        return json({
          current: { temperature_2m: 19.6, weather_code: 1 },
          daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
        })
    }
  })
}

const post = (headers: Record<string, string> = {}) =>
  route.POST(new Request(URL_, { method: 'POST', headers }))

describe('POST /api/cron/brief', () => {
  const saved = { secret: process.env.CRON_SECRET, city: process.env.BRIEF_CITY }

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET
    delete process.env.BRIEF_CITY
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (saved.secret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = saved.secret
    if (saved.city === undefined) delete process.env.BRIEF_CITY
    else process.env.BRIEF_CITY = saved.city
  })

  describe('인증 실패는 401이고 외부 API를 한 번도 호출하지 않는다', () => {
    it.each([
      ['헤더 없음', {}],
      ['틀린 토큰', { authorization: 'Bearer wrong' }],
      ['스킴이 다름', { authorization: `Basic ${SECRET}` }],
      ['토큰 없음', { authorization: 'Bearer ' }],
    ])('%s', async (_name, headers) => {
      const spy = mockFetch()

      const response = await post(headers)

      expect(response.status).toBe(401)
      expect(response.headers.get('www-authenticate')).toBe('Bearer')
      expect(await response.json()).toEqual({ error: 'unauthorized' })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('CRON_SECRET이 설정되지 않았으면 닫힌 채로 500이다', () => {
    it.each([
      ['없음', undefined],
      ['빈 문자열', ''],
      ['공백뿐', '   '],
    ])('%s', async (_name, value) => {
      if (value === undefined) delete process.env.CRON_SECRET
      else process.env.CRON_SECRET = value
      const spy = mockFetch()

      const response = await post({ authorization: `Bearer ${value ?? ''}` })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'server not configured' })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  it('올바른 토큰이면 200과 브리핑을 돌려주고 캐시하지 않는다', async () => {
    mockFetch()

    const response = await post({ authorization: `Bearer ${SECRET}` })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.json()
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(body.widgets).toEqual({ weather: 'ok', exchange: 'ok', news: 'ok', quote: 'ok' })
    expect(body.results.quote.data.quote).toBe('Stay hungry.')
    expect(body.city.name).toBe('서울')
  })

  it.each([
    ['앞뒤 공백', ` ${SECRET} `],
    ['끝의 줄바꿈 (secret 복사 시 흔함)', `${SECRET}
`],
    ['앞의 탭과 끝의 CRLF', `	${SECRET}
`],
  ])('비밀값 설정에 %s이 섞여도 정상 토큰이 통과한다', async (_name, configured) => {
    process.env.CRON_SECRET = configured
    mockFetch()

    const response = await post({ authorization: `Bearer ${SECRET}` })

    expect(response.status).toBe(200)
  })

  it('비밀값 중간에 공백이 있으면 어떤 토큰도 담을 수 없어 설정 오류(500)로 닫는다', async () => {
    process.env.CRON_SECRET = 'has space'
    const spy = mockFetch()

    const response = await post({ authorization: 'Bearer has space' })

    expect(response.status).toBe(500)
    expect(spy).not.toHaveBeenCalled()
  })

  it('응답에 비밀값이 들어 있지 않다', async () => {
    mockFetch()

    const response = await post({ authorization: `Bearer ${SECRET}` })

    expect(JSON.stringify(await response.json())).not.toContain(SECRET)
  })

  it('BRIEF_CITY 환경변수의 도시를 쓴다', async () => {
    process.env.BRIEF_CITY = '제주'
    mockFetch()

    const body = await (await post({ authorization: `Bearer ${SECRET}` })).json()

    expect(body.city.name).toBe('제주')
  })

  it('일부 위젯이 실패해도 200이고 요약에 error로 표시된다', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (new URL(String(input)).hostname === 'api.frankfurter.dev') {
        return new Response('fail', { status: 500 })
      }
      return mockFetchBody(String(input))
    })

    const response = await post({ authorization: `Bearer ${SECRET}` })

    expect(response.status).toBe(200)
    expect((await response.json()).widgets.exchange).toBe('error')
  })

  it('POST만 지원한다 (GET 등은 내보내지 않는다)', () => {
    expect(Object.keys(route).sort()).toEqual(['POST'])
  })
})

function mockFetchBody(input: string): Response {
  const url = new URL(input)
  switch (url.hostname) {
    case 'hacker-news.firebaseio.com':
      return url.pathname.endsWith('/topstories.json')
        ? json([11])
        : json({ id: 11, type: 'story', title: '글', score: 5 })
    case 'zenquotes.io':
      return json([{ q: 'Stay hungry.', a: 'Steve' }])
    case 'api.mymemory.translated.net':
      return json({ responseData: { translatedText: '계속 갈망하라.' }, responseStatus: 200 })
    default:
      return json({
        current: { temperature_2m: 19.6, weather_code: 1 },
        daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
      })
  }
}

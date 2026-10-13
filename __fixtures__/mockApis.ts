export type Service = 'weather' | 'exchange' | 'news' | 'quote' | 'telegram'

export const TELEGRAM_TOKEN = '123456789:AAE-secret_Token0123456789abcdefghij'
export const TELEGRAM_CHAT = '-1001234567890'

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const fail = () => new Response('fail', { status: 500 })

// 위젯 4종과 Telegram의 외부 호출을 한꺼번에 가짜로 바꾼다. failing에 든 서비스는 실패한다
export function mockAllApis(failing: Service[] = []): jest.SpyInstance {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    switch (url.hostname) {
      case 'hacker-news.firebaseio.com':
        if (failing.includes('news')) return fail()
        return url.pathname.endsWith('/topstories.json')
          ? json([11])
          : json({ id: 11, type: 'story', title: '글', score: 5, url: 'https://example.com/11' })
      case 'api.frankfurter.dev':
        return failing.includes('exchange')
          ? fail()
          : json({
              amount: 1,
              base: 'USD',
              date: '2026-10-09',
              rates: { KRW: 1341.49, JPY: 2, EUR: 3, CNY: 4, GBP: 5, AUD: 6, CAD: 7, CHF: 8 },
            })
      case 'zenquotes.io':
        return failing.includes('quote') ? fail() : json([{ q: 'Stay hungry.', a: 'Steve' }])
      case 'api.mymemory.translated.net':
        return json({ responseData: { translatedText: '계속 갈망하라.' }, responseStatus: 200 })
      case 'api.telegram.org':
        return failing.includes('telegram')
          ? json({ ok: false, error_code: 401, description: 'Unauthorized' }, 401)
          : json({ ok: true, result: { message_id: 1 } })
      default:
        return failing.includes('weather')
          ? fail()
          : json({
              current: { temperature_2m: 19.6, weather_code: 1 },
              daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
            })
    }
  })
}

export const hostsOf = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([input]) => new URL(String(input)).hostname)

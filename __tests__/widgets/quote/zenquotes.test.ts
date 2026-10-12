import { fetchTodayQuote } from '../../../src/widgets/quote/zenquotes'

const body = [{ q: 'Those who know, do.', a: 'Aristotle', i: 'x', h: '<blockquote>…', date: '2026-10-12' }]
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('fetchTodayQuote', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('ZenQuotes 오늘의 명언을 요청하고 명언과 저자만 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(body))

    const result = await fetchTodayQuote()

    expect(String(spy.mock.calls[0][0])).toBe('https://zenquotes.io/api/today')
    expect(result).toEqual({ quote: 'Those who know, do.', author: 'Aristotle' })
  })

  it('명언과 저자의 앞뒤 공백을 지운다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ q: '  Hi  ', a: ' Me ' }]))

    expect(await fetchTodayQuote()).toEqual({ quote: 'Hi', author: 'Me' })
  })

  it('5초 타임아웃 신호(AbortSignal)를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(body))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await fetchTodayQuote()

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('HTTP 오류(한도 초과 429 포함)면 예외를 던진다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('slow down', { status: 429 }))

    await expect(fetchTodayQuote()).rejects.toThrow('429')
  })

  it('정상(200) 응답이지만 한도 초과 안내문이면 예외를 던진다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      json([{ q: 'Too many requests. Obtain an auth key for unlimited access.', a: 'zenquotes.io', h: '' }]),
    )

    await expect(fetchTodayQuote()).rejects.toThrow('한도')
  })

  it.each([
    ['빈 배열', []],
    ['배열이 아님', { q: 'x', a: 'y' }],
    ['명언 누락', [{ a: 'Aristotle' }]],
    ['저자 누락', [{ q: 'x' }]],
    ['명언이 빈 문자열', [{ q: '', a: 'Aristotle' }]],
    ['명언이 숫자', [{ q: 1, a: 'Aristotle' }]],
    ['명언이 공백뿐', [{ q: '   ', a: 'Aristotle' }]],
    ['저자가 공백뿐', [{ q: 'x', a: '   ' }]],
  ])('응답 모양이 다르면 예외를 던진다: %s', async (_name, value) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(value))

    await expect(fetchTodayQuote()).rejects.toThrow()
  })
})

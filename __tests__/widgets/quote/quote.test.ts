import { runWidget } from '../../../src/widgets/runWidget'
import { quoteWidget } from '../../../src/widgets/quote'
import { normalizeQuote } from '../../../src/widgets/quote/normalize'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

function mockApis({ quote = 200, translate = 200 }: { quote?: number; translate?: number } = {}) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    if (url.hostname === 'zenquotes.io') {
      return quote === 200
        ? json([{ q: 'Those who know, do.', a: 'Aristotle' }])
        : new Response('fail', { status: quote })
    }
    return translate === 200
      ? json({ responseData: { translatedText: '아는 사람은 행동한다.' }, responseStatus: 200 })
      : new Response('fail', { status: translate })
  })
}

describe('normalizeQuote', () => {
  it('명언·저자·번역을 반환한다', () => {
    expect(normalizeQuote({ quote: 'Hi', author: 'Me', translation: '안녕' })).toEqual({
      quote: 'Hi',
      author: 'Me',
      translation: '안녕',
    })
  })

  it('번역이 없으면 null로 둔다', () => {
    expect(normalizeQuote({ quote: 'Hi', author: 'Me', translation: null }).translation).toBeNull()
  })

  it('앞뒤 공백을 지운다', () => {
    expect(normalizeQuote({ quote: '  Hi ', author: ' Me  ', translation: null })).toMatchObject({
      quote: 'Hi',
      author: 'Me',
    })
  })
})

describe('quoteWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('이름은 quote이고 명언과 한글 번역을 ok로 반환한다', async () => {
    mockApis()

    expect(quoteWidget.name).toBe('quote')
    expect(await runWidget(quoteWidget)).toEqual({
      status: 'ok',
      data: { quote: 'Those who know, do.', author: 'Aristotle', translation: '아는 사람은 행동한다.' },
    })
  })

  it('번역이 실패해도 영어 명언은 ok로 반환한다 (translation은 null)', async () => {
    mockApis({ translate: 500 })

    expect(await runWidget(quoteWidget)).toEqual({
      status: 'ok',
      data: { quote: 'Those who know, do.', author: 'Aristotle', translation: null },
    })
  })

  it('명언을 못 가져오면 번역은 시도하지 않고 error로 반환한다', async () => {
    const spy = mockApis({ quote: 429 })

    const result = await runWidget(quoteWidget)

    expect(result.status).toBe('error')
    const hosts = spy.mock.calls.map(([input]) => new URL(String(input)).hostname)
    expect(hosts).toEqual(['zenquotes.io'])
  })

  it('번역에는 영어 명언 본문을 보낸다', async () => {
    const spy = mockApis()

    await runWidget(quoteWidget)

    const translateUrl = spy.mock.calls
      .map(([input]) => new URL(String(input)))
      .find((url) => url.hostname === 'api.mymemory.translated.net')
    expect(translateUrl?.searchParams.get('q')).toBe('Those who know, do.')
  })
})

import { runWidget } from '../../../src/widgets/runWidget'
import { newsWidget } from '../../../src/widgets/news'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('newsWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('이름은 news이고 runWidget으로 정규화된 뉴스를 ok로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/topstories.json')) return json([42])
      return json({ id: 42, type: 'story', title: '뉴스', score: 99, url: 'https://example.com/42' })
    })

    expect(newsWidget.name).toBe('news')
    expect(await runWidget(newsWidget)).toEqual({
      status: 'ok',
      data: {
        items: [
          {
            id: 42,
            title: '뉴스',
            score: 99,
            url: 'https://example.com/42',
            discussionUrl: 'https://news.ycombinator.com/item?id=42',
          },
        ],
      },
    })
  })

  it('API가 실패하면 error로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    expect(await runWidget(newsWidget)).toEqual({ status: 'error', message: 'network down' })
  })
})

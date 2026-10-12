import { fetchNews } from '../../../src/widgets/news/fetch'

const story = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'story',
  title: `제목 ${id}`,
  score: id * 10,
  url: `https://example.com/${id}`,
  ...extra,
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

// 주소에 따라 topstories / 각 글을 돌려주는 가짜 fetch
function mockHn(ids: number[], items: Record<number, () => Response | Promise<Response>>) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/topstories.json')) return json(ids)
    const match = url.match(/\/item\/(\d+)\.json$/)
    const make = match && items[Number(match[1])]
    if (!make) throw new Error(`예상하지 못한 호출: ${url}`)
    return make()
  })
}

const urlsOf = (spy: jest.SpyInstance) => spy.mock.calls.map(([input]) => String(input))

describe('fetchNews', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('상위 ID 목록을 받아 앞의 10건을 각각 조회한다 (걸러지는 글을 대비한 여유분)', async () => {
    const ids = Array.from({ length: 15 }, (_, i) => i + 1)
    const spy = mockHn(ids, Object.fromEntries(ids.map((id) => [id, () => json(story(id))])))

    const raw = await fetchNews()

    const urls = urlsOf(spy)
    expect(urls[0]).toBe('https://hacker-news.firebaseio.com/v0/topstories.json')
    expect(urls.slice(1).sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => `https://hacker-news.firebaseio.com/v0/item/${i + 1}.json`).sort(),
    )
    expect(raw.stories.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('글 조회는 순차가 아니라 병렬로 시작한다', async () => {
    const started: number[] = []
    const slow = (id: number) => async () => {
      started.push(id)
      await new Promise((resolve) => setTimeout(resolve, 30))
      return json(story(id))
    }
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    mockHn(ids, Object.fromEntries(ids.map((id) => [id, slow(id)])))

    const promise = fetchNews()
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(started.sort((a, b) => a - b)).toEqual(ids)
    await promise
  })

  it('검증된 글의 제목·점수·링크를 반환한다', async () => {
    mockHn([7], { 7: () => json(story(7)) })

    const raw = await fetchNews()

    expect(raw.stories).toEqual([
      { id: 7, type: 'story', title: '제목 7', score: 70, url: 'https://example.com/7' },
    ])
  })

  it('링크가 없는 글(Ask HN 등)도 유지한다', async () => {
    mockHn([7], { 7: () => json({ id: 7, type: 'story', title: 'Ask HN: x', score: 5 }) })

    const raw = await fetchNews()

    expect(raw.stories[0].url).toBeUndefined()
  })

  it('모든 요청에 5초 타임아웃 신호를 전달한다', async () => {
    const spy = mockHn([1, 2], { 1: () => json(story(1)), 2: () => json(story(2)) })
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await fetchNews()

    expect(timeoutSpy).toHaveBeenCalledTimes(3)
    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    for (const [, init] of spy.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  describe('일부 글이 실패하면', () => {
    it.each([
      ['HTTP 오류', () => json({}, 500)],
      ['삭제된 글(null)', () => json(null)],
      ['모양이 다른 글', () => json({ id: 2, title: 3 })],
      ['네트워크 오류', () => Promise.reject(new Error('network'))],
    ])('나머지 글은 그대로 반환한다: %s', async (_name, bad) => {
      mockHn([1, 2, 3], { 1: () => json(story(1)), 2: bad, 3: () => json(story(3)) })

      const raw = await fetchNews()

      expect(raw.stories.map((s) => s.id)).toEqual([1, 3])
    })

    it('모든 글이 실패하면 예외를 던진다', async () => {
      mockHn([1, 2], { 1: () => json({}, 500), 2: () => json(null) })

      await expect(fetchNews()).rejects.toThrow()
    })
  })

  describe('상위 목록 조회가 잘못되면 예외를 던진다', () => {
    it('HTTP 오류', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))
      await expect(fetchNews()).rejects.toThrow('503')
    })

    it.each([
      ['배열이 아님', { ids: [1] }],
      ['숫자가 아닌 항목', ['a', 'b']],
      ['빈 배열', []],
    ])('%s', async (_name, body) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(body))
      await expect(fetchNews()).rejects.toThrow()
    })
  })
})

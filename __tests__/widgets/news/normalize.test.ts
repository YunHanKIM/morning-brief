import { normalizeNews } from '../../../src/widgets/news/normalize'

const raw = (stories: Array<Record<string, unknown>>) =>
  ({ stories }) as Parameters<typeof normalizeNews>[0]

const story = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  type: 'story',
  title: '제목',
  score: 10,
  url: 'https://example.com/a',
  ...extra,
})

const discussion = (id: number) => `https://news.ycombinator.com/item?id=${id}`

describe('normalizeNews', () => {
  it('제목·점수·링크와 토론 주소를 반환한다', () => {
    expect(normalizeNews(raw([story()]))).toEqual({
      items: [
        { id: 1, title: '제목', score: 10, url: 'https://example.com/a', discussionUrl: discussion(1) },
      ],
    })
  })

  it('입력 순서를 유지한다', () => {
    const result = normalizeNews(raw([story({ id: 3 }), story({ id: 1 }), story({ id: 2 })]))
    expect(result.items.map((i) => i.id)).toEqual([3, 1, 2])
  })

  it('링크가 없으면 토론 주소를 링크로 쓴다', () => {
    const result = normalizeNews(raw([story({ url: undefined })]))
    expect(result.items[0].url).toBe(discussion(1))
  })

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['file:', 'file:///etc/passwd'],
    ['ftp:', 'ftp://example.com/x'],
    ['주소 형식이 아님', 'not a url'],
    ['빈 문자열', ''],
  ])('http(s)가 아닌 링크는 토론 주소로 바꾼다: %s', (_name, url) => {
    const result = normalizeNews(raw([story({ url })]))
    expect(result.items[0].url).toBe(discussion(1))
  })

  it.each([['http://example.com/a'], ['https://example.com/a?x=1&y=2#z']])(
    'http(s) 링크 %s는 유지한다',
    (url) => {
      expect(normalizeNews(raw([story({ url })])).items[0].url).toBe(url)
    },
  )

  it.each([
    ['삭제됨', { deleted: true }],
    ['dead', { dead: true }],
    ['story가 아님(job)', { type: 'job' }],
    ['story가 아님(poll)', { type: 'poll' }],
  ])('걸러내는 글: %s', (_name, extra) => {
    const result = normalizeNews(raw([story({ id: 1 }), story({ id: 2, ...extra })]))
    expect(result.items.map((i) => i.id)).toEqual([1])
  })

  it('제목은 가공하지 않고 텍스트 그대로 둔다 (렌더 쪽이 텍스트로만 그린다)', () => {
    const title = '<img src=x onerror=alert(1)> & "quotes"'
    expect(normalizeNews(raw([story({ title })])).items[0].title).toBe(title)
  })

  it('걸러낸 뒤 앞에서 5건만 남긴다 (걸러진 만큼 뒤의 글이 올라온다)', () => {
    const stories = [1, 2, 3, 4, 5, 6, 7].map((id) => story({ id, ...(id === 2 ? { type: 'job' } : {}) }))
    const result = normalizeNews(raw(stories))
    expect(result.items.map((i) => i.id)).toEqual([1, 3, 4, 5, 6])
  })

  it('걸러진 뒤 5건이 안 되면 있는 만큼만 반환한다', () => {
    const result = normalizeNews(raw([story({ id: 1 }), story({ id: 2, dead: true })]))
    expect(result.items.map((i) => i.id)).toEqual([1])
  })
})

/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import { NewsCard } from '../../src/components/NewsCard'
import type { NewsData } from '../../src/widgets/news/normalize'
import type { WidgetResult } from '../../src/widgets/types'

const data: NewsData = {
  items: [
    {
      id: 1,
      title: 'Type-safe HTML templating in Zig',
      score: 134,
      url: 'https://lalinsky.com/zig.html',
      discussionUrl: 'https://news.ycombinator.com/item?id=1',
    },
    {
      id: 2,
      title: 'Ask HN: 포트폴리오 조언',
      score: 7,
      url: 'https://news.ycombinator.com/item?id=2',
      discussionUrl: 'https://news.ycombinator.com/item?id=2',
    },
  ],
}
const ok: WidgetResult<NewsData> = { status: 'ok', data }

describe('NewsCard', () => {
  it('카드는 "개발 뉴스"라는 이름의 영역(region)으로 식별된다', () => {
    render(<NewsCard result={ok} />)
    expect(screen.getByRole('region', { name: '개발 뉴스' })).toBeTruthy()
  })

  it('ok 결과면 순서대로 제목과 점수를 목록으로 보여준다', () => {
    render(<NewsCard result={ok} />)
    const list = screen.getByRole('list', { name: '개발 뉴스 목록' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain('Type-safe HTML templating in Zig')
    expect(items[0].textContent).toContain('134점')
    expect(items[1].textContent).toContain('7점')
  })

  it('제목은 새 탭으로 열리는 링크이고 noopener noreferrer가 붙는다', () => {
    render(<NewsCard result={ok} />)
    const link = screen.getByRole('link', { name: 'Type-safe HTML templating in Zig' })
    expect(link.getAttribute('href')).toBe('https://lalinsky.com/zig.html')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('토론 링크도 새 탭으로 열리고 어떤 글의 토론인지 이름에 드러난다', () => {
    render(<NewsCard result={ok} />)
    const link = screen.getByRole('link', { name: 'Type-safe HTML templating in Zig 토론' })
    expect(link.getAttribute('href')).toBe('https://news.ycombinator.com/item?id=1')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('제목의 HTML은 해석하지 않고 글자 그대로 보여준다', () => {
    const evil = '<img src=x onerror=alert(1)><script>alert(1)</script>'
    const { container } = render(
      <NewsCard result={{ status: 'ok', data: { items: [{ ...data.items[0], title: evil }] } }} />,
    )
    expect(screen.getByText(evil)).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 목록은 숨긴다', () => {
    render(<NewsCard result={{ status: 'error', message: 'boom' }} />)
    expect(screen.getByRole('alert').textContent).toContain('boom')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('loading이면 로딩 상태를 보여준다', () => {
    render(<NewsCard loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it.each([
    ['ok 결과', ok],
    ['error 결과', { status: 'error', message: 'boom' } as WidgetResult<NewsData>],
  ])('loading이면 함께 받은 %s는 숨기고 로딩만 보여준다', (_name, result) => {
    render(<NewsCard result={result} loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('loading이 아닌데 결과가 없으면 빈 상태를 보여준다', () => {
    render(<NewsCard />)
    expect(screen.getByRole('status').textContent).toContain('뉴스 정보가 없습니다')
  })

  it('ok인데 글이 하나도 없으면 빈 상태를 보여준다', () => {
    render(<NewsCard result={{ status: 'ok', data: { items: [] } }} />)
    expect(screen.getByRole('status').textContent).toContain('표시할 뉴스가 없습니다')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('출처가 Hacker News임을 밝힌다', () => {
    render(<NewsCard result={ok} />)
    expect(screen.getByText(/Hacker News/)).toBeTruthy()
  })
})

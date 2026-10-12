/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { QuoteCard } from '../../src/components/QuoteCard'
import type { QuoteData } from '../../src/widgets/quote/normalize'
import type { WidgetResult } from '../../src/widgets/types'

const data: QuoteData = {
  quote: 'Those who know, do. Those that understand, teach.',
  author: 'Aristotle',
  translation: '아는 사람은 행동하고, 이해하는 사람은 가르칩니다.',
}
const ok: WidgetResult<QuoteData> = { status: 'ok', data }

describe('QuoteCard', () => {
  it('카드는 "오늘의 한마디"라는 이름의 영역(region)으로 식별된다', () => {
    render(<QuoteCard result={ok} />)
    expect(screen.getByRole('region', { name: '오늘의 한마디' })).toBeTruthy()
  })

  it('영어 원문을 인용문으로, 저자와 함께 보여준다', () => {
    render(<QuoteCard result={ok} />)
    const quote = screen.getByText('Those who know, do. Those that understand, teach.')
    expect(quote.closest('blockquote')).toBeTruthy()
    expect(quote.getAttribute('lang')).toBe('en')
    expect(screen.getByText(/Aristotle/)).toBeTruthy()
  })

  it('저자 이름까지 영어로 읽히도록 인용문 전체가 영어(lang=en)로 표시된다', () => {
    render(<QuoteCard result={ok} />)
    const quote = screen.getByText('Those who know, do. Those that understand, teach.')
    expect(quote.closest('blockquote')?.getAttribute('lang')).toBe('en')
  })

  it('한글 번역을 "자동 번역"이라고 밝히고 한국어로 표시한다', () => {
    render(<QuoteCard result={ok} />)
    const translation = screen.getByText('아는 사람은 행동하고, 이해하는 사람은 가르칩니다.')
    expect(translation.getAttribute('lang')).toBe('ko')
    expect(screen.getByText('자동 번역')).toBeTruthy()
  })

  it('번역이 없으면 영어만 보여주고 번역을 못 불러왔다고 알린다', () => {
    render(<QuoteCard result={{ status: 'ok', data: { ...data, translation: null } }} />)
    expect(screen.getByText('Those who know, do. Those that understand, teach.')).toBeTruthy()
    expect(screen.queryByText('자동 번역')).toBeNull()
    expect(screen.getByText(/번역을 불러오지 못해/)).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  describe('출처 표기', () => {
    it('ZenQuotes 출처를 새 탭 링크로 밝힌다', () => {
      render(<QuoteCard result={ok} />)
      const link = screen.getByRole('link', { name: 'ZenQuotes' })
      expect(link.getAttribute('href')).toBe('https://zenquotes.io/')
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('번역이 있으면 MyMemory 출처도 밝힌다', () => {
      render(<QuoteCard result={ok} />)
      const link = screen.getByRole('link', { name: 'MyMemory' })
      expect(link.getAttribute('href')).toBe('https://mymemory.translated.net/')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('번역이 없으면 MyMemory 출처는 표시하지 않는다', () => {
      render(<QuoteCard result={{ status: 'ok', data: { ...data, translation: null } }} />)
      expect(screen.queryByRole('link', { name: 'MyMemory' })).toBeNull()
      expect(screen.getByRole('link', { name: 'ZenQuotes' })).toBeTruthy()
    })
  })

  it('HTML은 해석하지 않고 글자 그대로 보여준다', () => {
    const evil = '<img src=x onerror=alert(1)>'
    const { container } = render(
      <QuoteCard result={{ status: 'ok', data: { quote: evil, author: '<b>x</b>', translation: evil } }} />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 인용문은 숨긴다', () => {
    render(<QuoteCard result={{ status: 'error', message: 'boom' }} />)
    expect(screen.getByRole('alert').textContent).toContain('boom')
    expect(screen.queryByRole('blockquote')).toBeNull()
    expect(screen.queryByText('Aristotle')).toBeNull()
  })

  it('loading이면 로딩 상태를 보여준다', () => {
    render(<QuoteCard loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it.each([
    ['ok 결과', ok],
    ['error 결과', { status: 'error', message: 'boom' } as WidgetResult<QuoteData>],
  ])('loading이면 함께 받은 %s는 숨기고 로딩만 보여준다', (_name, result) => {
    render(<QuoteCard result={result} loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Aristotle')).toBeNull()
  })

  it('loading이 아닌데 결과가 없으면 빈 상태를 보여준다', () => {
    render(<QuoteCard />)
    expect(screen.getByRole('status').textContent).toContain('명언 정보가 없습니다')
  })
})

/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import { HistoryCard } from '../../src/components/HistoryCard'

const dates = ['2026-10-13', '2026-10-12', '2026-10-11']

describe('HistoryCard', () => {
  it('카드는 "지난 브리핑"이라는 이름의 영역(region)으로 식별된다', () => {
    render(<HistoryCard history={{ status: 'ok', dates }} />)
    expect(screen.getByRole('region', { name: '지난 브리핑' })).toBeTruthy()
  })

  it('저장된 날짜를 최신순 그대로 링크 목록으로 보여준다', () => {
    render(<HistoryCard history={{ status: 'ok', dates }} />)

    const list = screen.getByRole('list', { name: '지난 브리핑 목록' })
    const links = within(list).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual(dates)
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/?date=2026-10-13',
      '/?date=2026-10-12',
      '/?date=2026-10-11',
    ])
  })

  it('지금 보고 있는 날짜는 현재 페이지로 표시한다', () => {
    render(<HistoryCard history={{ status: 'ok', dates }} current="2026-10-12" />)

    expect(screen.getByRole('link', { name: '2026-10-12' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: '2026-10-13' }).getAttribute('aria-current')).toBeNull()
  })

  it('목록에 없는 날짜를 보고 있으면 현재 표시는 없다', () => {
    render(<HistoryCard history={{ status: 'ok', dates }} current="2025-01-01" />)

    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('aria-current')).toBeNull()
    }
  })

  it('저장된 것이 없으면 빈 상태를 보여준다', () => {
    render(<HistoryCard history={{ status: 'ok', dates: [] }} />)

    expect(screen.getByRole('status').textContent).toContain('저장된 브리핑이 없습니다')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('불러오지 못했으면 오류를 알림으로 보여준다 (이유는 보여주지 않는다)', () => {
    render(<HistoryCard history={{ status: 'error' }} />)

    expect(screen.getByRole('alert').textContent).toContain('지난 브리핑을 불러오지 못했습니다')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('저장소를 쓸 수 없는 환경이면 아무것도 그리지 않는다', () => {
    const { container } = render(<HistoryCard history={{ status: 'unavailable' }} />)

    expect(container.innerHTML).toBe('')
  })
})

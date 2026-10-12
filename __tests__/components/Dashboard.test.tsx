/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../../src/components/Dashboard'

describe('Dashboard', () => {
  it('제목과 날씨 카드를 보여준다', () => {
    render(
      <Dashboard
        results={{
          weather: {
            status: 'ok',
            data: { temperature: 18.4, condition: '맑음', high: 22, low: 11 },
          },
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    expect(screen.getByText('18.4°')).toBeTruthy()
  })

  it('날씨 위젯이 실패해도 대시보드는 렌더되고 오류가 표시된다', () => {
    render(<Dashboard results={{ weather: { status: 'error', message: 'boom' } }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('boom')
  })

  it('loading이면 날씨 카드가 로딩 상태다', () => {
    render(<Dashboard results={{}} loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it('최종 결과에 날씨가 없으면 로딩이 아니라 빈 상태다', () => {
    render(<Dashboard results={{}} />)
    expect(screen.getByRole('status').textContent).toContain('날씨 정보가 없습니다')
  })
})

/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Dashboard } from '../../src/components/Dashboard'
import { loadExchange } from '../../src/components/exchangeAction'

jest.mock('../../src/components/exchangeAction', () => ({ loadExchange: jest.fn() }))

const weather = {
  status: 'ok' as const,
  data: { temperature: 18.4, condition: '맑음', high: 22, low: 11 },
}
const exchange = {
  status: 'ok' as const,
  data: { base: 'USD' as const, quote: 'KRW' as const, rate: 1341.49, date: '2026-10-09' },
}

const statusOf = (name: string) =>
  within(screen.getByRole('region', { name })).getByRole('status').textContent

describe('Dashboard', () => {
  it('제목과 날씨·환율 카드를 보여준다', () => {
    render(<Dashboard results={{ weather, exchange }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('날씨 위젯이 실패해도 대시보드와 환율 카드는 렌더된다', () => {
    render(<Dashboard results={{ weather: { status: 'error', message: 'boom' }, exchange }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    const alert = within(screen.getByRole('region', { name: '날씨' })).getByRole('alert')
    expect(alert.textContent).toContain('boom')
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('loading이면 두 카드 모두 로딩 상태다', () => {
    render(<Dashboard results={{}} loading />)
    expect(statusOf('날씨')).toContain('불러오는 중')
    expect(statusOf('환율')).toContain('불러오는 중')
  })

  it('최종 결과에 위젯이 없으면 로딩이 아니라 빈 상태다', () => {
    render(<Dashboard results={{}} />)
    expect(statusOf('날씨')).toContain('날씨 정보가 없습니다')
    expect(statusOf('환율')).toContain('환율 정보가 없습니다')
  })

  it('currency를 환율 카드의 선택값으로 넘긴다', () => {
    render(<Dashboard results={{}} currency="EUR" />)
    expect((screen.getByLabelText('받는 통화') as HTMLSelectElement).value).toBe('EUR')
  })

  it('통화를 바꿔도 환율만 갱신되고 날씨 카드는 그대로다', async () => {
    jest.mocked(loadExchange).mockResolvedValue({
      status: 'ok',
      data: { base: 'USD', quote: 'JPY', rate: 158.25, date: '2026-10-09' },
    })
    render(<Dashboard results={{ weather, exchange }} />)
    const weatherCard = screen.getByRole('region', { name: '날씨' })

    fireEvent.change(screen.getByLabelText('받는 통화'), { target: { value: 'JPY' } })

    expect(await screen.findByText('1 USD = 158.25 JPY')).toBeTruthy()
    expect(loadExchange).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('region', { name: '날씨' })).toBe(weatherCard)
    expect(within(weatherCard).getByText('18.4°')).toBeTruthy()
  })
})

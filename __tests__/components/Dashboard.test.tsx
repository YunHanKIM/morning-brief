/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { loadWeatherAction } from '../../src/components/cityActions'
import { Dashboard } from '../../src/components/Dashboard'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

jest.mock('../../src/components/cityActions', () => ({
  searchCitiesAction: jest.fn(),
  loadWeatherAction: jest.fn(),
}))

const seoul = POPULAR_CITIES[0]

const weather = {
  status: 'ok' as const,
  data: { temperature: 18.4, condition: '맑음', high: 22, low: 11 },
}
const exchange = {
  status: 'ok' as const,
  data: {
    base: 'USD' as const,
    date: '2026-10-09',
    rates: { KRW: 1341.49, JPY: 158.25, EUR: 0.89238, CNY: 6.6921, GBP: 0.75641, AUD: 1.4324, CAD: 1.4226, CHF: 0.83107 },
  },
}

const news = {
  status: 'ok' as const,
  data: {
    items: [
      {
        id: 1,
        title: 'Zig 템플릿',
        score: 134,
        url: 'https://example.com/zig',
        discussionUrl: 'https://news.ycombinator.com/item?id=1',
      },
    ],
  },
}

const quote = {
  status: 'ok' as const,
  data: { quote: 'Stay hungry.', author: 'Steve', translation: '계속 갈망하라.' },
}

const statusOf = (name: string) =>
  within(screen.getByRole('region', { name })).getByRole('status').textContent

describe('Dashboard', () => {
  it('제목과 날씨·환율 카드를 보여준다', () => {
    render(<Dashboard city={seoul} results={{ weather, exchange }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('날씨 위젯이 실패해도 대시보드와 환율 카드는 렌더된다', () => {
    render(<Dashboard city={seoul} results={{ weather: { status: 'error', message: 'boom' }, exchange }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Morning Brief' })).toBeTruthy()
    const alert = within(screen.getByRole('region', { name: '날씨' })).getByRole('alert')
    expect(alert.textContent).toContain('boom')
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('loading이면 두 카드 모두 로딩 상태다', () => {
    render(<Dashboard city={seoul} results={{}} loading />)
    expect(statusOf('날씨')).toContain('불러오는 중')
    expect(statusOf('환율')).toContain('불러오는 중')
  })

  it('최종 결과에 위젯이 없으면 로딩이 아니라 빈 상태다', () => {
    render(<Dashboard city={seoul} results={{}} />)
    expect(statusOf('날씨')).toContain('날씨 정보가 없습니다')
    expect(statusOf('환율')).toContain('환율 정보가 없습니다')
  })

  it('currency를 환율 카드의 선택값으로 넘긴다', () => {
    render(<Dashboard results={{}} currency="EUR" />)
    expect((screen.getByLabelText('받는 통화') as HTMLSelectElement).value).toBe('EUR')
  })

  it('통화를 바꿔도 환율만 바뀌고 날씨 카드는 그대로이며 추가 조회가 없다', () => {
    // jsdom에는 fetch가 없어 가짜를 심고, 호출되지 않는지 본다
    const originalFetch = globalThis.fetch
    const fetchMock = jest.fn()
    globalThis.fetch = fetchMock
    render(<Dashboard city={seoul} results={{ weather, exchange }} />)
    const weatherCard = screen.getByRole('region', { name: '날씨' })

    fireEvent.change(screen.getByLabelText('받는 통화'), { target: { value: 'JPY' } })

    expect(screen.getByText('1 USD = 158.25 JPY')).toBeTruthy()
    expect(screen.getByRole('region', { name: '날씨' })).toBe(weatherCard)
    expect(within(weatherCard).getByText('18.4°')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    globalThis.fetch = originalFetch
  })

  it('저장된 도시가 없으면 날씨 카드에 도시 선택 안내가 보이고 환율은 그대로 보인다', () => {
    render(<Dashboard city={null} results={{ exchange }} />)
    expect(within(screen.getByRole('region', { name: '날씨' })).getByText('도시를 선택하세요')).toBeTruthy()
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('도시를 바꿔도 날씨만 갱신되고 환율 카드는 그대로다', async () => {
    jest.mocked(loadWeatherAction).mockResolvedValue({
      status: 'ok',
      data: { temperature: 23, condition: '흐림', high: 25, low: 22 },
    })
    render(<Dashboard city={seoul} results={{ weather, exchange }} />)
    const exchangeCard = screen.getByRole('region', { name: '환율' })

    fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
    fireEvent.click(screen.getByRole('button', { name: '제주' }))

    expect(await screen.findByText('23°')).toBeTruthy()
    expect(screen.getByRole('region', { name: '환율' })).toBe(exchangeCard)
    expect(within(exchangeCard).getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('날씨·환율·개발 뉴스 카드를 모두 보여준다', () => {
    render(<Dashboard city={seoul} results={{ weather, exchange, news }} />)
    expect(screen.getByRole('region', { name: '날씨' })).toBeTruthy()
    expect(screen.getByRole('region', { name: '환율' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Zig 템플릿' })).toBeTruthy()
  })

  it('뉴스가 실패해도 나머지 카드는 렌더된다', () => {
    render(
      <Dashboard
        city={seoul}
        results={{ weather, exchange, news: { status: 'error', message: 'boom' } }}
      />,
    )
    expect(within(screen.getByRole('region', { name: '개발 뉴스' })).getByRole('alert').textContent).toContain('boom')
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
  })

  it('loading이면 뉴스 카드도 로딩 상태다', () => {
    render(<Dashboard city={seoul} results={{}} loading />)
    expect(statusOf('개발 뉴스')).toContain('불러오는 중')
  })

  it('오늘의 한마디 카드까지 모든 카드를 보여준다', () => {
    render(<Dashboard city={seoul} results={{ weather, exchange, news, quote }} />)
    expect(screen.getByRole('region', { name: '오늘의 한마디' })).toBeTruthy()
    expect(screen.getByText('Stay hungry.')).toBeTruthy()
    expect(screen.getByText('계속 갈망하라.')).toBeTruthy()
  })

  it('명언이 실패해도 나머지 카드는 렌더된다', () => {
    render(
      <Dashboard
        city={seoul}
        results={{ weather, exchange, news, quote: { status: 'error', message: 'boom' } }}
      />,
    )
    const alert = within(screen.getByRole('region', { name: '오늘의 한마디' })).getByRole('alert')
    expect(alert.textContent).toContain('boom')
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Zig 템플릿' })).toBeTruthy()
  })

  it('loading이면 명언 카드도 로딩 상태다', () => {
    render(<Dashboard city={seoul} results={{}} loading />)
    expect(statusOf('오늘의 한마디')).toContain('불러오는 중')
  })
})

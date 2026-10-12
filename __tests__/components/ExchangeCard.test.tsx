/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ExchangeCard } from '../../src/components/ExchangeCard'
import { CURRENCIES } from '../../src/widgets/exchange/currencies'
import type { ExchangeData } from '../../src/widgets/exchange/normalize'
import type { WidgetResult } from '../../src/widgets/types'

const data: ExchangeData = {
  base: 'USD',
  date: '2026-10-09',
  rates: {
    KRW: 1341.49,
    JPY: 158.25,
    EUR: 0.89238,
    CNY: 6.6921,
    GBP: 0.75641,
    AUD: 1.4324,
    CAD: 1.4226,
    CHF: 0.83107,
  },
}
const ok: WidgetResult<ExchangeData> = { status: 'ok', data }

const select = () => screen.getByLabelText('받는 통화') as HTMLSelectElement
const choose = (code: string) => fireEvent.change(select(), { target: { value: code } })

describe('ExchangeCard', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('카드는 "환율"이라는 이름의 영역(region)으로 식별된다', () => {
    render(<ExchangeCard selected="KRW" result={ok} />)
    expect(screen.getByRole('region', { name: '환율' })).toBeTruthy()
  })

  it('ok 결과면 선택한 통화의 환율과 기준 일자를 보여준다', () => {
    render(<ExchangeCard selected="KRW" result={ok} />)
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
    expect(screen.getByText('기준 일자 2026-10-09 (마지막 영업일)')).toBeTruthy()
  })

  it('처음 선택값이 JPY면 JPY 환율을 보여준다', () => {
    render(<ExchangeCard selected="JPY" result={ok} />)
    expect(screen.getByText('1 USD = 158.25 JPY')).toBeTruthy()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 환율은 숨긴다', () => {
    render(<ExchangeCard selected="KRW" result={{ status: 'error', message: 'boom' }} />)
    expect(screen.getByRole('alert').textContent).toContain('boom')
    expect(screen.queryByText(/1 USD =/)).toBeNull()
  })

  it('loading이면 로딩 상태를 보여준다', () => {
    render(<ExchangeCard selected="KRW" loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it('loading이 아닌데 결과가 없으면 빈 상태를 보여준다', () => {
    render(<ExchangeCard selected="KRW" />)
    expect(screen.getByRole('status').textContent).toContain('환율 정보가 없습니다')
  })

  describe('통화 선택 상자', () => {
    it('허용 통화 8개를 코드와 한글 이름으로 보여준다', () => {
      render(<ExchangeCard selected="KRW" result={ok} />)
      const options = within(select()).getAllByRole('option')
      expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual([...CURRENCIES])
      expect(options[1].textContent).toBe('JPY · 일본 엔')
    })

    it('선택된 통화가 현재 선택값이다', () => {
      render(<ExchangeCard selected="JPY" result={ok} />)
      expect(select().value).toBe('JPY')
    })

    it('폼과 보기 버튼이 없다 (페이지를 다시 불러오지 않는다)', () => {
      render(<ExchangeCard selected="KRW" result={ok} />)
      expect(select().form).toBeNull()
      expect(screen.queryByRole('button', { name: '보기' })).toBeNull()
    })

    it('처음 로딩 중에는 비활성화되고 끝나면 활성화된다', () => {
      const { rerender } = render(<ExchangeCard selected="KRW" loading />)
      expect(select().disabled).toBe(true)
      rerender(<ExchangeCard selected="KRW" result={ok} />)
      expect(select().disabled).toBe(false)
    })
  })

  describe('통화를 바꾸면', () => {
    it('기다림 없이 바로 새 환율을 보여준다 (불러오는 중이 뜨지 않는다)', () => {
      // jsdom에는 fetch가 없어 가짜를 심고, 호출되지 않는지 본다
      const fetchMock = jest.fn()
      globalThis.fetch = fetchMock
      render(<ExchangeCard selected="KRW" result={ok} />)

      choose('JPY')

      expect(screen.getByText('1 USD = 158.25 JPY')).toBeTruthy()
      expect(screen.queryByText('1 USD = 1341.49 KRW')).toBeNull()
      expect(screen.queryByRole('status')).toBeNull()
      expect(select().value).toBe('JPY')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('여러 번 바꿔도 마지막 선택의 환율을 보여준다', () => {
      render(<ExchangeCard selected="KRW" result={ok} />)

      choose('JPY')
      choose('EUR')

      expect(screen.getByText('1 USD = 0.89238 EUR')).toBeTruthy()
    })

    it('주소의 ?to=를 새로고침 없이 갱신한다', () => {
      render(<ExchangeCard selected="KRW" result={ok} />)

      choose('JPY')

      expect(new URLSearchParams(window.location.search).get('to')).toBe('JPY')
    })

    it('오류 상태에서 바꿔도 오류가 유지된다', () => {
      render(<ExchangeCard selected="KRW" result={{ status: 'error', message: 'boom' }} />)

      choose('JPY')

      expect(screen.getByRole('alert').textContent).toContain('boom')
    })
  })
})

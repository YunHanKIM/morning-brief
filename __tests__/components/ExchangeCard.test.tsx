/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ExchangeCard } from '../../src/components/ExchangeCard'
import { loadExchange } from '../../src/components/exchangeAction'
import { CURRENCIES } from '../../src/widgets/exchange/currencies'
import type { ExchangeData } from '../../src/widgets/exchange/normalize'
import type { WidgetResult } from '../../src/widgets/types'

jest.mock('../../src/components/exchangeAction', () => ({ loadExchange: jest.fn() }))
const loadExchangeMock = jest.mocked(loadExchange)

const krw: ExchangeData = { base: 'USD', quote: 'KRW', rate: 1341.49, date: '2026-10-09' }
const jpy: ExchangeData = { base: 'USD', quote: 'JPY', rate: 158.25, date: '2026-10-09' }
const eur: ExchangeData = { base: 'USD', quote: 'EUR', rate: 0.89238, date: '2026-10-09' }
const ok = (data: ExchangeData): WidgetResult<ExchangeData> => ({ status: 'ok', data })

const select = () => screen.getByLabelText('받는 통화') as HTMLSelectElement
const choose = (code: string) => fireEvent.change(select(), { target: { value: code } })

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ExchangeCard', () => {
  beforeEach(() => {
    loadExchangeMock.mockReset()
    window.history.replaceState(null, '', '/')
  })

  it('카드는 "환율"이라는 이름의 영역(region)으로 식별된다', () => {
    render(<ExchangeCard selected="KRW" result={ok(krw)} />)
    expect(screen.getByRole('region', { name: '환율' })).toBeTruthy()
  })

  it('ok 결과면 환율과 기준 일자를 보여준다', () => {
    render(<ExchangeCard selected="KRW" result={ok(krw)} />)
    expect(screen.getByText('1 USD = 1341.49 KRW')).toBeTruthy()
    expect(screen.getByText('기준 일자 2026-10-09 (마지막 영업일)')).toBeTruthy()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 환율은 숨긴다', () => {
    render(<ExchangeCard selected="KRW" result={{ status: 'error', message: 'boom' }} />)
    expect(screen.getByRole('alert').textContent).toContain('boom')
    expect(screen.queryByText('1 USD = 1341.49 KRW')).toBeNull()
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
      render(<ExchangeCard selected="KRW" />)
      const options = within(select()).getAllByRole('option')
      expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual([...CURRENCIES])
      expect(options[1].textContent).toBe('JPY · 일본 엔')
    })

    it('선택된 통화가 현재 선택값이다', () => {
      render(<ExchangeCard selected="JPY" />)
      expect(select().value).toBe('JPY')
    })

    it('페이지 전체를 다시 불러오는 폼과 보기 버튼이 없다', () => {
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)
      expect(select().form).toBeNull()
      expect(screen.queryByRole('button', { name: '보기' })).toBeNull()
    })

    it('처음 로딩 중에는 선택 상자가 비활성화되고 끝나면 활성화된다', () => {
      const { rerender } = render(<ExchangeCard selected="KRW" loading />)
      expect(select().disabled).toBe(true)
      rerender(<ExchangeCard selected="KRW" result={ok(krw)} />)
      expect(select().disabled).toBe(false)
    })
  })

  describe('통화를 바꾸면', () => {
    it('그 통화로 환율만 다시 조회해 새 환율을 보여준다', async () => {
      loadExchangeMock.mockResolvedValue(ok(jpy))
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)

      choose('JPY')

      expect(loadExchangeMock).toHaveBeenCalledTimes(1)
      expect(loadExchangeMock).toHaveBeenCalledWith('JPY')
      expect(await screen.findByText('1 USD = 158.25 JPY')).toBeTruthy()
      expect(select().value).toBe('JPY')
    })

    it('조회하는 동안 불러오는 중을 보여주고 끝나면 지운다', async () => {
      const pending = deferred<WidgetResult<ExchangeData>>()
      loadExchangeMock.mockReturnValue(pending.promise)
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)

      choose('JPY')

      expect((await screen.findByRole('status')).textContent).toContain('불러오는 중')
      await act(async () => pending.resolve(ok(jpy)))
      await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
      expect(screen.getByText('1 USD = 158.25 JPY')).toBeTruthy()
    })

    it('주소의 ?to=를 새로고침 없이 갱신한다', async () => {
      loadExchangeMock.mockResolvedValue(ok(jpy))
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)

      choose('JPY')

      await screen.findByText('1 USD = 158.25 JPY')
      expect(new URLSearchParams(window.location.search).get('to')).toBe('JPY')
    })

    it('연속으로 바꿔 응답 순서가 뒤바뀌어도 마지막 선택만 보여준다', async () => {
      const first = deferred<WidgetResult<ExchangeData>>()
      const second = deferred<WidgetResult<ExchangeData>>()
      loadExchangeMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)

      choose('JPY')
      choose('EUR')
      await act(async () => second.resolve(ok(eur)))

      // 먼저 보낸 JPY 요청이 아직 끝나지 않았어도 최신 EUR 결과가 바로 보여야 한다
      expect(await screen.findByText('1 USD = 0.89238 EUR')).toBeTruthy()
      expect(screen.queryByRole('status')).toBeNull()

      await act(async () => first.resolve(ok(jpy)))

      expect(screen.getByText('1 USD = 0.89238 EUR')).toBeTruthy()
      expect(screen.queryByText('1 USD = 158.25 JPY')).toBeNull()
      expect(select().value).toBe('EUR')
    })

    it('조회 함수가 실패하면 오류를 알림으로 보여주고 다시 선택할 수 있다', async () => {
      loadExchangeMock.mockRejectedValue(new Error('network'))
      render(<ExchangeCard selected="KRW" result={ok(krw)} />)

      choose('JPY')

      expect((await screen.findByRole('alert')).textContent).toContain('환율을 가져오지 못했습니다')
      expect(select().disabled).toBe(false)
    })
  })
})

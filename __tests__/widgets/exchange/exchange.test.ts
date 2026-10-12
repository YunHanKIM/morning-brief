import { runWidget } from '../../../src/widgets/runWidget'
import { createExchangeWidget } from '../../../src/widgets/exchange'

describe('createExchangeWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('이름은 exchange이고 runWidget으로 ok 결과를 낸다 (기본 KRW)', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates: { KRW: 1341.49 } }),
        { status: 200 },
      ),
    )

    const widget = createExchangeWidget()
    expect(widget.name).toBe('exchange')
    expect(await runWidget(widget)).toEqual({
      status: 'ok',
      data: { base: 'USD', quote: 'KRW', rate: 1341.49, date: '2026-10-09' },
    })
  })

  it('선택한 통화로 조회한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates: { JPY: 158.25 } }),
        { status: 200 },
      ),
    )

    const result = await runWidget(createExchangeWidget('JPY'))

    expect(new URL(String(spy.mock.calls[0][0])).searchParams.get('symbols')).toBe('JPY')
    expect(result).toEqual({
      status: 'ok',
      data: { base: 'USD', quote: 'JPY', rate: 158.25, date: '2026-10-09' },
    })
  })

  it('API가 실패하면 error 결과로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))

    const result = await runWidget(createExchangeWidget())
    expect(result.status).toBe('error')
  })
})

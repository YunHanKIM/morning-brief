import { runWidget } from '../../../src/widgets/runWidget'
import { exchangeWidget } from '../../../src/widgets/exchange'

describe('exchangeWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('이름은 exchange이고 runWidget으로 ok 결과를 낸다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates: { KRW: 1341.49 } }),
        { status: 200 },
      ),
    )

    expect(exchangeWidget.name).toBe('exchange')
    expect(await runWidget(exchangeWidget)).toEqual({
      status: 'ok',
      data: { rate: 1341.49, date: '2026-10-09' },
    })
  })

  it('API가 실패하면 error 결과로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))

    const result = await runWidget(exchangeWidget)
    expect(result.status).toBe('error')
  })
})

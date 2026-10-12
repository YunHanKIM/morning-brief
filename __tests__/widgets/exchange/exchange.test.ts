import { runWidget } from '../../../src/widgets/runWidget'
import { exchangeWidget } from '../../../src/widgets/exchange'

const rates = {
  KRW: 1341.49,
  JPY: 158.25,
  EUR: 0.89238,
  CNY: 6.6921,
  GBP: 0.75641,
  AUD: 1.4324,
  CAD: 1.4226,
  CHF: 0.83107,
}

describe('exchangeWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('이름은 exchange이고 runWidget으로 모든 통화의 환율을 ok로 낸다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-09', rates }), {
        status: 200,
      }),
    )

    expect(exchangeWidget.name).toBe('exchange')
    expect(await runWidget(exchangeWidget)).toEqual({
      status: 'ok',
      data: { base: 'USD', date: '2026-10-09', rates },
    })
  })

  it('API가 실패하면 error 결과로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 503 }))

    const result = await runWidget(exchangeWidget)
    expect(result.status).toBe('error')
  })
})

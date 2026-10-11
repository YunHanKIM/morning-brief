import { runWidget } from '../../src/widgets/runWidget'
import type { Widget } from '../../src/widgets/types'

const makeWidget = (overrides: Partial<Widget<number>> = {}): Widget<number> => ({
  name: 'test',
  fetch: async () => ({ value: 21 }),
  normalize: (raw) => (raw as { value: number }).value * 2,
  ...overrides,
})

describe('runWidget', () => {
  it('fetch 결과를 normalize해 ok 결과로 반환한다', async () => {
    const result = await runWidget(makeWidget())
    expect(result).toEqual({ status: 'ok', data: 42 })
  })

  it('fetch가 실패하면 error 결과로 반환하고 예외를 던지지 않는다', async () => {
    const result = await runWidget(
      makeWidget({ fetch: async () => { throw new Error('network down') } }),
    )
    expect(result).toEqual({ status: 'error', message: 'network down' })
  })

  it('normalize가 던지면 error 결과로 반환한다', async () => {
    const result = await runWidget(
      makeWidget({ normalize: () => { throw new Error('bad shape') } }),
    )
    expect(result).toEqual({ status: 'error', message: 'bad shape' })
  })

  it('Error가 아닌 값이 던져져도 문자열 메시지로 변환한다', async () => {
    const result = await runWidget(
      makeWidget({ fetch: async () => { throw 'boom' } }),
    )
    expect(result).toEqual({ status: 'error', message: 'boom' })
  })
})

import { runWidgets } from '../../src/widgets/runWidgets'
import type { Widget } from '../../src/widgets/types'

const makeWidget = (name: string, overrides: Partial<Widget<string>> = {}): Widget<string> => ({
  name,
  fetch: async () => name,
  normalize: (raw) => `${raw as string}-ok`,
  ...overrides,
})

describe('runWidgets', () => {
  it('모든 위젯 결과를 이름을 키로 모아 반환한다', async () => {
    const results = await runWidgets([makeWidget('a'), makeWidget('b')])
    expect(results).toEqual({
      a: { status: 'ok', data: 'a-ok' },
      b: { status: 'ok', data: 'b-ok' },
    })
  })

  it('한 위젯이 실패해도 나머지는 정상 결과로 반환한다', async () => {
    const results = await runWidgets([
      makeWidget('a'),
      makeWidget('b', { fetch: async () => { throw new Error('boom') } }),
      makeWidget('c'),
    ])
    expect(results).toEqual({
      a: { status: 'ok', data: 'a-ok' },
      b: { status: 'error', message: 'boom' },
      c: { status: 'ok', data: 'c-ok' },
    })
  })

  it('위젯을 순차가 아니라 병렬로 실행한다', async () => {
    const started: string[] = []
    const slow = (name: string) =>
      makeWidget(name, {
        fetch: async () => {
          started.push(name)
          await new Promise((resolve) => setTimeout(resolve, 20))
          return name
        },
      })
    const promise = runWidgets([slow('a'), slow('b'), slow('c')])
    await Promise.resolve()
    expect(started).toEqual(['a', 'b', 'c'])
    await promise
  })

  it('위젯이 없으면 빈 객체를 반환한다', async () => {
    expect(await runWidgets([])).toEqual({})
  })
})

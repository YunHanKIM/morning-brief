import { createMemoryStore } from '../../src/storage/memoryStore'
import { makeBrief } from '../../__fixtures__/brief'

describe('createMemoryStore', () => {
  it('저장한 브리핑을 날짜로 꺼낸다', async () => {
    const store = createMemoryStore()
    await store.save(makeBrief('2026-10-13'))

    expect(await store.get('2026-10-13')).toEqual(makeBrief('2026-10-13'))
  })

  it('없는 날짜는 null이다', async () => {
    expect(await createMemoryStore().get('2026-10-13')).toBeNull()
  })

  it('같은 날짜를 다시 저장하면 덮어쓰고 이력에 한 번만 나온다', async () => {
    const store = createMemoryStore()
    await store.save(makeBrief('2026-10-13'))
    await store.save({ ...makeBrief('2026-10-13'), city: null })

    expect((await store.get('2026-10-13'))?.city).toBeNull()
    expect(await store.listDates(30)).toEqual(['2026-10-13'])
  })

  it('이력은 최근 날짜부터, 개수 제한까지만 돌려준다', async () => {
    const store = createMemoryStore()
    for (const date of ['2026-10-11', '2026-10-13', '2026-10-12', '2026-09-30']) {
      await store.save(makeBrief(date))
    }

    expect(await store.listDates(30)).toEqual(['2026-10-13', '2026-10-12', '2026-10-11', '2026-09-30'])
    expect(await store.listDates(2)).toEqual(['2026-10-13', '2026-10-12'])
  })

  it('꺼낸 값을 바꿔도 저장된 값은 바뀌지 않는다', async () => {
    const store = createMemoryStore()
    await store.save(makeBrief())

    const first = await store.get('2026-10-13')
    if (first?.results.weather?.status === 'ok') first.results.weather.data.temperature = 99

    expect((await store.get('2026-10-13'))?.results.weather).toEqual(makeBrief().results.weather)
  })

  it.each([['날짜 형식이 아님', 'abc'], ['존재하지 않는 날짜', '2026-02-31'], ['키 조작 시도', 'x*']])(
    '잘못된 날짜는 거부한다: %s',
    async (_name, date) => {
      const store = createMemoryStore()
      await expect(store.get(date)).rejects.toThrow()
      await expect(store.save({ ...makeBrief(), date })).rejects.toThrow()
    },
  )
})

import { loadPageData, pageKey, type PageData } from '../../src/components/loadPageData'
import { createMemoryStore } from '../../src/storage/memoryStore'
import type { SnapshotStore } from '../../src/storage/snapshotStore'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'
import { makeBrief } from '../../__fixtures__/brief'
import { hostsOf, mockAllApis } from '../../__fixtures__/mockApis'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const seoul = POPULAR_CITIES[0]
const failing = (overrides: Partial<SnapshotStore>): SnapshotStore => ({
  ...createMemoryStore(),
  ...overrides,
})

describe('loadPageData', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('날짜가 없으면 오늘의 실시간 화면(live)', () => {
    it('위젯을 조회해 결과와 도시, 최근 이력을 돌려준다', async () => {
      mockAllApis()
      const store = createMemoryStore()
      await store.save(makeBrief('2026-10-12'))
      await store.save(makeBrief('2026-10-11'))

      const data = await loadPageData({ date: undefined, city: seoul, store })

      expect(data.mode).toBe('live')
      if (data.mode !== 'live') return
      expect(data.city).toEqual(seoul)
      expect(data.results.weather?.status).toBe('ok')
      expect(data.results.quote?.status).toBe('ok')
      expect(data.history).toEqual({ status: 'ok', dates: ['2026-10-12', '2026-10-11'] })
    })

    it('이력은 최근 14개까지만 요청한다', async () => {
      mockAllApis()
      const listDates = jest.fn().mockResolvedValue([])

      await loadPageData({ date: undefined, city: seoul, store: failing({ listDates }) })

      expect(listDates).toHaveBeenCalledWith(14)
    })

    it('저장소가 없으면 이력은 사용 불가(unavailable)이고 위젯은 그대로 보여준다', async () => {
      mockAllApis()

      const data = await loadPageData({ date: undefined, city: null, store: null })

      expect(data.mode).toBe('live')
      if (data.mode !== 'live') return
      expect(data.history).toEqual({ status: 'unavailable' })
      expect(data.results.exchange?.status).toBe('ok')
    })

    it('이력 조회가 실패해도 위젯은 보여주고 이력만 오류로 표시한다', async () => {
      mockAllApis()
      const store = failing({ listDates: async () => { throw new Error('boom') } })

      const data = await loadPageData({ date: undefined, city: seoul, store })

      expect(data.mode).toBe('live')
      if (data.mode !== 'live') return
      expect(data.history).toEqual({ status: 'error' })
      expect(data.results.weather?.status).toBe('ok')
    })

    it('저장된 브리핑을 읽지는 않는다', async () => {
      mockAllApis()
      const get = jest.fn()

      await loadPageData({ date: undefined, city: seoul, store: failing({ get }) })

      expect(get).not.toHaveBeenCalled()
    })
  })

  describe('날짜가 있으면 저장된 브리핑(snapshot)', () => {
    it('그날 저장된 결과와 도시를 돌려주고 위젯은 새로 조회하지 않는다', async () => {
      const spy = mockAllApis()
      const store = createMemoryStore()
      await store.save(makeBrief('2026-10-12'))

      const data = await loadPageData({ date: '2026-10-12', city: null, store })

      expect(data.mode).toBe('snapshot')
      if (data.mode !== 'snapshot') return
      expect(data.date).toBe('2026-10-12')
      expect(data.city).toEqual(makeBrief().city)
      expect(data.results.weather).toEqual(makeBrief().results.weather)
      expect(data.history).toEqual({ status: 'ok', dates: ['2026-10-12'] })
      expect(hostsOf(spy)).toEqual([])
    })

    it('방문자의 쿠키 도시가 아니라 저장된 도시를 쓴다', async () => {
      const store = createMemoryStore()
      await store.save({ ...makeBrief('2026-10-12'), city: POPULAR_CITIES[7] })

      const data = await loadPageData({ date: '2026-10-12', city: seoul, store })

      expect(data.mode === 'snapshot' && data.city).toEqual(POPULAR_CITIES[7])
    })
  })

  describe('보여줄 수 없으면 이유와 함께 missing', () => {
    it('저장된 브리핑이 없으면 not-found', async () => {
      const data = await loadPageData({ date: '2026-01-01', city: null, store: createMemoryStore() })

      expect(data).toMatchObject({ mode: 'missing', date: '2026-01-01', reason: 'not-found' })
    })

    it('저장소가 없으면 unavailable', async () => {
      const data = await loadPageData({ date: '2026-10-12', city: null, store: null })

      expect(data).toMatchObject({ mode: 'missing', reason: 'unavailable', history: { status: 'unavailable' } })
    })

    it('저장소 읽기가 실패하면 unavailable', async () => {
      const store = failing({ get: async () => { throw new Error('boom') } })

      const data = await loadPageData({ date: '2026-10-12', city: null, store })

      expect(data).toMatchObject({ mode: 'missing', reason: 'unavailable' })
    })

    it.each([
      ['형식이 아님', 'abc'],
      ['존재하지 않는 날짜', '2026-02-31'],
      ['와일드카드', '*'],
      ['빈 값', ''],
      ['여러 번 준 값(배열)', ['2026-10-12', '2026-10-11']],
    ])('잘못된 날짜는 저장소를 읽지 않고 invalid다: %s', async (_name, date) => {
      const get = jest.fn()

      const data = await loadPageData({ date, city: null, store: failing({ get }) })

      expect(data).toMatchObject({ mode: 'missing', reason: 'invalid' })
      expect(get).not.toHaveBeenCalled()
    })

    it('missing에서도 이력은 함께 돌려준다 (다른 날짜로 이동할 수 있게)', async () => {
      const store = createMemoryStore()
      await store.save(makeBrief('2026-10-12'))

      const data = await loadPageData({ date: '2026-01-01', city: null, store })

      expect(data.history).toEqual({ status: 'ok', dates: ['2026-10-12'] })
    })
  })

  it('어떤 경우에도 던지지 않는다', async () => {
    mockAllApis(['weather', 'exchange', 'news', 'quote'])
    const store = failing({
      get: async () => { throw new Error('x') },
      listDates: async () => { throw new Error('y') },
    })

    await expect(loadPageData({ date: undefined, city: seoul, store })).resolves.toMatchObject({ mode: 'live' })
    await expect(loadPageData({ date: '2026-10-12', city: seoul, store })).resolves.toMatchObject({ mode: 'missing' })
  })
})

describe('pageKey', () => {
  const history = { status: 'unavailable' } as const

  it.each<[string, PageData, string]>([
    ['오늘 화면', { mode: 'live', results: {}, city: null, history }, 'live'],
    ['저장된 브리핑', { mode: 'snapshot', date: '2026-10-12', results: {}, city: null, history }, 'snapshot:2026-10-12'],
    ['없는 날짜', { mode: 'missing', date: '2026-10-12', reason: 'not-found', history }, 'missing:not-found'],
    ['잘못된 날짜', { mode: 'missing', reason: 'invalid', history }, 'missing:invalid'],
  ])('%s의 키', (_name, data, key) => {
    expect(pageKey(data)).toBe(key)
  })

  it('다른 날짜의 저장본이나 오늘 화면으로 바뀌면 키가 달라진다 (카드가 새로 만들어지도록)', () => {
    const snapshot = (date: string): PageData => ({ mode: 'snapshot', date, results: {}, city: null, history })
    const live: PageData = { mode: 'live', results: {}, city: null, history }

    expect(pageKey(snapshot('2026-10-12'))).not.toBe(pageKey(snapshot('2026-10-13')))
    expect(pageKey(snapshot('2026-10-12'))).not.toBe(pageKey(live))
  })
})

import * as briefRoute from '../../src/app/api/brief/route'
import * as historyRoute from '../../src/app/api/brief/history/route'
import { sharedMemoryStore } from '../../src/storage/getSnapshotStore'
import { makeBrief } from '../../__fixtures__/brief'

const ENV_KEYS = [
  'SNAPSHOT_STORE',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const

const getBrief = (query = '') => briefRoute.GET(new Request(`http://localhost/api/brief${query}`))
const getHistory = (query = '') =>
  historyRoute.GET(new Request(`http://localhost/api/brief/history${query}`))

describe('공개 조회 API', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
    process.env.SNAPSHOT_STORE = 'memory'
    sharedMemoryStore.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  })

  it('GET만 내보낸다 (읽기 전용)', () => {
    expect(Object.keys(briefRoute).sort()).toEqual(['GET'])
    expect(Object.keys(historyRoute).sort()).toEqual(['GET'])
  })

  describe('GET /api/brief', () => {
    it('?date= 날짜의 브리핑을 돌려준다', async () => {
      await sharedMemoryStore.save(makeBrief('2026-10-12'))

      const response = await getBrief('?date=2026-10-12')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(makeBrief('2026-10-12'))
      expect(response.headers.get('cache-control')).toBe('no-store')
    })

    it('날짜가 없으면 한국 시간 기준 오늘의 브리핑이다', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-12T16:30:00Z'), doNotFake: ['nextTick', 'setImmediate'] }) // KST 10-13 01:30
      await sharedMemoryStore.save(makeBrief('2026-10-13'))
      await sharedMemoryStore.save(makeBrief('2026-10-12'))

      const body = await (await getBrief()).json()

      expect(body.date).toBe('2026-10-13')
    })

    it('없는 날짜는 404다', async () => {
      const response = await getBrief('?date=2026-01-01')

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'not found' })
    })

    it.each([
      ['형식이 아님', '?date=abc'],
      ['존재하지 않는 날짜', '?date=2026-02-31'],
      ['13월', '?date=2026-13-01'],
      ['와일드카드', '?date=*'],
      ['키 조작 시도', '?date=2026-10-13%0D%0AFLUSHALL'],
      ['경로 조작 시도', '?date=../etc/passwd'],
      ['빈 값', '?date='],
    ])('잘못된 날짜는 400이고 저장소를 건드리지 않는다: %s', async (_name, query) => {
      const get = jest.spyOn(sharedMemoryStore, 'get')

      const response = await getBrief(query)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'invalid date' })
      expect(get).not.toHaveBeenCalled()
    })

    it('날짜를 여러 번 주면 첫 번째 값만 쓴다', async () => {
      await sharedMemoryStore.save(makeBrief('2026-10-12'))

      const response = await getBrief('?date=2026-10-12&date=2026-10-13')

      expect((await response.json()).date).toBe('2026-10-12')
    })

    it('저장소 설정이 없으면 503이다', async () => {
      delete process.env.SNAPSHOT_STORE

      const response = await getBrief('?date=2026-10-12')

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: 'storage not configured' })
    })

    it('저장소 오류는 502이고 토큰·상세 내용을 드러내지 않는다', async () => {
      delete process.env.SNAPSHOT_STORE
      process.env.UPSTASH_REDIS_REST_URL = 'https://secret-host.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'very-secret-token'
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED very-secret-token'))

      const response = await getBrief('?date=2026-10-12')
      const text = await response.text()

      expect(response.status).toBe(502)
      expect(JSON.parse(text)).toEqual({ error: 'storage error' })
      expect(text).not.toContain('very-secret-token')
      expect(text).not.toContain('secret-host')
    })

    it('저장된 값이 깨져 있으면 502다', async () => {
      delete process.env.SNAPSHOT_STORE
      process.env.UPSTASH_REDIS_REST_URL = 'https://x.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok'
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ result: JSON.stringify({ hello: 'world' }) })),
      )

      expect((await getBrief('?date=2026-10-12')).status).toBe(502)
    })
  })

  describe('GET /api/brief/history', () => {
    it('최근 날짜 목록을 최신순으로 돌려준다', async () => {
      for (const date of ['2026-10-11', '2026-10-13', '2026-10-12']) {
        await sharedMemoryStore.save(makeBrief(date))
      }

      const response = await getHistory()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ dates: ['2026-10-13', '2026-10-12', '2026-10-11'] })
      expect(response.headers.get('cache-control')).toBe('no-store')
    })

    it('저장된 것이 없으면 빈 목록이다', async () => {
      expect(await (await getHistory()).json()).toEqual({ dates: [] })
    })

    it('기본은 30개, ?limit=로 줄일 수 있다', async () => {
      const list = jest.spyOn(sharedMemoryStore, 'listDates')

      await getHistory()
      await getHistory('?limit=5')

      expect(list.mock.calls).toEqual([[30], [5]])
    })

    it.each([['1'], ['90']])('limit=%s는 허용한다', async (limit) => {
      expect((await getHistory(`?limit=${limit}`)).status).toBe(200)
    })

    it.each([['0'], ['-1'], ['91'], ['1.5'], ['abc'], [''], ['1e2'], ['0x10']])(
      'limit=%s는 400이다',
      async (limit) => {
        const response = await getHistory(`?limit=${limit}`)

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: 'invalid limit' })
      },
    )

    it('저장소 설정이 없으면 503, 오류는 502다', async () => {
      delete process.env.SNAPSHOT_STORE
      expect((await getHistory()).status).toBe(503)

      process.env.UPSTASH_REDIS_REST_URL = 'https://x.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok'
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'))
      const response = await getHistory()
      expect(response.status).toBe(502)
      expect(await response.json()).toEqual({ error: 'storage error' })
    })
  })
})

import { getSnapshotStore, sharedMemoryStore } from '../../src/storage/getSnapshotStore'
import { makeBrief } from '../../__fixtures__/brief'

const KEYS = [
  'SNAPSHOT_STORE',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const

describe('getSnapshotStore', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  })

  it('아무 설정도 없으면 null이다 (조용히 메모리에 저장하지 않는다)', () => {
    expect(getSnapshotStore()).toBeNull()
  })

  it('SNAPSHOT_STORE=memory를 명시하면 메모리 저장소를 쓴다 (개발용)', async () => {
    process.env.SNAPSHOT_STORE = 'memory'
    sharedMemoryStore.clear()

    await getSnapshotStore()?.save(makeBrief())

    expect(await getSnapshotStore()?.get('2026-10-13')).toEqual(makeBrief())
  })

  it('SNAPSHOT_STORE의 다른 값은 무시한다', () => {
    process.env.SNAPSHOT_STORE = 'yes'
    expect(getSnapshotStore()).toBeNull()
  })

  describe('Upstash 설정', () => {
    it('UPSTASH_REDIS_REST_* 이름을 읽는다', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://a.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok-a'
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: null })))

      await getSnapshotStore()?.get('2026-10-13')

      expect(String(spy.mock.calls[0][0])).toBe('https://a.upstash.io')
      expect((spy.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer tok-a')
    })

    it('Vercel이 넣어 주는 KV_REST_API_* 이름도 읽는다', async () => {
      process.env.KV_REST_API_URL = 'https://b.upstash.io'
      process.env.KV_REST_API_TOKEN = 'tok-b'
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: null })))

      await getSnapshotStore()?.get('2026-10-13')

      expect(String(spy.mock.calls[0][0])).toBe('https://b.upstash.io')
    })

    it('두 이름이 모두 있으면 UPSTASH_REDIS_REST_*를 우선한다', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://a.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok-a'
      process.env.KV_REST_API_URL = 'https://b.upstash.io'
      process.env.KV_REST_API_TOKEN = 'tok-b'
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: null })))

      await getSnapshotStore()?.get('2026-10-13')

      expect(String(spy.mock.calls[0][0])).toBe('https://a.upstash.io')
    })

    it.each([
      ['주소만 있음', { UPSTASH_REDIS_REST_URL: 'https://a.upstash.io' }],
      ['토큰만 있음', { UPSTASH_REDIS_REST_TOKEN: 'tok' }],
      ['주소가 비어 있음', { UPSTASH_REDIS_REST_URL: '  ', UPSTASH_REDIS_REST_TOKEN: 'tok' }],
    ])('짝이 맞지 않으면 null이다: %s', (_name, env) => {
      Object.assign(process.env, env)
      expect(getSnapshotStore()).toBeNull()
    })

    it('설정 값 앞뒤 공백·줄바꿈은 지운다', async () => {
      process.env.UPSTASH_REDIS_REST_URL = ' https://a.upstash.io\n'
      process.env.UPSTASH_REDIS_REST_TOKEN = ' tok-a\r\n'
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: null })))

      await getSnapshotStore()?.get('2026-10-13')

      expect(String(spy.mock.calls[0][0])).toBe('https://a.upstash.io')
      expect((spy.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer tok-a')
    })

    it('주소가 https가 아니면 설정 오류로 던진다', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://insecure.example.com'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok'
      expect(() => getSnapshotStore()).toThrow()
    })
  })
})

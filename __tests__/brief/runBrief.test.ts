import { runBrief } from '../../src/brief/runBrief'
import { createMemoryStore } from '../../src/storage/memoryStore'
import type { SnapshotStore } from '../../src/storage/snapshotStore'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'
import { hostsOf, mockAllApis, TELEGRAM_CHAT, TELEGRAM_TOKEN } from '../../__fixtures__/mockApis'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const NOW = new Date('2026-10-12T22:00:00Z') // 한국 시간 2026-10-13 07:00
const env = { TELEGRAM_BOT_TOKEN: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID: TELEGRAM_CHAT }
const ALL_OK = { weather: 'ok', exchange: 'ok', news: 'ok', quote: 'ok' }

const run = (overrides: Partial<Parameters<typeof runBrief>[0]> = {}) =>
  runBrief({ cityValue: '부산', now: NOW, store: createMemoryStore(), env, ...overrides })

describe('runBrief', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('브리핑을 만들고 저장하고 전송한 뒤 상태만 돌려준다', async () => {
    mockAllApis()
    const store = createMemoryStore()

    const result = await run({ store })

    expect(result).toEqual({
      date: '2026-10-13',
      widgets: ALL_OK,
      snapshot: 'saved',
      telegram: 'sent',
    })
    expect(await store.get('2026-10-13')).toMatchObject({ date: '2026-10-13', city: POPULAR_CITIES[1] })
  })

  it('전송하는 글에는 같은 날짜의 브리핑이 담긴다', async () => {
    const spy = mockAllApis()

    await run()

    const telegramCall = spy.mock.calls.find(([input]) => new URL(String(input)).hostname === 'api.telegram.org')
    const body = JSON.parse(String(telegramCall?.[1]?.body))
    expect(body.chat_id).toBe(TELEGRAM_CHAT)
    expect(body.text).toContain('아침 브리핑 2026-10-13')
    expect(body.text).toContain('[날씨] 부산 · 부산광역시')
  })

  it('저장과 전송을 동시에 시작한다 (서로 독립이라 최악의 대기 시간이 합쳐지지 않게)', async () => {
    const spy = mockAllApis()
    const original = spy.getMockImplementation()
    let releaseSave!: () => void
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve
    })
    let saveStarted = false
    let telegramStartedBeforeSaveFinished = false
    const base = createMemoryStore()
    const store: SnapshotStore = {
      ...base,
      save: async (brief) => {
        saveStarted = true
        await saveGate // 저장이 끝나기를 기다리는 동안 전송이 시작되는지 본다
        await base.save(brief)
      },
    }
    spy.mockImplementation(async (input, init) => {
      if (new URL(String(input)).hostname === 'api.telegram.org') {
        telegramStartedBeforeSaveFinished = saveStarted
        releaseSave()
      }
      return original!(input, init)
    })

    const result = await run({ store })

    expect(telegramStartedBeforeSaveFinished).toBe(true)
    expect(result).toMatchObject({ snapshot: 'saved', telegram: 'sent' })
  })

  describe('저장과 전송은 서로 막지 않는다', () => {
    it('저장이 실패해도 Telegram은 보낸다', async () => {
      const spy = mockAllApis()
      const store: SnapshotStore = {
        ...createMemoryStore(),
        save: async () => {
          throw new Error('Upstash 응답 오류: 500')
        },
      }

      const result = await run({ store })

      expect(result).toMatchObject({ snapshot: 'failed', telegram: 'sent' })
      expect(hostsOf(spy)).toContain('api.telegram.org')
    })

    it('저장소가 설정되지 않아도(null) Telegram은 보낸다', async () => {
      mockAllApis()

      expect(await run({ store: null })).toMatchObject({ snapshot: 'failed', telegram: 'sent' })
    })

    it('전송이 실패해도 저장은 유지된다', async () => {
      mockAllApis(['telegram'])
      const store = createMemoryStore()

      const result = await run({ store })

      expect(result).toMatchObject({ snapshot: 'saved', telegram: 'failed' })
      expect(await store.get('2026-10-13')).not.toBeNull()
    })

    it('Telegram 설정이 없으면 호출 없이 failed다 (저장은 유지)', async () => {
      const spy = mockAllApis()
      const store = createMemoryStore()

      const result = await run({ store, env: {} })

      expect(result).toMatchObject({ snapshot: 'saved', telegram: 'failed' })
      expect(hostsOf(spy)).not.toContain('api.telegram.org')
    })
  })

  it('일부 위젯이 실패해도 저장·전송은 진행되고 요약에 error로 남는다', async () => {
    mockAllApis(['exchange'])
    const store = createMemoryStore()

    const result = await run({ store })

    expect(result).toEqual({
      date: '2026-10-13',
      widgets: { ...ALL_OK, exchange: 'error' },
      snapshot: 'saved',
      telegram: 'sent',
    })
    expect((await store.get('2026-10-13'))?.widgets.exchange).toBe('error')
  })

  describe('결과 객체와 로그', () => {
    it('결과에는 date·widgets·snapshot·telegram만 담는다 (위젯 데이터·이유·비밀값 없음)', async () => {
      mockAllApis(['telegram'])

      const result = await run()

      expect(Object.keys(result).sort()).toEqual(['date', 'snapshot', 'telegram', 'widgets'])
      const text = JSON.stringify(result)
      expect(text).not.toContain(TELEGRAM_TOKEN)
      expect(text).not.toContain('Unauthorized')
    })

    it('실패 이유는 서버 로그에 남기되 토큰은 남기지 않는다', async () => {
      mockAllApis(['telegram'])
      const store: SnapshotStore = {
        ...createMemoryStore(),
        save: async () => {
          throw new Error('Upstash 응답 오류: 500')
        },
      }

      await run({ store })

      const logged = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n')
      expect(logged).toContain('Upstash 응답 오류: 500')
      expect(logged).toContain('Telegram 오류 401: Unauthorized')
      expect(logged).not.toContain(TELEGRAM_TOKEN)
    })

    it('모두 성공하면 오류 로그가 없다', async () => {
      mockAllApis()

      await run()

      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  it('어떤 단계가 실패해도 던지지 않는다', async () => {
    mockAllApis(['weather', 'exchange', 'news', 'quote', 'telegram'])

    await expect(run({ store: null, env: {} })).resolves.toMatchObject({
      snapshot: 'failed',
      telegram: 'failed',
    })
  })
})

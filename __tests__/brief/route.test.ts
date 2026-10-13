import * as route from '../../src/app/api/cron/brief/route'
import { sharedMemoryStore } from '../../src/storage/getSnapshotStore'
import { hostsOf, mockAllApis, TELEGRAM_CHAT, TELEGRAM_TOKEN } from '../../__fixtures__/mockApis'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾼다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))

const SECRET = 'test-cron-secret'
const URL_ = 'http://localhost/api/cron/brief'
const ENV_KEYS = [
  'CRON_SECRET',
  'BRIEF_CITY',
  'SNAPSHOT_STORE',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
] as const

const post = (headers: Record<string, string> = {}) =>
  route.POST(new Request(URL_, { method: 'POST', headers }))
const authed = () => post({ authorization: `Bearer ${SECRET}` })
const storedDates = () => sharedMemoryStore.listDates(30)

describe('POST /api/cron/brief', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
    process.env.CRON_SECRET = SECRET
    process.env.SNAPSHOT_STORE = 'memory'
    process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_TOKEN
    process.env.TELEGRAM_CHAT_ID = TELEGRAM_CHAT
    sharedMemoryStore.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  })

  describe('인증 실패는 401이고 외부 API 호출도 저장도 없다', () => {
    it.each([
      ['헤더 없음', {}],
      ['틀린 토큰', { authorization: 'Bearer wrong' }],
      ['스킴이 다름', { authorization: `Basic ${SECRET}` }],
      ['토큰 없음', { authorization: 'Bearer ' }],
    ])('%s', async (_name, headers) => {
      const spy = mockAllApis()

      const response = await post(headers)

      expect(response.status).toBe(401)
      expect(response.headers.get('www-authenticate')).toBe('Bearer')
      expect(await response.json()).toEqual({ error: 'unauthorized' })
      expect(spy).not.toHaveBeenCalled()
      expect(await storedDates()).toEqual([])
    })
  })

  describe('CRON_SECRET이 설정되지 않았으면 닫힌 채로 500이다', () => {
    it.each([
      ['없음', undefined],
      ['빈 문자열', ''],
      ['공백뿐', '   '],
    ])('%s', async (_name, value) => {
      if (value === undefined) delete process.env.CRON_SECRET
      else process.env.CRON_SECRET = value
      const spy = mockAllApis()

      const response = await post({ authorization: `Bearer ${value ?? ''}` })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'server not configured' })
      expect(spy).not.toHaveBeenCalled()
      expect(await storedDates()).toEqual([])
    })
  })

  it.each([
    ['앞뒤 공백', ` ${SECRET} `],
    ['끝의 줄바꿈 (secret 복사 시 흔함)', `${SECRET}\n`],
    ['앞의 탭과 끝의 CRLF', `\t${SECRET}\r\n`],
  ])('비밀값 설정에 %s이 섞여도 정상 토큰이 통과한다', async (_name, configured) => {
    process.env.CRON_SECRET = configured
    mockAllApis()

    expect((await authed()).status).toBe(200)
  })

  it('비밀값 중간에 공백이 있으면 어떤 토큰도 담을 수 없어 설정 오류(500)로 닫는다', async () => {
    process.env.CRON_SECRET = 'has space'
    const spy = mockAllApis()

    const response = await post({ authorization: 'Bearer has space' })

    expect(response.status).toBe(500)
    expect(spy).not.toHaveBeenCalled()
  })

  describe('인증되면 만들고, 저장하고, 전송한다', () => {
    it('모두 성공하면 200과 상태 요약만 돌려주고 캐시하지 않는다', async () => {
      mockAllApis()

      const response = await authed()

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const body = await response.json()
      expect(Object.keys(body).sort()).toEqual(['date', 'snapshot', 'telegram', 'widgets'])
      expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(body.widgets).toEqual({ weather: 'ok', exchange: 'ok', news: 'ok', quote: 'ok' })
      expect(body.snapshot).toBe('saved')
      expect(body.telegram).toBe('sent')
    })

    it('브리핑이 저장되어 공개 조회에서 보인다', async () => {
      mockAllApis()

      const { date } = await (await authed()).json()

      expect(await storedDates()).toEqual([date])
      expect((await sharedMemoryStore.get(date))?.results.quote).toEqual({
        status: 'ok',
        data: { quote: 'Stay hungry.', author: 'Steve', translation: '계속 갈망하라.' },
      })
    })

    it('BRIEF_CITY 환경변수의 도시로 날씨를 만들어 저장한다', async () => {
      process.env.BRIEF_CITY = '제주'
      mockAllApis()

      const { date } = await (await authed()).json()

      expect((await sharedMemoryStore.get(date))?.city?.name).toBe('제주')
    })

    it('응답에 비밀값·토큰·chat id가 들어 있지 않다', async () => {
      mockAllApis(['telegram'])

      const text = JSON.stringify(await (await authed()).json())

      for (const secret of [SECRET, TELEGRAM_TOKEN, TELEGRAM_CHAT, 'Unauthorized']) {
        expect(text).not.toContain(secret)
      }
    })
  })

  describe('실패 처리: 하나라도 실패하면 502, 그래도 할 수 있는 일은 한다', () => {
    it('일부 위젯 실패는 요약에 error로 남기지만 응답은 200이다', async () => {
      mockAllApis(['exchange'])

      const response = await authed()

      expect(response.status).toBe(200)
      expect((await response.json()).widgets.exchange).toBe('error')
    })

    it('전송이 실패하면 502이고 저장은 유지된다', async () => {
      mockAllApis(['telegram'])

      const response = await authed()
      const body = await response.json()

      expect(response.status).toBe(502)
      expect(body).toMatchObject({ snapshot: 'saved', telegram: 'failed' })
      expect(await storedDates()).toEqual([body.date])
    })

    it('저장소가 없어도 전송은 하고 502로 알린다', async () => {
      delete process.env.SNAPSHOT_STORE
      const spy = mockAllApis()

      const response = await authed()

      expect(response.status).toBe(502)
      expect(await response.json()).toMatchObject({ snapshot: 'failed', telegram: 'sent' })
      expect(hostsOf(spy)).toContain('api.telegram.org')
    })

    it('Telegram 설정이 없으면 502이고 저장은 유지된다', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN
      mockAllApis()

      const response = await authed()

      expect(response.status).toBe(502)
      expect(await response.json()).toMatchObject({ snapshot: 'saved', telegram: 'failed' })
    })
  })

  it('POST만 지원한다 (GET 등은 내보내지 않는다)', () => {
    expect(Object.keys(route).sort()).toEqual(['POST'])
  })
})

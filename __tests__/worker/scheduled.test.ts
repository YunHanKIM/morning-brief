import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import worker, { callBrief } from '../../worker/src/index'

const SECRET = 'test-cron-secret'
const ENV = { BRIEF_URL: 'https://morning-brief.example.com', CRON_SECRET: SECRET }

function okResponse() {
  return new Response('{"telegram":"sent"}', { status: 200 })
}

describe('worker callBrief', () => {
  it('Bearer 토큰으로 /api/cron/brief를 POST한다', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse())

    await callBrief(ENV, fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://morning-brief.example.com/api/cron/brief')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`)
  })

  it('주소 끝의 슬래시가 있어도 경로가 겹치지 않는다', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse())

    await callBrief({ ...ENV, BRIEF_URL: 'https://morning-brief.example.com/' }, fetcher)

    expect(fetcher.mock.calls[0][0]).toBe('https://morning-brief.example.com/api/cron/brief')
  })

  it('리다이렉트를 따라가지 않고 3xx는 실패로 끝난다 (Authorization이 다른 주소로 넘어가지 않게)', async () => {
    const fetcher = jest.fn().mockImplementation(async () => new Response(null, { status: 307 }))

    await expect(callBrief(ENV, fetcher)).rejects.toThrow('307')
    expect(fetcher.mock.calls[0][1].redirect).toBe('manual')
  })

  it('시간 제한(signal)을 걸어 호출한다', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse())

    await callBrief(ENV, fetcher)

    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it.each([
    ['BRIEF_URL이 없으면', { ...ENV, BRIEF_URL: '' }],
    ['CRON_SECRET이 없으면', { ...ENV, CRON_SECRET: '' }],
    ['BRIEF_URL이 http이면', { ...ENV, BRIEF_URL: 'http://morning-brief.example.com' }],
  ])('%s 호출하지 않고 실패한다', async (_name, env) => {
    const fetcher = jest.fn()

    await expect(callBrief(env, fetcher)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    ['끝에 공백이 붙은', 'https://morning-brief.example.com/ '],
    ['끝에 BOM이 붙은', 'https://morning-brief.example.com/﻿'],
    ['앞에 BOM이 붙은', '﻿https://morning-brief.example.com'],
    ['줄바꿈이 붙은', 'https://morning-brief.example.com\n'],
  ])('BRIEF_URL이 %s 값이면 엉뚱한 주소로 보내지 않고 호출 전에 실패한다', async (_name, url) => {
    const fetcher = jest.fn()

    await expect(callBrief({ ...ENV, BRIEF_URL: url }, fetcher)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    ['BOM이 붙은', `﻿${SECRET}`],
    ['공백이 낀', `test cron`],
    ['줄바꿈이 붙은', `${SECRET}\n`],
    ['한글이 섞인', `${SECRET}키`],
  ])('CRON_SECRET이 %s 값이면 호출하지 않고 실패하며 값을 메시지에 싣지 않는다', async (_name, secret) => {
    const fetcher = jest.fn()

    const error = await callBrief({ ...ENV, CRON_SECRET: secret }, fetcher).catch((e: Error) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain(secret.trim())
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([401, 500, 502])('HTTP %i면 상태 코드와 응답 본문을 담아 실패한다', async (status) => {
    const fetcher = jest.fn().mockImplementation(async () => new Response('{"telegram":"failed"}', { status }))

    const error = await callBrief(ENV, fetcher).catch((e: Error) => e)

    expect((error as Error).message).toContain(`${status}`)
    expect((error as Error).message).toContain('telegram')
  })

  it('네트워크 오류도 실패로 끝나고 비밀값을 메시지에 싣지 않는다', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error(`boom ${SECRET}`))

    const error = await callBrief(ENV, fetcher).catch((e: Error) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain(SECRET)
  })

  it('실패해도 다시 호출하지 않는다 (재시도하면 Telegram이 중복 전송된다)', async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response('x', { status: 502 }))

    await callBrief(ENV, fetcher).catch(() => undefined)

    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('worker scheduled 핸들러', () => {
  it('scheduled 이벤트가 오면 브리핑 호출을 끝까지 기다린다', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse())
    const original = globalThis.fetch
    globalThis.fetch = fetcher
    try {
      await worker.scheduled({}, ENV)
    } finally {
      globalThis.fetch = original
    }

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  describe('호출이 끝날 때까지 기다리고 실패를 전달한다', () => {
    const original = globalThis.fetch
    afterEach(() => {
      globalThis.fetch = original
    })

    it('응답이 오기 전에는 끝나지 않는다', async () => {
      let release!: (r: Response) => void
      globalThis.fetch = jest.fn().mockReturnValue(new Promise<Response>((resolve) => (release = resolve)))
      let settled = false

      const done = worker.scheduled({}, ENV).then(() => {
        settled = true
      })
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(settled).toBe(false)

      release(okResponse())
      await done
      expect(settled).toBe(true)
    })

    it('호출이 실패하면 scheduled도 실패한다 (Cloudflare가 실패로 기록하도록)', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(new Response('x', { status: 502 }))

      await expect(worker.scheduled({}, ENV)).rejects.toThrow('502')
    })
  })
})

describe('worker/wrangler.toml', () => {
  const toml = readFileSync(join(process.cwd(), 'worker', 'wrangler.toml'), 'utf8')

  it('예약은 UTC 00:30 하나뿐이다 (= 한국 09:30)', () => {
    expect(toml).toMatch(/^crons = \["30 0 \* \* \*"\]$/m)
  })

  it('공개 주소(workers.dev)를 만들지 않는다 (cron 전용, 외부에서 호출할 곳이 없다)', () => {
    expect(toml).toMatch(/^workers_dev = false$/m)
  })

  it('시크릿 값이 파일에 적혀 있지 않다', () => {
    expect(toml).not.toMatch(/CRON_SECRET\s*=|BRIEF_URL\s*=/)
  })
})

import { createUpstashStore } from '../../src/storage/upstashStore'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'
import { makeBrief } from '../../__fixtures__/brief'

const URL_ = 'https://example-123.upstash.io'
const TOKEN = 'upstash-secret-token'

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const bodiesOf = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))

describe('createUpstashStore', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('주소가 https가 아니거나 토큰이 비어 있으면 만들지 못한다', () => {
    expect(() => createUpstashStore({ url: 'http://example.com', token: TOKEN })).toThrow()
    expect(() => createUpstashStore({ url: 'not a url', token: TOKEN })).toThrow()
    expect(() => createUpstashStore({ url: URL_, token: '' })).toThrow()
    expect(() => createUpstashStore({ url: URL_, token: 'has space' })).toThrow()
  })

  describe('save', () => {
    it('브리핑을 날짜 키로 저장하고 이력 목록에 날짜를 더한다', async () => {
      const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ result: 'OK' }))
      const store = createUpstashStore({ url: URL_, token: TOKEN })

      await store.save(makeBrief('2026-10-13'))

      expect(bodiesOf(spy)).toEqual([
        ['SET', 'brief:2026-10-13', JSON.stringify(makeBrief('2026-10-13'))],
        ['ZADD', 'briefs', '20261013', '2026-10-13'],
      ])
    })

    it('명령은 POST로, 토큰은 Authorization 헤더로, 5초 타임아웃과 함께 보낸다', async () => {
      const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ result: 'OK' }))
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

      await createUpstashStore({ url: URL_, token: TOKEN }).save(makeBrief())

      const [url, init] = spy.mock.calls[0]
      expect(String(url)).toBe(URL_)
      expect(init?.method).toBe('POST')
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
      expect(timeoutSpy).toHaveBeenCalledWith(5000)
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    })

    it('저장(SET)이 실패하면 이력에는 더하지 않는다', async () => {
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'ERR' }, 400))

      await expect(createUpstashStore({ url: URL_, token: TOKEN }).save(makeBrief())).rejects.toThrow()
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it.each([['형식이 아님', 'abc'], ['없는 날짜', '2026-02-31'], ['키 조작 시도', '2026-10-13*']])(
      '잘못된 날짜는 외부 호출 없이 거부한다: %s',
      async (_name, date) => {
        const spy = jest.spyOn(globalThis, 'fetch')

        await expect(
          createUpstashStore({ url: URL_, token: TOKEN }).save({ ...makeBrief(), date }),
        ).rejects.toThrow()
        expect(spy).not.toHaveBeenCalled()
      },
    )
  })

  describe('get', () => {
    it('날짜 키로 조회해 브리핑으로 읽는다', async () => {
      const spy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(json({ result: JSON.stringify(makeBrief('2026-10-13')) }))

      const brief = await createUpstashStore({ url: URL_, token: TOKEN }).get('2026-10-13')

      expect(bodiesOf(spy)).toEqual([['GET', 'brief:2026-10-13']])
      expect(brief).toEqual(makeBrief('2026-10-13'))
    })

    it('없는 날짜(result가 null)는 null이다', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ result: null }))

      expect(await createUpstashStore({ url: URL_, token: TOKEN }).get('2026-10-13')).toBeNull()
    })

    it.each([
      ['JSON이 아님', '{not json'],
      ['브리핑 모양이 아님', JSON.stringify({ hello: 'world' })],
      ['문자열이 아닌 값', 123],
    ])('저장된 값이 깨져 있으면 던진다 (없는 것으로 숨기지 않는다): %s', async (_name, result) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ result }))

      await expect(createUpstashStore({ url: URL_, token: TOKEN }).get('2026-10-13')).rejects.toThrow()
    })

    it.each([['형식이 아님', 'abc'], ['없는 날짜', '2026-13-01'], ['와일드카드', '*']])(
      '잘못된 날짜는 외부 호출 없이 거부한다: %s',
      async (_name, date) => {
        const spy = jest.spyOn(globalThis, 'fetch')

        await expect(createUpstashStore({ url: URL_, token: TOKEN }).get(date)).rejects.toThrow()
        expect(spy).not.toHaveBeenCalled()
      },
    )
  })

  describe('listDates', () => {
    it('최근 날짜부터 개수만큼 조회한다', async () => {
      const spy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(json({ result: ['2026-10-13', '2026-10-12'] }))

      const dates = await createUpstashStore({ url: URL_, token: TOKEN }).listDates(30)

      expect(bodiesOf(spy)).toEqual([['ZRANGE', 'briefs', '0', '29', 'REV']])
      expect(dates).toEqual(['2026-10-13', '2026-10-12'])
    })

    it('날짜가 아닌 항목은 걸러낸다', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        json({ result: ['2026-10-13', 'garbage', '2026-02-31', 5, '2026-10-12'] }),
      )

      expect(await createUpstashStore({ url: URL_, token: TOKEN }).listDates(30)).toEqual([
        '2026-10-13',
        '2026-10-12',
      ])
    })

    it('결과가 배열이 아니면 던진다', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ result: 'oops' }))

      await expect(createUpstashStore({ url: URL_, token: TOKEN }).listDates(30)).rejects.toThrow()
    })

    it.each([[0], [-1], [1.5], [Number.NaN]])('개수가 %p이면 외부 호출 없이 거부한다', async (limit) => {
      const spy = jest.spyOn(globalThis, 'fetch')

      await expect(createUpstashStore({ url: URL_, token: TOKEN }).listDates(limit)).rejects.toThrow()
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('브리핑 도시', () => {
    it('도시를 JSON으로 한 키에 저장한다', async () => {
      const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ result: 'OK' }))

      await createUpstashStore({ url: URL_, token: TOKEN }).saveCity(POPULAR_CITIES[1])

      expect(bodiesOf(spy)).toEqual([['SET', 'brief-city', JSON.stringify(POPULAR_CITIES[1])]])
    })

    it('저장된 도시를 꺼낸다', async () => {
      const spy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => json({ result: JSON.stringify(POPULAR_CITIES[1]) }))

      expect(await createUpstashStore({ url: URL_, token: TOKEN }).getCity()).toEqual(POPULAR_CITIES[1])
      expect(bodiesOf(spy)).toEqual([['GET', 'brief-city']])
    })

    it('저장된 값이 없으면 null이다', async () => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ result: null }))

      expect(await createUpstashStore({ url: URL_, token: TOKEN }).getCity()).toBeNull()
    })

    it.each([['깨진 JSON', 'not json'], ['도시 모양이 아님', '{"name":"x"}'], ['문자열이 아님', 5]])(
      '저장된 값을 읽을 수 없으면 오류다: %s',
      async (_name, result) => {
        jest.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ result }))

        await expect(createUpstashStore({ url: URL_, token: TOKEN }).getCity()).rejects.toThrow(
          '저장된 도시를 읽을 수 없습니다',
        )
      },
    )
  })

  describe('오류 처리', () => {
    it.each([
      ['HTTP 오류', () => new Response('nope', { status: 500 })],
      ['Upstash 오류 응답', () => json({ error: `ERR something with ${TOKEN}` }, 400)],
      ['JSON이 아닌 응답', () => new Response('<html>', { status: 200 })],
      ['result 없는 응답', () => json({})],
    ])('%s이면 던지고, 오류 메시지에 토큰이 들어가지 않는다', async (_name, respond) => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async () => respond())

      const error = await createUpstashStore({ url: URL_, token: TOKEN })
        .get('2026-10-13')
        .catch((e: Error) => e)

      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).not.toContain(TOKEN)
    })

    it('JSON이 아닌 응답의 본문은 오류 메시지에 담지 않는다', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('LEAKED-BODY-CONTENT', { status: 200 }))

      const error = await createUpstashStore({ url: URL_, token: TOKEN })
        .get('2026-10-13')
        .catch((e: Error) => e)

      expect((error as Error).message).not.toContain('LEAKED-BODY-CONTENT')
    })

    it('네트워크 오류도 던진다', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

      await expect(createUpstashStore({ url: URL_, token: TOKEN }).get('2026-10-13')).rejects.toThrow()
    })
  })
})

import { readTelegramConfig, sendTelegramMessage } from '../../src/notify/telegram'

const TOKEN = '123456789:AAE-secret_Token0123456789abcdefghij'
const CHAT = '-1001234567890'
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('readTelegramConfig', () => {
  it('토큰과 chat id를 읽는다', () => {
    expect(readTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: CHAT })).toEqual({
      token: TOKEN,
      chatId: CHAT,
    })
  })

  it('앞뒤 공백·줄바꿈은 지운다', () => {
    expect(
      readTelegramConfig({ TELEGRAM_BOT_TOKEN: ` ${TOKEN}\n`, TELEGRAM_CHAT_ID: `\t${CHAT}\r\n` }),
    ).toEqual({ token: TOKEN, chatId: CHAT })
  })

  it.each([[`@a${'b'.repeat(4)}`], [`@a${'b'.repeat(31)}`]])('채널 이름 길이의 경계(5자, 32자) %s는 허용한다', (chat) => {
    expect(readTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: chat })?.chatId).toBe(chat)
  })

  it.each([['12345'], ['987654321'], ['-100123'], ['@my_channel']])('chat id %s는 허용한다', (chat) => {
    expect(readTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: chat })?.chatId).toBe(chat)
  })

  it.each([
    ['토큰 없음', { TELEGRAM_CHAT_ID: CHAT }],
    ['chat id 없음', { TELEGRAM_BOT_TOKEN: TOKEN }],
    ['빈 토큰', { TELEGRAM_BOT_TOKEN: '  ', TELEGRAM_CHAT_ID: CHAT }],
    ['토큰에 슬래시(주소 조작)', { TELEGRAM_BOT_TOKEN: '123:abc/../x', TELEGRAM_CHAT_ID: CHAT }],
    ['토큰에 물음표', { TELEGRAM_BOT_TOKEN: '123:abc?x=1', TELEGRAM_CHAT_ID: CHAT }],
    ['토큰에 공백', { TELEGRAM_BOT_TOKEN: '123:ab cd', TELEGRAM_CHAT_ID: CHAT }],
    ['콜론 없는 토큰', { TELEGRAM_BOT_TOKEN: 'abcdef', TELEGRAM_CHAT_ID: CHAT }],
    ['숫자가 아닌 chat id', { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: 'abc' }],
    ['너무 짧은 채널 이름', { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: '@ab' }],
    ['33자 채널 이름 (Telegram 상한 32자 초과)', { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: `@a${'b'.repeat(32)}` }],
    ['chat id에 공백 포함', { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: '123 456' }],
  ])('설정이 틀리면 null이다: %s', (_name, env) => {
    expect(readTelegramConfig(env)).toBeNull()
  })
})

describe('sendTelegramMessage', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const send = (text = '안녕') => sendTelegramMessage({ token: TOKEN, chatId: CHAT, text })

  it('sendMessage를 POST JSON으로 호출한다 (서식 해석 없음, 링크 미리보기 끔)', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, result: {} }))

    await send('안녕 https://example.com')

    const [url, init] = spy.mock.calls[0]
    expect(String(url)).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`)
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    const body = JSON.parse(String(init?.body))
    expect(body).toEqual({
      chat_id: CHAT,
      text: '안녕 https://example.com',
      link_preview_options: { is_disabled: true },
    })
    expect(body.parse_mode).toBeUndefined()
  })

  it('10초 타임아웃 신호를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, result: {} }))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await send()

    expect(timeoutSpy).toHaveBeenCalledWith(10000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('ok:true이면 성공이다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, result: { message_id: 1 } }))

    expect(await send()).toEqual({ ok: true })
  })

  describe('실패는 던지지 않고 이유만 돌려주며, 이유에 토큰·주소가 없다', () => {
    const cases: Array<[string, () => Promise<Response> | Response, string]> = [
      ['Telegram 오류 응답', () => json({ ok: false, error_code: 400, description: 'Bad Request: chat not found' }, 400), '400'],
      ['인증 실패(401)', () => json({ ok: false, error_code: 401, description: 'Unauthorized' }, 401), '401'],
      ['한도 초과(429)', () => json({ ok: false, error_code: 429, description: 'Too Many Requests: retry after 5' }, 429), '429'],
      ['HTTP 오류(JSON 아님)', () => new Response('<html>bad gateway</html>', { status: 502 }), '502'],
      ['200인데 ok가 false', () => json({ ok: false }), 'ok'],
      ['200인데 ok가 없음', () => json({ result: {} }), 'ok'],
      ['200인데 JSON이 아님', () => new Response('nope', { status: 200 }), '형식'],
    ]

    it.each(cases)('%s', async (_name, respond, expected) => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async () => respond())

      const result = await send()

      expect(result.ok).toBe(false)
      const reason = (result as { ok: false; reason: string }).reason
      expect(reason).toContain(expected)
      expect(reason).not.toContain(TOKEN)
      expect(reason).not.toContain('api.telegram.org')
      expect(reason).not.toContain('bad gateway')
    })

    it('네트워크 오류 (오류 메시지에 토큰이 섞여 있어도 새지 않는다)', async () => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error(`getaddrinfo ENOTFOUND api.telegram.org/bot${TOKEN}/sendMessage`))

      const result = await send()

      expect(result.ok).toBe(false)
      const reason = (result as { ok: false; reason: string }).reason
      expect(reason).not.toContain(TOKEN)
      expect(reason).not.toContain('api.telegram.org')
    })

    it('시간 초과', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('timed out', 'TimeoutError'))

      const result = await send()

      expect(result.ok).toBe(false)
      expect((result as { ok: false; reason: string }).reason).toContain('시간')
    })
  })

  it.each([
    ['빈 글', ''],
    ['공백뿐', '   \n '],
    ['4096자 초과', 'a'.repeat(4097)],
  ])('보낼 수 없는 글은 호출 없이 실패로 돌려준다: %s', async (_name, text) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    const result = await send(text)

    expect(result.ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('정확히 4096자는 보낸다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, result: {} }))

    expect((await send('a'.repeat(4096))).ok).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

import { sendBriefToTelegram } from '../../src/notify/sendBrief'
import { makeBrief } from '../../__fixtures__/brief'

const TOKEN = '123456789:AAE-secret_Token0123456789abcdefghij'
const CHAT = '-1001234567890'
const env = { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: CHAT }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('sendBriefToTelegram', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('브리핑을 글로 만들어 설정된 chat으로 보내고 sent를 돌려준다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, result: {} }))

    const result = await sendBriefToTelegram(makeBrief('2026-10-13'), env)

    expect(result).toEqual({ status: 'sent' })
    const body = JSON.parse(String(spy.mock.calls[0][1]?.body))
    expect(body.chat_id).toBe(CHAT)
    expect(body.text).toContain('아침 브리핑 2026-10-13')
    expect(body.text).toContain('[날씨]')
  })

  it.each([
    ['설정 없음', {}],
    ['토큰 형식이 틀림', { TELEGRAM_BOT_TOKEN: 'bad/token', TELEGRAM_CHAT_ID: CHAT }],
  ])('%s이면 호출 없이 failed(설정 안내)를 돌려준다', async (_name, badEnv) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    const result = await sendBriefToTelegram(makeBrief(), badEnv)

    expect(result).toEqual({ status: 'failed', reason: 'telegram not configured' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('전송이 실패하면 던지지 않고 failed와 이유를 돌려준다 (토큰 비노출)', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: false, error_code: 400, description: 'Bad Request' }, 400))

    const result = await sendBriefToTelegram(makeBrief(), env)

    expect(result.status).toBe('failed')
    expect(JSON.stringify(result)).not.toContain(TOKEN)
  })

  it('네트워크가 끊겨도 던지지 않는다', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'))

    await expect(sendBriefToTelegram(makeBrief(), env)).resolves.toMatchObject({ status: 'failed' })
  })

  it('글 만들기에서 예외가 나도 던지지 않는다 (저장은 유지되어야 하므로)', async () => {
    const broken = { ...makeBrief(), results: null } as unknown as Parameters<typeof sendBriefToTelegram>[0]

    await expect(sendBriefToTelegram(broken, env)).resolves.toMatchObject({ status: 'failed' })
  })
})

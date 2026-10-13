const TIMEOUT_MS = 10000
const MAX_LENGTH = 4096

// 봇 토큰은 요청 주소 경로에 들어간다. 주소를 조작할 수 없도록 모양을 엄격히 제한한다 (예: 123456:ABC-def_ghi)
const TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]+$/
// 숫자 chat id(그룹은 음수) 또는 @채널이름(Telegram 규칙: 영문자로 시작, 5~32자)
const CHAT_PATTERN = /^(-?\d+|@[A-Za-z][A-Za-z0-9_]{4,31})$/

export interface TelegramConfig {
  token: string
  chatId: string
}

export type SendResult = { ok: true } | { ok: false; reason: string }

const clean = (value: string | undefined) => value?.trim() || undefined

// 설정이 없거나 모양이 틀리면 null
export function readTelegramConfig(
  env: Record<string, string | undefined> = process.env,
): TelegramConfig | null {
  const token = clean(env.TELEGRAM_BOT_TOKEN)
  const chatId = clean(env.TELEGRAM_CHAT_ID)
  if (!token || !chatId) return null
  if (!TOKEN_PATTERN.test(token) || !CHAT_PATTERN.test(chatId)) return null
  return { token, chatId }
}

// 실패해도 던지지 않고 이유를 돌려준다. 이유에는 토큰·주소·응답 본문을 담지 않는다
export async function sendTelegramMessage({
  token,
  chatId,
  text,
}: TelegramConfig & { text: string }): Promise<SendResult> {
  if (!TOKEN_PATTERN.test(token) || !CHAT_PATTERN.test(chatId)) {
    return { ok: false, reason: 'telegram not configured' }
  }
  if (!text.trim() || text.length > MAX_LENGTH) {
    return { ok: false, reason: '메시지 길이가 올바르지 않습니다' }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // parse_mode를 주지 않아 평문으로 보내고, 링크 미리보기는 끈다
      body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // JSON이 아닌 응답은 아래에서 형식 오류나 HTTP 오류로 처리한다
    }
    const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null

    if (record?.ok === true) return { ok: true }

    if (typeof record?.error_code === 'number') {
      const description = typeof record.description === 'string' ? record.description.slice(0, 100) : ''
      return { ok: false, reason: `Telegram 오류 ${record.error_code}: ${description}`.trimEnd() }
    }
    if (!response.ok) return { ok: false, reason: `HTTP 오류 ${response.status}` }
    if (!record) return { ok: false, reason: 'Telegram 응답 형식이 올바르지 않습니다' }
    return { ok: false, reason: 'Telegram 응답 ok가 true가 아닙니다' }
  } catch (error) {
    // fetch의 시간 초과 오류는 DOMException이라 instanceof 대신 이름으로 판별한다
    const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : ''
    const timedOut = name === 'TimeoutError' || name === 'AbortError'
    return { ok: false, reason: timedOut ? '시간이 초과되었습니다' : '네트워크 오류' }
  }
}
